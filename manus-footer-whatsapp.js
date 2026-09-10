(function(){
  function init(){
    var old=document.querySelector('footer');
    if(old){
      old.innerHTML='<div class="manus-footer-main"><div class="wrap manus-footer-grid"><div class="manus-footer-brand"><img src="/assets/logo-linha-pesada.svg" alt="Linha Pesada"><strong>LINHA PESADA</strong><span>PEÇAS E ACESSÓRIOS PARA CAMINHÕES</span></div><div class="manus-footer-links"><h3>Links rápidos</h3><a href="#top">Início</a><a href="#rodas">Rodas</a><a href="#pneus">Pneus</a><a href="/sobre.html">Quem Somos</a><a href="/contato.html">Fale Conosco</a></div><div class="manus-footer-pay"><h3>Formas de pagamento</h3><div class="payment-row"><b>PIX</b><span>Pagamento rápido e seguro</span></div><div class="payment-row"><b>Cartão</b><span>Visa · Mastercard</span></div></div><div class="manus-footer-social"><h3>Siga-nos</h3><div class="social-row"><a href="https://www.instagram.com/" target="_blank" rel="noopener" aria-label="Instagram">Instagram</a><a href="https://www.facebook.com/" target="_blank" rel="noopener" aria-label="Facebook">Facebook</a><a href="https://www.youtube.com/" target="_blank" rel="noopener" aria-label="YouTube">YouTube</a></div><a class="manus-footer-wa" href="https://api.whatsapp.com/send/?phone=5512981160171&text=Ol%C3%A1%21%20Vim%20pelo%20site%20Linha%20Pesada%20e%20quero%20ajuda%20com%20uma%20pe%C3%A7a.&type=phone_number&app_absent=0" target="_blank" rel="noopener">WhatsApp · Fale conosco</a></div></div></div><div class="manus-footer-bottom"><div class="wrap">© 2026 LINHA PESADA - Todos os direitos reservados. | CNPJ: 09.284.909/0001-93</div></div>';
      old.className='manus-footer';
    }
    var wa=document.getElementById('whatsappFlutuante');
    if(!wa){
      wa=document.createElement('a');
      wa.id='whatsappFlutuante';
      wa.href='https://api.whatsapp.com/send/?phone=5512981160171&text=Ol%C3%A1%21%20Vim%20pelo%20site%20Linha%20Pesada%20e%20quero%20ajuda%20com%20uma%20pe%C3%A7a.&type=phone_number&app_absent=0';
      wa.target='_blank'; wa.rel='noopener';
      wa.setAttribute('aria-label','Falar com especialista no WhatsApp');
      wa.innerHTML='<span>☏</span><strong>WhatsApp</strong>';
      document.body.appendChild(wa);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
