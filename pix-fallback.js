(function(){
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const brl=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const whatsapp='5512981160171';
  function showFallback(total,error){
    const box=document.getElementById('checkoutContent');
    if(!box)return;
    const items=Array.isArray(window.cart)?window.cart.map(i=>{const p=window.products?.find(x=>x.id===i.id);return p?`${i.qty}x ${p.name} (${p.code})`:''}).filter(Boolean):[];
    const name=(document.getElementById('buyerName')?.value||'').trim();
    const text=`Olá! Tentei finalizar uma compra pelo site, mas o PIX não conseguiu ser gerado. Quero finalizar com um especialista. Cliente: ${name||'não informado'}. Itens: ${items.join(' | ')||'verificar pedido'}. Total PIX: ${brl(total)}.`;
    box.innerHTML=`<div class="eyebrow">PIX INDISPONÍVEL AGORA</div><h2>Vamos finalizar pelo WhatsApp</h2><p style="color:#91a1ae;font-size:13px">Tentamos gerar o PIX novamente, mas o gateway não retornou a cobrança. Para você não ficar sem conseguir comprar, fale agora com um especialista.</p><a class="checkout" style="display:block;text-align:center;text-decoration:none" target="_blank" rel="noopener" href="https://api.whatsapp.com/send/?phone=${whatsapp}&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0">Finalizar compra com especialista no WhatsApp</a><button class="expert" style="width:100%;margin-top:10px" onclick="checkout()">Voltar ao checkout e tentar novamente</button>`;
  }
  window.createPix=async function(total){
    const button=document.querySelector('#checkoutContent .checkout');
    if(button){button.disabled=true;button.textContent='Gerando PIX...'}
    const name=(document.getElementById('buyerName')?.value||'').trim();
    const email=(document.getElementById('buyerEmail')?.value||'').trim();
    const doc=(document.getElementById('buyerDoc')?.value||'').replace(/\D/g,'');
    const phone=(document.getElementById('buyerPhone')?.value||'').trim();
    const address=(document.getElementById('buyerAddress')?.value||'').trim();
    if(!name||!/^([0-9]{11}|[0-9]{14})$/.test(doc)){
      if(button){button.disabled=false;button.textContent='Gerar PIX e pagar'}
      alert('Informe nome e CPF/CNPJ válido.');return;
    }
    const payload={amountCents:Math.round(total*100),payerName:name,payerDocument:doc,payerEmail:email,payerPhone:phone,metadata:{items:window.cart||[],source:'site-linha-pesada',address}};
    const box=document.getElementById('checkoutContent');
    let lastError=null;
    for(let attempt=1;attempt<=2;attempt++){
      try{
        const r=await fetch('/api/create-pix',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});
        const raw=await r.text();let data={};
        try{data=raw?JSON.parse(raw):{}}catch(_){throw new Error(`Servidor retornou resposta inválida (HTTP ${r.status})`)}
        if(!r.ok){const c=[data?.error?.message,data?.error,data?.message,data?.detail,data?.description];const f=c.find(v=>typeof v==='string'&&v.trim());throw new Error(f?`${f} (HTTP ${r.status})`:`Falha ao criar PIX (HTTP ${r.status})`)}
        const pix=data.pixCopyPaste||data.pixCode||data.brCode;
        if(!pix)throw new Error('O gateway não retornou o PIX Copia e Cola.');
        const qr=data.qrCode||data.qrCodeImage;
        box.innerHTML=`<div class="eyebrow">PIX GERADO</div><h2>Agora é só pagar</h2><p style="color:#91a1ae;font-size:12px">Use o QR Code ou copie o código abaixo.</p>${qr?`<div class="pix-qr"><img src="${qr}" alt="QR Code PIX"></div>`:''}<div class="pix-box"><strong>PIX Copia e Cola</strong><div class="pix-code" id="pixCode">${pix}</div><button class="copy" onclick="navigator.clipboard.writeText(document.getElementById('pixCode').innerText);this.textContent='Copiado!'">Copiar código PIX</button></div>${data.expiresAt?`<div class="pay-note">Expira em ${new Date(data.expiresAt).toLocaleString('pt-BR')}.</div>`:''}`;
        window.cart=[];localStorage.setItem('lp_cart','[]');if(typeof window.updateCount==='function')window.updateCount();return;
      }catch(e){lastError=e;if(attempt===1)await sleep(1500)}
    }
    showFallback(total,lastError);
  };
})();
