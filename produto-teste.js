(function(){
  const TEST_ID='teste-pagamento-5';
  const TEST_PRODUCT={id:TEST_ID,cat:'pneus',tag:'TESTE DE PAGAMENTO',name:'Produto de Teste — Pagamento PIX',code:'TESTE-PIX-5',price:54.92,pix:54.92,img:'',desc:'Produto temporário para testar o fluxo de pagamento PIX e a conversão Compra. Não é um produto comercial.'};
  let done=false;
  function install(){
    if(done||!Array.isArray(window.products)||window.products.length<50)return;
    if(!window.products.some(p=>p&&p.id===TEST_ID))window.products.push(TEST_PRODUCT);
    const root=document.getElementById('catalog');
    if(!root||document.getElementById('produto-teste-pagamento'))return;
    const wrap=document.createElement('section');
    wrap.id='produto-teste-pagamento';
    wrap.className='category';
    wrap.innerHTML='<div class="category-head"><div><div class="eyebrow">TESTE</div><h2>Produto temporário de teste</h2></div><small>Use somente para validar o pagamento e a conversão</small></div><div class="products"><article class="card"><div class="photo"><div class="no-photo">TESTE PIX</div></div><div class="card-body"><span class="tag">TESTE DE PAGAMENTO</span><h3>Produto de Teste — Pagamento PIX</h3><div class="code">Código/ref.: TESTE-PIX-5</div><p class="desc">Produto temporário para testar o fluxo de pagamento PIX e a conversão Compra. Não é um produto comercial.</p><div class="price">R$ 54,92</div><div class="pix">PIX: R$ 54,92</div><div class="stock">Produto temporário de teste.</div><div class="actions"><button class="buy" onclick="add(\'teste-pagamento-5\')">Comprar no site</button></div></div></article></div>';
    root.prepend(wrap);
    done=true;
  }
  const timer=setInterval(install,500);
  setTimeout(function(){clearInterval(timer);install()},15000);
})();