(function(){
  const whatsapp='5512981160171';
  const brl=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  function buildMessage(){
    const name=(localStorage.getItem('lp_last_order_name')||'').trim();
    const total=Number(localStorage.getItem('lp_last_order_total')||0);
    const transactionId=(localStorage.getItem('lp_last_transaction_id')||'').trim();
    let items=[];
    try{items=JSON.parse(localStorage.getItem('lp_last_order_items')||'[]');}catch(_){items=[]}
    const itemText=items.map(i=>`${i.qty}x produto ${i.id}`).join(', ');
    return `Olá! Já fiz o pagamento PIX pelo site Linha Pesada, mas o pagamento ainda não foi reconhecido automaticamente. Estou enviando o comprovante para conferência e liberação do meu pedido.\n\nCliente: ${name||'não informado'}\nValor: ${brl(total)}\n${transactionId?`ID da transação: ${transactionId}\n`:''}${itemText?`Itens: ${itemText}\n`:''}\nVou anexar o comprovante do PIX nesta conversa. Por favor, confira e me informe quando o pagamento for liberado.`;
  }
  function openProofWhatsApp(){
    const text=buildMessage();
    window.open(`https://api.whatsapp.com/send/?phone=${whatsapp}&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0`,'_blank','noopener');
  }
  function addButton(){
    const box=document.getElementById('checkoutContent');
    if(!box||!document.getElementById('pixCode')||document.getElementById('pixProofButton'))return;
    const wrap=document.createElement('div');
    wrap.id='pixProofFallback';
    wrap.style.cssText='margin-top:14px;padding:12px;border:1px solid rgba(170,255,0,.18);border-radius:12px;background:rgba(170,255,0,.04)';
    wrap.innerHTML='<strong style="display:block;margin-bottom:5px">Já fiz o pagamento?</strong><p style="color:#91a1ae;font-size:12px;line-height:1.5;margin:0 0 10px">Se você já pagou e o site ainda não reconheceu o PIX, clique abaixo. O WhatsApp será aberto com uma mensagem pronta. <strong>Depois, anexe o comprovante do pagamento na conversa</strong> para conferirmos e liberarmos seu pedido.</p><button id="pixProofButton" class="expert" type="button" style="width:100%">Já fiz o pagamento — enviar comprovante</button>';
    box.appendChild(wrap);
    document.getElementById('pixProofButton').addEventListener('click',openProofWhatsApp);
  }
  const observer=new MutationObserver(addButton);
  function init(){
    const box=document.getElementById('checkoutContent');
    if(box)observer.observe(box,{childList:true,subtree:true});
    addButton();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
