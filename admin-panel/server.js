'use strict';
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 10000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || '';
const INGEST_TOKEN = process.env.ADMIN_INGEST_TOKEN || '';
const DATABASE_URL = process.env.DATABASE_URL || '';
const isProduction = process.env.NODE_ENV === 'production';
const pool = DATABASE_URL ? new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.PGSSLMODE === 'disable' ? false : (isProduction ? { rejectUnauthorized: false } : false),
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
}) : null;

app.disable('x-powered-by');
app.use(express.json({ limit: '256kb' }));
app.use(express.static(path.join(__dirname, 'public'), { etag: true, maxAge: isProduction ? '1h' : 0 }));

const loginAttempts = new Map();
const safeEqual = (a, b) => {
  const aa = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  return aa.length === bb.length && aa.length > 0 && crypto.timingSafeEqual(aa, bb);
};
const b64 = value => Buffer.from(value).toString('base64url');
function sign(value) { return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('base64url'); }
function makeSession() {
  const payload = b64(JSON.stringify({ exp: Date.now() + 8 * 60 * 60 * 1000, role: 'admin' }));
  return payload + '.' + sign(payload);
}
function validSession(req) {
  const token = String(req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('cc_admin='));
  if (!token || !SESSION_SECRET) return false;
  const parts = token.slice('cc_admin='.length).split('.');
  if (parts.length !== 2 || !safeEqual(parts[1], sign(parts[0]))) return false;
  try { const p = JSON.parse(Buffer.from(parts[0], 'base64url').toString()); return p.role === 'admin' && p.exp > Date.now(); } catch (_) { return false; }
}
function requireAdmin(req, res, next) {
  if (validSession(req)) return next();
  return res.status(401).json({ error: 'Sessão expirada. Entre novamente.' });
}
function requireIngest(req, res, next) {
  if (INGEST_TOKEN && safeEqual(req.get('x-admin-ingest-token'), INGEST_TOKEN)) return next();
  return res.status(401).json({ error: 'Integração não autorizada.' });
}
function readyConfig() {
  return Boolean(ADMIN_PASSWORD && SESSION_SECRET && INGEST_TOKEN && DATABASE_URL);
}
async function initDb() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY,
      transaction_id TEXT UNIQUE NOT NULL,
      customer_name TEXT,
      customer_email TEXT,
      customer_phone TEXT,
      customer_document TEXT,
      address JSONB NOT NULL DEFAULT '{}'::jsonb,
      items JSONB NOT NULL DEFAULT '[]'::jsonb,
      amount_cents BIGINT NOT NULL DEFAULT 0,
      payment_status TEXT NOT NULL DEFAULT 'PENDING',
      payment_provider TEXT NOT NULL DEFAULT 'Elite PAYbr',
      source TEXT NOT NULL DEFAULT 'site-linha-pesada',
      campaign JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      paid_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
    CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status);
    CREATE TABLE IF NOT EXISTS leads (
      id BIGSERIAL PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      message TEXT,
      source TEXT NOT NULL DEFAULT 'Google Ads / site',
      campaign JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);
  `);
}
function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 100).map(item => ({
    id: String(item?.id || '').slice(0, 120),
    name: String(item?.name || item?.id || 'Produto').slice(0, 300),
    code: String(item?.code || '').slice(0, 120),
    qty: Math.max(1, Math.min(999, Number.parseInt(item?.qty, 10) || 1)),
    unitPriceCents: Math.max(0, Math.round(Number(item?.unitPrice || item?.unitPriceCents / 100 || 0) * 100))
  }));
}
function cleanText(value, max = 500) { return String(value || '').trim().slice(0, max); }

app.get('/health', (req, res) => res.json({ ok: true, service: 'Carlos Caminhões Admin', configured: readyConfig() }));
app.get('/api/session', (req, res) => res.json({ authenticated: validSession(req), configured: readyConfig() }));

app.post('/api/login', (req, res) => {
  if (!readyConfig()) return res.status(503).json({ error: 'Painel ainda não configurado. Defina as variáveis de ambiente e o banco PostgreSQL na Render.' });
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const attempt = loginAttempts.get(ip) || { count: 0, until: 0 };
  if (attempt.until > Date.now()) return res.status(429).json({ error: 'Muitas tentativas. Aguarde 15 minutos.' });
  if (!safeEqual(req.body?.password, ADMIN_PASSWORD)) {
    attempt.count += 1;
    if (attempt.count >= 6) { attempt.count = 0; attempt.until = Date.now() + 15 * 60 * 1000; }
    loginAttempts.set(ip, attempt);
    return res.status(401).json({ error: 'Senha incorreta.' });
  }
  loginAttempts.delete(ip);
  res.setHeader('Set-Cookie', 'cc_admin=' + makeSession() + '; HttpOnly; Path=/; SameSite=Strict; Max-Age=28800' + (isProduction ? '; Secure' : ''));
  return res.json({ ok: true });
});
app.post('/api/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'cc_admin=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0' + (isProduction ? '; Secure' : ''));
  res.json({ ok: true });
});

app.post('/api/ingest/order', requireIngest, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Banco não configurado.' });
  const o = req.body || {};
  const transactionId = cleanText(o.transactionId, 180);
  if (!transactionId) return res.status(400).json({ error: 'transactionId obrigatório.' });
  const amountCents = Math.max(0, Math.min(1000000000, Math.round(Number(o.amountCents) || 0)));
  const items = normalizeItems(o.items);
  const address = o.address && typeof o.address === 'object' ? o.address : {};
  const campaign = o.campaign && typeof o.campaign === 'object' ? o.campaign : {};
  const status = String(o.paymentStatus || 'PENDING').toUpperCase() === 'PAID' ? 'PAID' : 'PENDING';
  try {
    const q = await pool.query(`
      INSERT INTO orders (transaction_id, customer_name, customer_email, customer_phone, customer_document, address, items, amount_cents, payment_status, source, campaign, paid_at)
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10,$11::jsonb,CASE WHEN $9='PAID' THEN NOW() ELSE NULL END)
      ON CONFLICT (transaction_id) DO UPDATE SET
        customer_name=EXCLUDED.customer_name, customer_email=EXCLUDED.customer_email, customer_phone=EXCLUDED.customer_phone,
        customer_document=EXCLUDED.customer_document, address=EXCLUDED.address, items=EXCLUDED.items, amount_cents=EXCLUDED.amount_cents,
        source=EXCLUDED.source, campaign=EXCLUDED.campaign, updated_at=NOW(),
        payment_status=CASE WHEN orders.payment_status='PAID' THEN 'PAID' ELSE EXCLUDED.payment_status END,
        paid_at=COALESCE(orders.paid_at,EXCLUDED.paid_at)
      RETURNING id, transaction_id
    `, [transactionId, cleanText(o.customerName,200), cleanText(o.customerEmail,240), cleanText(o.customerPhone,80), cleanText(o.customerDocument,30), JSON.stringify(address), JSON.stringify(items), amountCents, status, cleanText(o.source,120) || 'site-linha-pesada', JSON.stringify(campaign)]);
    return res.json({ ok: true, orderId: q.rows[0].id, transactionId: q.rows[0].transaction_id });
  } catch (e) { console.error('ingest order:', e.message); return res.status(500).json({ error: 'Não foi possível registrar o pedido.' }); }
});

app.post('/api/ingest/payment', requireIngest, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Banco não configurado.' });
  const id = cleanText(req.body?.transactionId, 180);
  const incoming = String(req.body?.status || '').toUpperCase();
  if (!id) return res.status(400).json({ error: 'transactionId obrigatório.' });
  const paid = ['PAID','COMPLETO','CONCLUIDO','CONCLUIDO COM SUCESSO','PAGO','COMPLETED','SUCCESS'].includes(incoming);
  try {
    const q = await pool.query(`UPDATE orders SET payment_status=CASE WHEN $2 THEN 'PAID' ELSE payment_status END, paid_at=CASE WHEN $2 THEN COALESCE(paid_at,NOW()) ELSE paid_at END, updated_at=NOW() WHERE transaction_id=$1 RETURNING transaction_id,payment_status`, [id, paid]);
    return res.json({ ok: true, found: q.rowCount > 0, status: q.rows[0]?.payment_status || null });
  } catch (e) { console.error('ingest payment:', e.message); return res.status(500).json({ error: 'Não foi possível atualizar o pagamento.' }); }
});

app.post('/api/ingest/lead', requireIngest, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Banco não configurado.' });
  const l = req.body || {};
  try {
    const q = await pool.query('INSERT INTO leads (name,email,phone,message,source,campaign) VALUES ($1,$2,$3,$4,$5,$6::jsonb) RETURNING id', [
      cleanText(l.name,200), cleanText(l.email,240), cleanText(l.phone,80), cleanText(l.message,2000),
      cleanText(l.source,120) || 'Google Ads / site', JSON.stringify(l.campaign && typeof l.campaign === 'object' ? l.campaign : {})
    ]);
    res.json({ ok: true, leadId: q.rows[0].id });
  } catch (e) { console.error('ingest lead:', e.message); res.status(500).json({ error: 'Não foi possível registrar o contato.' }); }
});

app.get('/api/metrics', requireAdmin, async (req, res) => {
  try {
    const [orders, leads] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total_orders, COUNT(*) FILTER (WHERE payment_status='PAID')::int AS paid_orders, COUNT(*) FILTER (WHERE payment_status<>'PAID')::int AS pending_orders, COALESCE(SUM(amount_cents) FILTER (WHERE payment_status='PAID'),0)::bigint AS paid_cents, COALESCE(SUM(amount_cents) FILTER (WHERE payment_status<>'PAID'),0)::bigint AS pending_cents FROM orders`),
      pool.query('SELECT COUNT(*)::int AS total_leads FROM leads')
    ]);
    res.json({ orders: orders.rows[0], leads: leads.rows[0] });
  } catch (e) { console.error('metrics:', e.message); res.status(500).json({ error: 'Erro ao carregar indicadores.' }); }
});
app.get('/api/orders', requireAdmin, async (req, res) => {
  const search = cleanText(req.query.search, 180);
  const status = cleanText(req.query.status, 20).toUpperCase();
  try {
    const q = await pool.query(`
      SELECT id,transaction_id,customer_name,customer_email,customer_phone,customer_document,address,items,amount_cents,payment_status,source,campaign,created_at,updated_at,paid_at
      FROM orders
      WHERE ($1='' OR customer_name ILIKE '%'||$1||'%' OR customer_email ILIKE '%'||$1||'%' OR customer_phone ILIKE '%'||$1||'%' OR transaction_id ILIKE '%'||$1||'%')
        AND ($2='' OR payment_status=$2)
      ORDER BY created_at DESC LIMIT 500
    `, [search, ['PAID','PENDING','CANCELLED','EXPIRED'].includes(status) ? status : '']);
    res.json({ orders: q.rows });
  } catch (e) { console.error('orders:', e.message); res.status(500).json({ error: 'Erro ao carregar pedidos.' }); }
});
app.get('/api/leads', requireAdmin, async (req, res) => {
  try { const q = await pool.query('SELECT id,name,email,phone,message,source,campaign,created_at FROM leads ORDER BY created_at DESC LIMIT 500'); res.json({ leads: q.rows }); }
  catch (e) { console.error('leads:', e.message); res.status(500).json({ error: 'Erro ao carregar contatos.' }); }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, async () => {
  console.log('Carlos Caminhões Admin iniciado na porta ' + PORT);
  try { if (pool) { await initDb(); console.log('PostgreSQL conectado e tabelas verificadas.'); } else console.warn('DATABASE_URL ausente: configure o PostgreSQL.'); }
  catch (e) { console.error('Falha ao inicializar PostgreSQL:', e.message); }
});
