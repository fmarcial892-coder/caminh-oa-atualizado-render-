const express = require('express');
const crypto = require('crypto');
const path = require('path');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 10000;

// BravoPay webhook: preserve raw JSON for HMAC verification.
app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const secret = process.env.BRAVOPAY_WEBHOOK_SECRET;
    const signature = req.get('BravoPay-Signature') || req.get('X-Bravopay-Signature') || '';
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
    console.log('BravoPay webhook recebido:', JSON.stringify(event));
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
    const apiKey = process.env.BRAVOPAY_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'BRAVOPAY_API_KEY não configurada no servidor' });
    if (!Number.isInteger(amountCents) || amountCents < 500) {
      return res.status(400).json({ error: 'Valor inválido. O mínimo da BravoPay é R$ 5,00.' });
    }
    const doc = String(payerDocument || '').replace(/\D/g, '');
    if (!payerName || !/^\d{11}$|^\d{14}$/.test(doc)) {
      return res.status(400).json({ error: 'Nome e CPF/CNPJ válido são obrigatórios' });
    }

    const externalReference = 'lp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const payload = {
      amount_cents: amountCents,
      method: 'pix',
      customer: {
        name: payerName,
        cpf: doc,
        email: payerEmail || undefined,
        phone: payerPhone ? String(payerPhone).replace(/\D/g, '') : undefined
      },
      description: 'Pedido Linha Pesada',
      external_reference: externalReference,
      metadata: metadata || {}
    };

    const response = await fetch('https://bravopay.club/api/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Idempotency-Key': externalReference,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; }
    catch (_) {
      console.error('BravoPay retornou resposta não-JSON:', raw.slice(0, 500));
      return res.status(502).json({ error: 'A BravoPay retornou uma resposta inválida. Tente novamente em instantes.' });
    }
    if (!response.ok) return res.status(response.status).json(data);

    const pixCopyPaste = data.pix?.copy_paste || data.pixCopyPaste || data.pixCode || data.brCode;
    if (!pixCopyPaste) return res.status(502).json({ error: 'A BravoPay não retornou o código PIX Copia e Cola.' });

    let qrCode;
    try { qrCode = await QRCode.toDataURL(pixCopyPaste, { margin: 1, width: 280 }); }
    catch (qrErr) { console.error('Falha ao gerar QR Code:', qrErr); }

    return res.status(201).json({
      id: data.id,
      status: data.status || 'PENDING',
      pixCopyPaste,
      pixCode: pixCopyPaste,
      qrCode,
      externalId: externalReference,
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