(() => {
  const BLOQUEADAS = new Set(['motor', 'suspensao', 'cubos']);

  function limpar() {
    if (!Array.isArray(window.products)) return;

    // Remove definitivamente do catálogo visível as 3 categorias solicitadas.
    document.querySelectorAll('.filter').forEach(btn => {
      if (BLOQUEADAS.has(btn.dataset.filter)) btn.remove();
    });
    BLOQUEADAS.forEach(cat => document.getElementById(cat)?.remove());

    // Não deixa produtos dessas categorias permanecerem no carrinho salvo.
    if (Array.isArray(window.cart)) {
      const permitidos = window.cart.filter(item => {
        const p = window.products.find(x => x && x.id === item.id);
        return p && !BLOQUEADAS.has(p.cat);
      });
      if (permitidos.length !== window.cart.length) {
        window.cart = permitidos;
        localStorage.setItem('lp_cart', JSON.stringify(permitidos));
        if (typeof window.syncGlobals === 'function') window.syncGlobals();
        if (typeof window.updateCount === 'function') window.updateCount();
      }
    }
  }

  const observer = new MutationObserver(limpar);
  observer.observe(document.body, { childList: true, subtree: true });
  setInterval(limpar, 500);
  limpar();
})();
