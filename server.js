const express=require('express');
const crypto=require('crypto');
const path=require('path');
const fs=require('fs');
const QRCode=require('qrcode');

const app=express();
const PORT=process.env.PORT||10000;
const ELITE_API='https://api.elitepaybr.com/api/v1';
const PRODUCT_IMAGES={r4:'https://www.mundodocaminhao.com.br/media/catalog/product/cache/1/image/200x200/9df78eab33525d08d6e5fb8d27136e95/6/6/666006524_roda_ferro_22_5_caminhao_750_3_.jpg.jpg',r5:'https://www.mundodocaminhao.com.br/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/5/9/59-042_thumb.jpg',r6:'https://m.magazineluiza.com.br/a-static/420x420/roda-de-aluminio-caminhao-better-old-trucker-225-x-825-alto-brilho-borda-larga/mundodocaminhaoloja/17-954/3b502225b1002e8f7589d5287092c6b3.jpeg',r7:'https://www.mundodocaminhao.com.br/media/catalog/product/cache/1/image/200x200/9df78eab33525d08d6e5fb8d27136e95/g/c/gcabt.jpg',r8:'https://www.mundodocaminhao.com.br/media/catalog/product/cache/1/image/374x/9df78eab33525d08d6e5fb8d27136e95/o/t/ot_a_o.jpg',r9:'https://www.mundodocaminhao.com.br/media/catalog/product/cache/1/image/200x200/9df78eab33525d08d6e5fb8d27136e95/6/4/645310149_31-M153H.jpg.jpg',r10:'https://www.mundodocaminhao.com.br/media/catalog/product/cache/1/image/200x200/9df78eab33525d08d6e5fb8d27136e95/6/5/650718171_2.jpg.jpg',p2:'https://s3.us-east-2.amazonaws.com/main.s3.pneubestec.astrus/tb_estrutura_produtos/257426/ls_648dcd116df070ffe1b6a652695a6e29.webp',p3:'https://images.tcdn.com.br/img/img_prod/495545/pneu_27580r225_misto_drc_ls755_146143l_16_lonas_p_1_20260428182125_69c785f47735.jpg',p4:'https://images.tcdn.com.br/img/img_prod/495545/pneu_29580r225_liso_drc_ls601_152148m_18_1_20260429095435_e643ee9bc289.jpg',p5:'https://s3.us-east-2.amazonaws.com/main.s3.pneubestec.astrus/tb_estrutura_produtos/257436/curve_9400dcd6b4bab3fb50d7432cdac29d85.webp',p7:'https://images.tcdn.com.br/img/img_prod/495545/pneu_29580r225_misto_drc_ls755_152148l_18_lonas_v_1_20260428180250_9002cfdfcbed.jpg',p9:'https://www.mundodocaminhao.com.br/media/catalog/product/cache/1/image/200x200/9df78eab33525d08d6e5fb8d27136e95/6/7/671841302_17-XB295CP.jpg.jpg',p6:'https://cdn.pneufree.com.br/XBRI/images/ModelosPneu/XBRI-ECOPLUS-B5/550/23.jpg',m1:'https://autoz.vteximg.com.br/arquivos/ids/224155-85-85/METAL-LEVE_C9720STD.jpg?v=638864702333330000',m2:'https://autoz.vteximg.com.br/arquivos/ids/224070-800-800/METAL-LEVE_BC852JSTD.jpg?v=638864702089070000',m3:'https://www.gamapecas.com.br/fabrica/metal-leve/codigo/k1253',m4:'https://autoz.vteximg.com.br/arquivos/ids/174588-800-800/48181-1-hires.jpg?v=636928461376730000',m5:'https://autoz.vteximg.com.br/arquivos/ids/224062-85-85/METAL-LEVE_BC1084P025.jpg?v=638864702042800000',m6:'https://autoz.vteximg.com.br/arquivos/ids/224060-85-85/METAL-LEVE_M21503STD.jpg?v=638864702026500000',m7:'https://cdn.shopify.com/s/files/1/0767/8246/9395/files/218609-filtro-blindado-de-combustivel-1732735351135_431x431.jpg?crop=center&height=800&v=1753319768&width=800',m8:'https://cdn.shopify.com/s/files/1/0767/8246/9395/files/elemento-para-filtro-de-ar-seco-mahle-metal-leve-lx273-sku.30d96b2b.jpg?height=180&v=1753319591&width=180',m9:'https://http2.mlstatic.com/D_NQ_NP_2X_959003-MLB74824543640_022024-F.webp',m10:'https://agroshopbr.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/i/file_name_3010568_1.jpg',motor:'https://acamargo.magehub.com.br/media/catalog/product/cache/ea36ed4511744f681e915b5979a4c73f/3/0/3010568_03_3010568.JPG',s1:'https://www.magazineluiza.com.br/amortecedor-de-suspensao-dianteiro-p-caminhao-cofap-l-13350/p/fg5ahejdg5/au/amor/?seller_id=autorama2',s2:'https://www.dungapecas.com.br/suspensao/copia-amortecedor-traseiro-micro-onibus-agrale-cofap-l13054',s4:'https://www.calpenautopecas.com.br/suspensao/amortecedor/amortecedor-traseiro/amortecedor-traseiro-agrale-7000-7500-ma-7-5t',s6:'https://www.pitstop.com.br/amortecedor-traseiro-super-agrale-volare-a6a8ma-1998-a-2011-cofap-l13828-1586/p',s9:'https://www.karhub.com.br/p/amortecedor-dianteiro-direito-ou-esquerdo-da-suspensao-para-agrale-ma-7-5-e-ma-8-5-cofap-l-12871-9524947'};
const imageCache=new Map();
const transactions=new Map();

function getProductImageSource(id){
  if(PRODUCT_IMAGES[id]) return PRODUCT_IMAGES[id];
  try{
    const products=JSON.parse(fs.readFileSync(path.join(__dirname,'products.json'),'utf8'));
    const p=products.find(x=>x&&x.id===id);
    return p&&typeof p.img==='string'?p.img:null;
  }catch(e){ console.error('products.json:',e.message); return null; }
}

async function fetchImage(url,depth=0){
  if(depth>2) return null;
  const encoded=encodeURIComponent(url);
  const sources=[url,`https://images.weserv.nl/?url=${encoded}`,`https://wsrv.nl/?url=${encoded}`,`https://wsrv.nl/?url=${encoded}&output=jpg`];
  for(const source of sources){
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),15000);
      const response=await fetch(source,{signal:controller.signal,headers:{'User-Agent':'Mozilla/5.0 (compatible; LinhaPesada/1.0)','Accept':'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8','Referer':source===url&&/^https?:\/\//i.test(url)?new URL(url).origin+'/':'https://wsrv.nl/'}});
      clearTimeout(timer);
      if(!response.ok) continue;
      const type=response.headers.get('content-type')||'';
      const body=Buffer.from(await response.arrayBuffer());
      if(body.length<500) continue;
      if(type.startsWith('image/')) return {body,type};
      if(type.includes('text/html')&&depth<2){
        const html=body.toString('utf8');
        const matches=[
          html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i),
          html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i),
          html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
        ];
        let imageUrl=matches.find(Boolean)?.[1];
        if(imageUrl){
          try{imageUrl=new URL(imageUrl,url).href}catch(_){}
          const image=await fetchImage(imageUrl,depth+1);
          if(image) return image;
        }
      }
    }catch(e){ console.error('imagem fonte:',source,e.message); }
  }
  return null;
}

app.get('/produto-imagem/:id',async(req,res)=>{
  const url=getProductImageSource(req.params.id);
  if(!url||!/^https?:\/\//i.test(url)) return res.status(404).end();
  try{
    if(imageCache.has(url)){
      const c=imageCache.get(url);
      res.set('Content-Type',c.type);
      res.set('Cache-Control','public,max-age=86400');
      return res.send(c.body);
    }
    const image=await fetchImage(url);
    if(!image) return res.status(502).end();
    imageCache.set(url,image);
    res.set('Content-Type',image.type);
    res.set('Cache-Control','public,max-age=86400');
    return res.send(image.body);
  }catch(e){ console.error('produto-imagem:',e.message); return res.status(502).end(); }
});

function verifyEliteWebhook(req){
  const secret=process.env.ELITEPAY_CLIENT_SECRET;
  const ts=req.get('X-Elite-Timestamp')||'';
  const sig=req.get('X-Elite-Signature')||'';
  const rawBody=Buffer.isBuffer(req.body)?req.body:Buffer.from(JSON.stringify(req.body||{}));
  if(!secret) return {ok:true,rawBody};
  if(!ts||!sig) return {ok:false,error:'Assinatura Elite PAY ausente',rawBody};
  const expected='sha256='+crypto.createHmac('sha256',secret).update(ts+'.'+rawBody.toString('utf8')).digest('hex');
  const a=Buffer.from(sig),b=Buffer.from(expected);
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b)) return {ok:false,error:'Assinatura Elite PAY inválida',rawBody};
  return {ok:true,rawBody};
}

function eliteWebhookHandler(req,res){
  try{
    const verified=verifyEliteWebhook(req);
    if(!verified.ok) return res.status(401).json({error:verified.error});
    const event=JSON.parse(verified.rawBody.toString('utf8'));
    const id=String(event?.transactionId||event?.transaction_id||event?.data?.transactionId||event?.data?.transaction_id||'').trim();
    const eventName=String(event?.event||event?.type||'').toUpperCase();
    const state=String(event?.transactionState||event?.status||event?.data?.transactionState||event?.data?.status||'').toUpperCase();
    const paidEvents=['DEPOSITO_COMPLETO','DEPOSIT_COMPLETED','PAYMENT_SUCCESS','PAYMENT_CONFIRMED','PAYMENT_PAID'];
    const paidStates=['COMPLETO','CONCLUIDO','CONCLUIDO COM SUCESSO','PAGO','PAID','COMPLETED','SUCCESS'];
    const paid=paidEvents.includes(eventName)||paidStates.includes(state);
    if(id){
      const previous=transactions.get(id)||{};
      transactions.set(id,{...previous,...event,status:paid?'PAID':state||eventName||'PENDING'});
      console.log('Elite PAY webhook recebido:',JSON.stringify({id,event:eventName,state,status:paid?'PAID':'PENDING'}));
    }else{
      console.warn('Elite PAY webhook sem transactionId:',JSON.stringify(event));
    }
    return res.json({ok:true,paid,id});
  }catch(e){
    console.error('Elite webhook:',e);
    return res.status(400).json({error:'Webhook inválido'});
  }
}

app.post('/api/webhook',express.raw({type:'application/json'}),eliteWebhookHandler);
app.post('/api/webhook/elitepay',express.raw({type:'application/json'}),eliteWebhookHandler);

app.use(express.json({limit:'1mb'}));

app.post('/api/create-pix',async(req,res)=>{
  try{
    const {amount,payerName,payerDocument,metadata}=req.body||{};
    const clientId=process.env.ELITEPAY_CLIENT_ID;
    const clientSecret=process.env.ELITEPAY_CLIENT_SECRET;
    const doc=String(payerDocument||'').replace(/\D/g,'');
    if(!clientId||!clientSecret) return res.status(500).json({error:'ELITEPAY_CLIENT_ID/ELITEPAY_CLIENT_SECRET não configurados no servidor'});
    if(typeof amount!=='number'||!Number.isFinite(amount)||amount<=0) return res.status(400).json({error:'Valor inválido.'});
    const amountText=String(amount);
    if(!/^\d+(?:\.\d{1,2})?$/.test(amountText)) return res.status(400).json({error:'Valor inválido: amount deve ser um número com no máximo duas casas decimais.'});
    if(!payerName||!/^\d{11}$|^\d{14}$/.test(doc)) return res.status(400).json({error:'Nome e CPF/CNPJ válido são obrigatórios'});
    const amountForElite=Number(amountText);
    const response=await fetch(`${ELITE_API}/deposit`,{
      method:'POST',
      headers:{'x-client-id':clientId,'x-client-secret':clientSecret,'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({amount:amountForElite,description:'Pedido Linha Pesada',payerName,payerDocument:doc})
    });
    const raw=await response.text();
    let data={};
    try{data=raw?JSON.parse(raw):{}}catch(_){}
    console.log('Elite PAY /deposit:', JSON.stringify({status:response.status, ok:response.ok, body:data}));
    if(!response.ok||data?.success===false){
      const msg=data?.message||data?.error?.message||data?.error||data?.detail||'A Elite PAY recusou a criação do PIX.';
      return res.status(response.status>=400?response.status:502).json({error:String(msg), gatewayStatus:response.status});
    }
    const id=String(data.transactionId||'').trim();
    const pix=String(data.copyPaste||'').trim();
    if(!id||!pix) return res.status(502).json({error:'A Elite PAY criou a transação, mas não retornou transactionId/copyPaste.'});
    let qr=data.qrcodeUrl||null;
    if(typeof qr==='string'&&qr.startsWith('base64:')) qr='data:image/png;base64,'+qr.slice(7);
    if(!qr){
      try{qr=await QRCode.toDataURL(pix,{margin:1,width:280});}catch(e){console.error('QR local:',e);}
    }
    transactions.set(id,{...data,transactionId:id,metadata:metadata||{},status:String(data.status||'PENDENTE').toUpperCase()==='COMPLETO'?'PAID':'PENDING'});
    return res.json({id,status:data.status||'PENDENTE',pixCopyPaste:pix,pixCode:pix,qrCode:qr,expiresAt:null,externalId:id,payerName,payerDocument:doc});
  }catch(e){
    console.error('create-pix:',e);
    return res.status(502).json({error:'Não foi possível conectar à Elite PAY para criar o PIX.'});
  }
});

app.get('/api/payment-status/:id',(req,res)=>{
  const id=String(req.params.id||'').trim();
  if(!id) return res.status(400).json({error:'Transação inválida'});
  if(!process.env.ELITEPAY_CLIENT_ID||!process.env.ELITEPAY_CLIENT_SECRET) return res.status(500).json({error:'Credenciais Elite PAY não configuradas no servidor'});
  const local=transactions.get(id);
  const state=String(local?.status||local?.transactionState||'PENDING').toUpperCase();
  const paid=local?.status==='PAID'||['COMPLETO','CONCLUIDO','PAGO','PAID'].includes(state);
  return res.json({
    id,
    status:paid?'PAID':'PENDING',
    amountCents:Math.round(Number(local?.value||0)*100),
    externalReference:local?.externalReference||id,
    metadata:local?.metadata||{}
  });
});

app.get('/health',(req,res)=>res.json({
  ok:true,
  gateway:'Elite PAYbr',
  elitepayConfigured:Boolean(process.env.ELITEPAY_CLIENT_ID&&process.env.ELITEPAY_CLIENT_SECRET)
}));

app.get('/pedido-confirmado.html',(req,res)=>{
  res.set('Content-Security-Policy',"default-src 'self';script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net;script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net;img-src 'self' data: blob: https:;connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net;style-src 'self' 'unsafe-inline' https:;font-src 'self' data: https:;frame-src 'self' https://www.googletagmanager.com https://www.google.com;");
  return res.sendFile(path.join(__dirname,'pedido-confirmado.html'));
});

app.use(express.static(path.join(__dirname)));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.listen(PORT,'0.0.0.0',()=>console.log(`Linha Pesada online na porta ${PORT} - Elite PAYbr`));