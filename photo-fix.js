(() => {
  // Correção de foto do produto que estava sem carregamento.
  const photoFixes = {
    r4: '/produto-imagem/r4?v=20260904-3', r5: '/produto-imagem/r5?v=20260904-3',
    p2: '/produto-imagem/p2?v=20260904-3', p3: '/produto-imagem/p3?v=20260904-3',
    p4: 'https://images.tcdn.com.br/img/img_prod/495545/pneu_29580r225_liso_drc_ls601_18_lonas_152148m_18_1_20260429095435_e643ee9bc289.jpg',
    p5: '/produto-imagem/p5?v=20260904-3', p6: '/produto-imagem/p6?v=20260904-3', p7: '/produto-imagem/p7?v=20260904-3', p9: '/produto-imagem/p9?v=20260904-3',
    m1: '/produto-imagem/m1?v=20260904-3', m2: '/produto-imagem/m2?v=20260904-3', m3: '/produto-imagem/m3?v=20260904-3', m4: '/produto-imagem/m4?v=20260904-3',
    m5: '/produto-imagem/m5?v=20260904-3', m6: '/produto-imagem/m6?v=20260904-3', m7: '/produto-imagem/m7?v=20260904-3', m8: '/produto-imagem/m8?v=20260904-3',
    m9: '/produto-imagem/m9?v=20260904-3', m10: '/produto-imagem/m10?v=20260904-3',
    motor: '/produto-imagem/motor?v=20260904-3',
    s1: '/produto-imagem/s1?v=20260904-3', s2: '/produto-imagem/s2?v=20260904-3', s4: '/produto-imagem/s4?v=20260904-3',
    s6: '/produto-imagem/s6?v=20260904-3', s9: '/produto-imagem/s9?v=20260904-3'
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
