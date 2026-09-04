(() => {
  const photoFixes = {
    r4: '/produto-imagem/r4',
    r5: '/produto-imagem/r5',
    p2: '/produto-imagem/p2',
    p3: '/produto-imagem/p3',
    p4: '/produto-imagem/p4',
    p5: '/produto-imagem/p5',
    p7: '/produto-imagem/p7',
    motor: '/produto-imagem/motor'
  };
  const apply = () => {
    if (!Array.isArray(products) || !products.length) return false;
    let changed = false;
    products.forEach(p => {
      if (photoFixes[p.id] && p.img !== photoFixes[p.id]) {
        p.img = photoFixes[p.id];
        changed = true;
      }
      if (p.code === '3010568' && p.img !== photoFixes.motor) {
        p.img = photoFixes.motor;
        changed = true;
      }
    });
    if (changed && typeof render === 'function') render();
    return true;
  };
  const timer = setInterval(() => { if (apply()) clearInterval(timer); }, 100);
  setTimeout(() => clearInterval(timer), 15000);
})();
