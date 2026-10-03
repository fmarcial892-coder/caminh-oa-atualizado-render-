(function(){
  function enhance(){
    document.querySelectorAll('.actions .expert').forEach(function(btn){
      if(btn.textContent!=='Comprar no WhatsApp') btn.textContent='Comprar no WhatsApp';
      btn.setAttribute('aria-label','Comprar no WhatsApp');
    });

    var modal=document.getElementById('cartModal');
    if(modal && !modal.querySelector('.continue-shopping')){
      var checkout=modal.querySelector('.checkout');
      if(checkout){
        var btn=document.createElement('button');
        btn.type='button';
        btn.className='continue-shopping';
        btn.textContent='Continuar comprando';
        btn.setAttribute('aria-label','Continuar comprando');
        btn.addEventListener('click',function(){
          if(typeof closeCart==='function') closeCart();
          var products=document.getElementById('produtos');
          if(products) products.scrollIntoView({behavior:'smooth',block:'start'});
        });
        checkout.parentNode.insertBefore(btn,checkout);
      }
    }
  }

  document.addEventListener('DOMContentLoaded',enhance);
  new MutationObserver(enhance).observe(document.documentElement,{childList:true,subtree:true});
})();
