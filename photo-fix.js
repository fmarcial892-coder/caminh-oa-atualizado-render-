(() => {
  // Somente os produtos identificados pelo usuário como sem foto.
  // Os demais produtos não são alterados.
  const photoFixes = {
    r4: '/produto-imagem/r4', r5: '/produto-imagem/r5',
    p2: '/produto-imagem/p2', p3: '/produto-imagem/p3', p4: '/produto-imagem/p4',
    p5: '/produto-imagem/p5', p6: '/produto-imagem/p6', p7: '/produto-imagem/p7', p9: '/produto-imagem/p9',
    m1: '/produto-imagem/m1', m2: '/produto-imagem/m2', m3: '/produto-imagem/m3', m4: '/produto-imagem/m4',
    m5: '/produto-imagem/m5', m6: '/produto-imagem/m6', m7: '/produto-imagem/m7', m8: '/produto-imagem/m8',
    m9: '/produto-imagem/m9', m10: '/produto-imagem/m10',
    motor: '/produto-imagem/motor',
    s1: '/produto-imagem/s1', s2: '/produto-imagem/s2', s4: '/produto-imagem/s4',
    s6: '/produto-imagem/s6', s9: '/produto-imagem/s9'
  };

  const apply = () => {
    if (!Array.isArray(products) || !products.length) return false;
    let changed = false;
    products.forEach(p => {
      if (!p || !p.id) return;
      const fixed = photoFixes[p.id] || (p.code === '3010568' ? photoFixes.motor : null);
      if (fixed && p.img !== fixed) { p.img = fixed; changed = true; }
    });
    if (changed && typeof render === 'function') render();
    return true;
  };

  const timer = setInterval(() => { if (apply()) clearInterval(timer); }, 100);
  setTimeout(() => clearInterval(timer), 15000);
})();
