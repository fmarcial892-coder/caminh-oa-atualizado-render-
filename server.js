const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 10000;
const API = 'https://bravopay.club/api/v1/transactions';

// Fontes reais corrigidas para os produtos que tinham URL quebrada.
const PRODUCT_IMAGES = {
  r4: 'https://www.mundodocaminhao.com.br/media/catalog/product/cache/1/image/200x200/9df78eab33525d08d6e5fb8d27136e95/6/6/666006524_roda_ferro_22_5_caminhao_750_3_.jpg.jpg',
  r5: 'https://www.mundodocaminhao.com.br/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/5/9/59-042_thumb.jpg',
  p2: 'https://s3.us-east-2.amazonaws.com/main.s3.pneubestec.astrus/tb_estrutura_produtos/257426/ls_648dcd116df070ffe1b6a652695a6e29.webp',
  p3: 'https://images.tcdn.com.br/img/img_prod/495545/pneu_27580r225_misto_drc_ls755_146143l_16_lonas_p_1_20260428182125_69c785f47735.jpg',
  p4: 'https://images.tcdn.com.br/img/img_prod/495545/pneu_29580r225_liso_drc_ls601_18_lonas_152148m_18_1_20260429095435_e643ee9bc289.jpg',
  p5: 'https://s3.us-east-2.amazonaws.com/main.s3.pneubestec.astrus/tb_estrutura_produtos/257436/curve_9400dcd6b4bab3fb50d7432cdac29d85.webp',
  p7: 'https://images.tcdn.com.br/img/img_prod/495545/pneu_29580r225_misto_drc_ls755_152148l_18_lonas_v_1_20260428180250_9002cfdfcbed.jpg',
  motor: 'https://acamargo.magehub.com.br/media/catalog/product/cache/ea36ed4511744f681e915b5979a4c73f/3/0/3010568_03_3010568.JPG'
};
const imageCache = new Map();

function getProductImageSource(id) {
  if (PRODUCT_IMAGES[id]) return PRODUCT_IMAGES[id];
  try {
    const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8'));
    const product = products.find(p => p && p.id === id);
    return product && typeof product.img === 'string' ? product.img : null;
  } catch (e) {
    console.error('products.json:', e.message);
    return null;
  }
}

async function fetchImage(url) {
  const sources = [url];
  // Se a loja bloquear hotlink, tenta o mesmo arquivo por um proxy de imagens.
  try {
    const proxy = 'https://images.weserv.nl/?url=' + encodeURIComponent(url);
    sources.push(proxy);
  } catch (_) {}

  for (const source of sources) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(source, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinhaPesada/1.0)',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': source === url ? new URL(url).origin + '/' : 'https://images.weserv.nl/'
        }
      });
      clearTimeout(timer);
      if (!response.ok) continue;
      const body = Buffer.from(await response.arrayBuffer());
      const type = response.headers.get('content-type') || 'image/jpeg';
      if (body.length < 500 || !type.startsWith('image/')) continue;
      return { body, type };
    } catch (e) {
      console.error('imagem fonte:', source, e.message);
    }
  }
  return null;
}

app.get('/produto-imagem/:id', async (req, res) => {
  const url = getProductImageSource(req.params.id);
  if (!url || !/^https?:\/\//i.test(url)) return res.status(404).end();
  try {
    if (imageCache.has(url)) {
      const cached = imageCache.get(url);
      res.set('Content-Type', cached.type);
      res.set('Cache-Control', 'public, max-age=86400');
      return res.send(cached.body);
    }
    const image = await fetchImage(url);
    if (!image) return res.status(502).end();
    imageCache.set(url, image);
    res.set('Content-Type', image.type);
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send(image.body);
  } catch (e) {
    console.error('produto-imagem:', req.params.id, e.message);
    return res.status(502).end();
  }
});

app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const secret = process.env.BRAVOPAY_WEBHOOK_SECRET;
    const sig = req.get('BravoPay-Signature') || req.get('X-Bravopay-Signature') || '';
    if (secret) {
      const m = /^t=(\d+),v1=([a-f0-9]+)$/i.exec(sig);
      if (!m) return res.status(401).json({ error: 'Assinatura ausente ou inválida' });
      if (Math.abs(Date.now() / 1000 - Number(m[1])) > 300) return res.status(401).json({ error: 'Webhook expirado' });
      const expected = crypto.createHmac('sha256', secret).update(`${m[1]}.${req.body.toString('utf8')}`).digest('hex');
      const a = Buffer.from(expected), b = Buffer.from(m[2]);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'Assinatura inválida' });
    }
    console.log('BravoPay webhook:', req.body.toString('utf8'));
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: 'Webhook inválido' });
  }
});

app.use(express.json({ limit: '1mb' }));

app.post('/api/create-pix', async (req, res) => {
  try {
    const { amountCents, payerName, payerDocument, payerEmail, payerPhone, metadata } = req.body || {};
    const key = process.env.BRAVOPAY_API_KEY;
    const doc = String(payerDocument || '').replace(/\D/g, '');

    if (!key) return res.status(500).json({ error: 'BRAVOPAY_API_KEY não configurada no servidor' });
    if (!Number.isInteger(amountCents) || amountCents < 500) return res.status(400).json({ error: 'Valor inválido. O mínimo é R$ 5,00.' });
    if (!payerName || !/^(\d{11}|\d{14})$/.test(doc)) return res.status(400).json({ error: 'Nome e CPF/CNPJ válido são obrigatórios' });

    const ref = 'lp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const customer = { name: payerName, cpf: doc };
    if (payerEmail) customer.email = payerEmail;
    if (payerPhone) customer.phone = String(payerPhone).replace(/\D/g, '');

    const payload = {
      amount_cents: amountCents,
      method: 'pix',
      customer,
      description: 'Pedido Linha Pesada',
      external_reference: ref,
      metadata: metadata || {},
      expires_in: 3600
    };

    let response;
    let data = {};

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        response = await fetch(API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'Idempotency-Key': ref,
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } catch (networkError) {
        console.error('BravoPay conexão:', networkError);
        if (attempt === 2) return res.status(502).json({ error: 'Não foi possível conectar ao gateway PIX.' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      const raw = await response.text();
      try { data = raw ? JSON.parse(raw) : {}; } catch (_) { data = {}; }
      if (response.ok || ![429, 500, 502, 503, 504].includes(response.status) || attempt === 2) break;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!response) return res.status(502).json({ error: 'Não foi possível conectar ao gateway PIX.' });
    if (!response.ok) {
      const msg = data?.error?.message || data?.message || data?.error || 'O gateway recusou a criação do PIX.';
      return res.status(response.status).json({ error: String(msg), details: data?.error?.details || data?.details || null });
    }

    const pix = String(data?.pix?.copy_paste || '').trim();
    if (!pix) return res.status(502).json({ error: 'O gateway criou a transação, mas não retornou o PIX Copia e Cola.' });

    let qr = data?.pix?.qr_code || null;
    if (!qr) {
      try { qr = await QRCode.toDataURL(pix, { margin: 1, width: 280 }); } catch (e) { console.error('QR local:', e); }
    }

    return res.status(200).json({
      id: data.id,
      status: data.status || 'PENDING',
      pixCopyPaste: pix,
      pixCode: pix,
      qrCode: qr,
      expiresAt: data?.pix?.expires_at || null,
      externalId: ref,
      payerName,
      payerDocument: doc
    });
  } catch (e) {
    console.error('create-pix:', e);
    return res.status(500).json({ error: 'Erro interno ao criar PIX. Tente novamente.' });
  }
});

app.get('/health', (req, res) => res.json({ ok: true, bravopayConfigured: Boolean(process.env.BRAVOPAY_API_KEY) }));

app.use(express.static(path.join(__dirname)));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.listen(PORT, '0.0.0.0', () => console.log(`Linha Pesada online na porta ${PORT}`));
