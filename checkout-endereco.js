(function(){
  const oldCheckout=window.checkout;
  const oldCreatePix=window.createPix;
  const cepDigits=v=>String(v||'').replace(/\D/g,'').slice(0,8);
  function field(id,placeholder,extra=''){return `<input id="${id}" placeholder="${placeholder}" ${extra}>`}
  async function buscarCep(){
    const cep=cepDigits(document.getElementById('buyerCep')?.value);
    const msg=document.getElementById('cepStatus');
    if(cep.length!==8){if(msg)msg.textContent='';return;}
    if(msg)msg.textContent='Buscando endereço...';
    try{
      const r=await fetch(`https://viacep.com.br/ws/${cep}/json/`,{headers:{Accept:'application/json'}});
      const d=await r.json();
      if(d.erro)throw new Error('CEP não encontrado');
      document.getElementById('buyerStreet').value=d.logradouro||'';
      document.getElementById('buyerNeighborhood').value=d.bairro||'';
      document.getElementById('buyerCity').value=d.localidade||'';
      document.getElementById('buyerState').value=d.uf||'';
      document.getElementById('buyerNumber')?.focus();
      if(msg)msg.textContent='Endereço encontrado. Informe apenas o número da casa.';
    }catch(e){
      if(msg)msg.textContent='Não foi possível localizar esse CEP. Confira o número.';
    }
  }
  window.checkout=function(){
    if(!Array.isArray(window.cart)||!window.cart.length){return oldCheckout()}
    if(typeof window.closeCart==='function')window.closeCart();
    const products=window.products||[];
    const total=window.cart.reduce((s,i)=>s+(products.find(p=>p.id===i.id)?.pix||0)*i.qty,0);
    const box=document.getElementById('checkoutContent');
    box.innerHTML=`<div class="eyebrow">CHECKOUT PIX</div><h2>Finalize sua compra</h2><p style="color:#91a1ae;font-size:12px">Preencha seus dados e o endereço completo para entrega.</p><div class="form-grid">
      ${field('buyerName','Nome completo')} ${field('buyerEmail','E-mail')} ${field('buyerDoc','CPF ou CNPJ')} ${field('buyerPhone','Telefone')}
      ${field('buyerCep','CEP','inputmode="numeric" maxlength="9" autocomplete="postal-code" oninput="this.value=this.value.replace(/\\D/g,\'\').replace(/(\\d{5})(\\d)/,\'$1-$2\');buscarCepEndereco()"')}
      <span id="cepStatus" style="grid-column:1/-1;color:#91a1ae;font-size:11px;margin-top:-8px"></span>
      ${field('buyerStreet','Rua ou Avenida','class="full" readonly autocomplete="street-address"')}
      ${field('buyerNumber','Número da casa','inputmode="numeric" autocomplete="address-line2"')}
      ${field('buyerComplement','Complemento (opcional)','autocomplete="address-line2"')}
      ${field('buyerNeighborhood','Bairro','readonly')}
      ${field('buyerCity','Cidade','readonly autocomplete="address-level2"')}
      ${field('buyerState','UF','readonly maxlength="2" autocomplete="address-level1"')}
      <input id="buyerAddress" type="hidden">
    </div><div class="pay-note">Total do pedido: <strong>${brl(total)}</strong>.</div><button class="checkout" onclick="prepareAddressAndCreatePix(${total})">Gerar PIX e pagar</button>`;
    document.getElementById('checkoutModal').classList.add('open');
    document.getElementById('buyerCep')?.addEventListener('blur',buscarCep);
  };
  window.buscarCepEndereco=buscarCep;
  window.prepareAddressAndCreatePix=function(total){
    const cep=cepDigits(document.getElementById('buyerCep')?.value);
    const street=(document.getElementById('buyerStreet')?.value||'').trim();
    const number=(document.getElementById('buyerNumber')?.value||'').trim();
    const complement=(document.getElementById('buyerComplement')?.value||'').trim();
    const neighborhood=(document.getElementById('buyerNeighborhood')?.value||'').trim();
    const city=(document.getElementById('buyerCity')?.value||'').trim();
    const state=(document.getElementById('buyerState')?.value||'').trim();
    if(cep.length!==8||!street||!number||!city||!state){alert('Informe um CEP válido e o número da casa. O endereço será preenchido automaticamente pelo CEP.');return;}
    document.getElementById('buyerAddress').value=`${street}, ${number}${complement?', '+complement:''}, ${neighborhood}, ${city} - ${state}, CEP ${cep}`;
    return oldCreatePix(total);
  };
})();
