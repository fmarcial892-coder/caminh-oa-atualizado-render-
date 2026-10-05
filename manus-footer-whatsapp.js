(function(){
  const WA='11965181029';
  const originalOpen=window.open;
  window.open=function(url,...args){
    let target=String(url||'');
    if(target.includes('api.whatsapp.com/send')) target=target.replace(/([?&]phone=)\d+/, '$1'+WA);
    return originalOpen.call(window,target,...args);
  };
  document.addEventListener('click',function(e){
    const a=e.target.closest?.('a[href*="api.whatsapp.com/send"]');
    if(!a)return;
    a.href=a.href.replace(/([?&]phone=)\d+/, '$1'+WA);
  },true);
  function init(){
    var old=document.querySelector('footer');
    if(old){
      old.innerHTML='<div class="manus-footer-main"><div class="wrap manus-footer-grid"><div class="manus-footer-brand"><img src="/assets/logo-linha-pesada.svg" alt="Linha Pesada"><strong>LINHA PESADA</strong><span>PEÇAS E ACESSÓRIOS PARA CAMINHÕES</span></div><div class="manus-footer-links"><h3>Links rápidos</h3><a href="#top">Início</a><a href="#rodas">Rodas</a><a href="#pneus">Pneus</a><a href="#motor">Motor</a><a href="#suspensao">Suspensão</a><a href="#cubos">Cubos</a><a href="/sobre.html">Quem Somos</a><a href="/contato.html">Fale Conosco</a></div><div class="manus-footer-pay"><h3>Formas de pagamento</h3><div class="payment-row"><b>PIX</b><span>Pagamento rápido e seguro</span></div><div class="payment-row"><b>Cartão</b><span>Visa · Mastercard</span></div></div><div class="manus-footer-social"><h3>Siga-nos</h3><div class="social-row"><a href="https://www.instagram.com/" target="_blank" rel="noopener" aria-label="Instagram">Instagram</a><a href="https://www.facebook.com/" target="_blank" rel="noopener" aria-label="Facebook">Facebook</a><a href="https://www.youtube.com/" target="_blank" rel="noopener" aria-label="YouTube">YouTube</a></div><a class="manus-footer-wa" href="https://api.whatsapp.com/send/?phone=11965181029&text=Ol%C3%A1%21%20Vim%20pelo%20site%20Linha%20Pesada%20e%20quero%20ajuda%20com%20uma%20pe%C3%A7a.&type=phone_number&app_absent=0" target="_blank" rel="noopener">WhatsApp · Fale conosco</a></div></div></div><div class="manus-footer-bottom"><div class="wrap"><div>© 2026 LINHA PESADA - Todos os direitos reservados. | CNPJ: 09.284.909/0001-93</div></div></div>';
      old.className='manus-footer';
    }
    var wa=document.getElementById('whatsappFlutuante');
    if(wa) wa.href=wa.href.replace(/([?&]phone=)\d+/, '$1'+WA);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();

function whatsappAfterPayment(){
  const items=cart.length?cart:JSON.parse(localStorage.getItem('lp_last_order_items')||'[]');
  const info=items.map(i=>{
    const p=products.find(x=>x.id===i.id);
    return p?`${i.qty}x ${p.name} | Código/ref.: ${p.code} | ${brl(salePrice(p)*i.qty)}`:'';
  }).filter(Boolean).join('\n');
  const total=Number(localStorage.getItem('lp_last_order_total')||0);
  const name=localStorage.getItem('lp_last_order_name')||'';
  const text=`Olá! Acabei de realizar o pagamento PIX pelo site Linha Pesada e o pagamento foi confirmado pelo gateway.\n\nCliente: ${name}\nPedido:\n${info}\n\nValor total: ${brl(total)}\n\nPagamento confirmado. Por favor, prossiga com meu pedido.`;
  window.location.href=`https://api.whatsapp.com/send/?phone=11965181029&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0`;
}
