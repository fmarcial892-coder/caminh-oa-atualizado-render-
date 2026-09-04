// Fluxo de confirmação de compra: só abre o WhatsApp após o pagamento PAID,
// e mantém o cliente na página de confirmação para o Google Tag Manager detectar o purchase.
(function(){
  window.monitorPayment=function(transactionId){
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
