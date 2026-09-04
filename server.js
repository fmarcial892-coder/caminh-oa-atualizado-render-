const express = require('express');
const crypto = require('crypto');
const path = require('path');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 10000;

// Keep the webhook body raw so HMAC verification uses the exact bytes received.
app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const secret = process.env.GGPIX_HMAC_SECRET;
    const signature = req.get('X-Webhook-Signature') || '';
    if (secret) {
      const match = /^t=(\d+),v1=([a-f0-9]+)$/i.exec(signature);
      if (!match) return res.status(401).json({ error: 'Assinatura ausente ou inválida' });
      const timestamp = Number(match[1]);
      if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) {
        return res.status(401).json({ error: 'Webhook expirado' });
      }
      const expected = crypto.createHmac('sha256', secret)
        .update(`${match[1]}.${req.body.toString('utf8')}`)
        .digest('hex');
      const a = Buffer.from(expected, 'utf8');
      const b = Buffer.from(match[2], 'utf8');
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return res.status(401).json({ error: 'Assinatura inválida' });
      }
    }
    const event = JSON.parse(req.body.toString('utf8') || '{}');
    console.log('GGPIX webhook recebido:', JSON.stringify(event));
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Webhook inválido' });
  }
});

app.use(express.json({ limit: '1mb' }));

app.post('/api/create-pix', async (req, res) => {
  try {
    const { amountCents, payerName, payerDocument, payerEmail, payerPhone, metadata } = req.body || {};
    const apiKey = process.env.GGPIX_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GGPIX_API_KEY não configurada no servidor' });
    if (!Number.isInteger(amountCents) || amountCents < 100 || amountCents > 50000000) {
      return res.status(400).json({ error: 'Valor inválido' });
    }
    const doc = String(payerDocument || '').replace(/\D/g, '');
    if (!payerName || !/^\d{11}$|^\d{14}$/.test(doc)) {
      return res.status(400).json({ error: 'Nome e CPF/CNPJ válido são obrigatórios' });
    }
    const externalId = 'lp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const base = `${req.protocol}://${req.get('host')}`;
    const payload = {
      amountCents,
      description: 'Pedido Linha Pesada',
      // Dados digitados pelo cliente no checkout.
      // Enviamos nos dois nomes aceitos/usados pela API para garantir que
      // a cobrança e a identificação do customer/devedor recebam os mesmos dados.
      payerName,
      payerDocument: doc,
      customerName: payerName,
      customerDocument: doc,
      externalId,
      payerEmail: payerEmail || undefined,
      payerPhone: payerPhone ? String(payerPhone).replace(/\D/g, '') : undefined,
      metadata: metadata || {},
      webhookUrl: process.env.GGPIX_WEBHOOK_URL || `${base}/api/webhook`
    };
    const response = await fetch('https://ggpixapi.com/api/v1/pix/in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey, 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; }
    catch (_) {
      console.error('GGPIXAPI retornou resposta não-JSON:', raw.slice(0, 500));
      return res.status(502).json({ error: 'A GGPIXAPI retornou uma resposta inválida. Tente novamente em instantes.' });
    }
    if (!response.ok) return res.status(response.status).json(data);
    const pixCopyPaste = data.pixCopyPaste || data.pixCode || data.brCode;
    if (!pixCopyPaste) return res.status(502).json({ error: 'A GGPIXAPI não retornou o código PIX Copia e Cola.' });
    let qrCode;
    try { qrCode = await QRCode.toDataURL(pixCopyPaste, { margin: 1, width: 280 }); }
    catch (qrErr) { console.error('Falha ao gerar QR Code:', qrErr); }
    return res.status(201).json({
      id: data.id || data.transactionId,
      status: data.status || 'PENDING',
      pixCopyPaste,
      pixCode: data.pixCode || pixCopyPaste,
      qrCode,
      externalId,
      payerName,
      payerDocument: doc
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno ao criar PIX' });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));
app.use(express.static(path.join(__dirname)));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, '0.0.0.0', () => console.log(`Linha Pesada online na porta ${PORT}`));
