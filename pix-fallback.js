(function(){
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const brl=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const whatsapp='5512981160171';
  const originalCreatePix=window.createPix;
  if(typeof originalCreatePix!=='function')return;
  function showFallback(total){
    const box=document.getElementById('checkoutContent');
    if(!box)return;
    const name=(document.getElementById('buyerName')?.value||'').trim();
    const text=`Olá! Tentei finalizar uma compra pelo site, mas o PIX não conseguiu ser gerado mesmo após uma nova tentativa. Quero finalizar com um especialista. Cliente: ${name||'não informado'}. Total PIX: ${brl(total)}.`;
    box.innerHTML=`<div class="eyebrow">PIX INDISPONÍVEL AGORA</div><h2>Vamos finalizar pelo WhatsApp</h2><p style="color:#91a1ae;font-size:13px">Tentamos gerar o PIX novamente, mas o gateway não retornou a cobrança. Para você não ficar sem conseguir comprar, fale agora com um especialista.</p><a class="checkout" style="display:block;text-align:center;text-decoration:none" target="_blank" rel="noopener" href="https://api.whatsapp.com/send/?phone=${whatsapp}&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0">Finalizar compra com especialista no WhatsApp</a><button class="expert" style="width:100%;margin-top:10px" onclick="checkout()">Voltar ao checkout e tentar novamente</button>`;
  }
  window.createPix=async function(total){
    let failed=false;
    const originalFetch=window.fetch;
    window.fetch=async function(input,init){
      const url=typeof input==='string'?input:(input?.url||'');
      if(!url.includes('/api/create-pix'))return originalFetch(input,init);
      let response=await originalFetch(input,init);
      if(!response.ok){
        await sleep(1500);
        response=await originalFetch(input,init);
        if(!response.ok)failed=true;
      }
      return response;
    };
    try{await originalCreatePix(total)}finally{window.fetch=originalFetch;if(failed)showFallback(total)}
  };

  // Após PAID, vá para a página de confirmação para o GTM detectar o purchase.
  // O WhatsApp permanece manual: o cliente precisa clicar no botão.
  window.monitorPayment=function(transactionId){
    localStorage.setItem('lp_last_transaction_id',String(transactionId||''));
    let tries=0;
    const maxTries=240;
    const timer=setInterval(async()=>{
      tries++;
      try{
        const r=await fetch(`/api/payment-status/${encodeURIComponent(transactionId)}?t=${Date.now()}`,{cache:'no-store'});
        if(!r.ok)return;
        const data=await r.json();
        if(String(data.status).toUpperCase()==='PAID'){
          clearInterval(timer);
          localStorage.removeItem('lp_last_order_pending');
          localStorage.setItem('lp_last_transaction_id',String(transactionId));
          window.location.href=`/pedido-confirmado.html?transaction_id=${encodeURIComponent(transactionId)}`;
        }
      }catch(_){ }
      if(tries>=maxTries)clearInterval(timer);
    },3000);
  };
})();
