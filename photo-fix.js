(() => {
  // Todo produto com foto externa passa a usar uma rota local do próprio site.
  // O servidor busca a foto real e faz cache, evitando URL externa no HTML final.
  const apply = () => {
    if (!Array.isArray(products) || !products.length) return false;
    let changed = false;
    products.forEach(p => {
      if (!p || !p.id) return;
      if (typeof p.img === 'string' && /^https?:\/\//i.test(p.img)) {
        p.img = `/produto-imagem/${encodeURIComponent(p.id)}`;
        changed = true;
      }
    });
    if (changed && typeof render === 'function') render();
    return true;
  };
  const timer = setInterval(() => { if (apply()) clearInterval(timer); }, 100);
  setTimeout(() => clearInterval(timer), 20000);
})();
