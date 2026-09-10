(function() {
  const WA_URL = 'https://api.whatsapp.com/send/?phone=5512981160171&text=Ol%C3%A1%21%20Vim%20pelo%20site%20e%20quero%20ajuda%20com%20uma%20pe%C3%A7a.&type=phone_number&app_absent=0';
  const HERO = 'data:image/webp;base64,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'+
    '';

  function replaceTop() {
    const topbar = document.querySelector('.topbar');
    const header = document.querySelector('header.header');
    const mainnav = document.querySelector('.mainnav');
    const hero = document.querySelector('section.hero');
    if (!topbar || !header || !mainnav || !hero) return;

    topbar.innerHTML = `
      <div class="manus-wrap manus-topbar-in">
        <div class="manus-top-left">
          <span>▣ &nbsp;<b>CNPJ: 09.284.909/0001-93</b></span>
          <span>♟ &nbsp;Loja especializada em peças para caminhões</span>
        </div>
        <div class="manus-top-right">
          <span>⬟ &nbsp;Compra segura</span>
          <a href="${WA_URL}" target="_blank" rel="noopener">◉ &nbsp;Atendimento via WhatsApp</a>
        </div>
      </div>`;

    header.innerHTML = `
      <div class="manus-wrap manus-header-in">
        <a class="manus-brand" href="#top" aria-label="Linha Pesada">
          <img src="/assets/logo-linha-pesada.svg" alt="Linha Pesada — peças e acessórios para caminhões">
        </a>
        <div class="manus-search">
          <input id="manusTopSearch" placeholder="O que você está procurando?" autocomplete="off">
          <button type="button" aria-label="Buscar" id="manusSearchBtn">⌕</button>
        </div>
        <div class="manus-contact">
          <a class="manus-wa-contact" href="${WA_URL}" target="_blank" rel="noopener">
            <span class="manus-wa-circle">◉</span>
            <span><b>Fale conosco</b><small>Atendimento via WhatsApp</small></span>
          </a>
          <span class="manus-divider"></span>
          <span class="manus-location"><span class="manus-loc-icon">⌖</span><span><b>Guanambi/BA</b><small>Atendimento nacional</small></span></span>
          <button class="manus-cart" type="button" onclick="openCart()">🛒 <span>Carrinho</span> <b id="manusCartCount">0</b></button>
        </div>
      </div>`;

    mainnav.innerHTML = `
      <div class="manus-wrap manus-nav-in">
        <a class="active" href="#top">Início</a>
        <a href="#rodas">Rodas</a>
        <a href="#pneus">Pneus</a>
      </div>`;

    hero.innerHTML = `
      <div class="manus-hero-bg"><img src="${HERO}" alt="Caminhões Pesados - Linha Pesada"><div class="manus-hero-overlay"></div></div>
      <div class="manus-wrap manus-hero-in">
        <div class="manus-hero-copy">
          <span class="manus-hero-eyebrow">PEÇAS E ACESSÓRIOS PARA</span>
          <h1>CAMINHÕES</h1>
          <p>Qualidade, segurança e o melhor preço para manter o seu trabalho em movimento.</p>
          <div class="manus-hero-benefits">
            <div><span>◆</span><b>Produtos com garantia comprovada</b></div>
            <div><span>✓</span><b>Compra segura e entrega rápida</b></div>
            <div><span>◉</span><b>Atendimento especializado</b></div>
          </div>
        </div>
        <div class="manus-discount"><strong>20%</strong><b>DE DESCONTO</b><small>EM TODA A LOJA</small></div>
      </div>`;

    const topSearch = document.getElementById('manusTopSearch');
    const oldSearch = document.getElementById('search');
    const syncSearch = () => {
      if (!oldSearch || !topSearch) return;
      oldSearch.value = topSearch.value;
      oldSearch.dispatchEvent(new Event('input', { bubbles: true }));
    };
    topSearch.addEventListener('input', syncSearch);
    document.getElementById('manusSearchBtn')?.addEventListener('click', () => {
      syncSearch();
      document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
    });

    const cartCount = document.getElementById('cartCount');
    const manusCartCount = document.getElementById('manusCartCount');
    const syncCart = () => { if (cartCount && manusCartCount) manusCartCount.textContent = cartCount.textContent || '0'; };
    syncCart();
    if (cartCount) new MutationObserver(syncCart).observe(cartCount, { childList: true, characterData: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', replaceTop);
  else replaceTop();
})();
