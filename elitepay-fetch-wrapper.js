const nativeFetch=global.fetch;
const ELITE_DEPOSIT='/api/v1/deposit';

function moneyToCents(value){
  let text;
  if(typeof value==='number'){
    if(!Number.isFinite(value)) throw new Error('Valor inválido.');
    text=value.toFixed(2);
  }else if(typeof value==='string'){
    text=value.trim().replace(/^R\$\s*/i,'');
    if(!text) throw new Error('Valor inválido.');
  }else{
    throw new Error('Valor inválido.');
  }
  text=text.replace(/\s/g,'');
  if(text.includes(',')&&text.includes('.')) text=text.replace(/\./g,'').replace(',','.');
  else if(text.includes(',')) text=text.replace(',','.');
  if(!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new Error('Valor monetário inválido.');
  const [whole,fraction='']=text.split('.');
  const cents=Number(whole+fraction.padEnd(2,'0'));
  if(!Number.isSafeInteger(cents)||cents<=0) throw new Error('Valor monetário inválido.');
  return cents;
}

global.fetch=async function(input,init){
  const url=typeof input==='string'?input:(input&&input.url)||'';
  if(url.endsWith(ELITE_DEPOSIT)&&init&&typeof init.body==='string'){
    let payload;
    try{payload=JSON.parse(init.body);}catch(_){return nativeFetch(input,init);}
    if(Object.prototype.hasOwnProperty.call(payload,'amount')){
      const amountInCents=moneyToCents(payload.amount);
      payload.amount=amountInCents;
      init={...init,body:JSON.stringify(payload)};
      console.log(`Elite PAY /deposit → amount final enviado: ${amountInCents}`);
    }
  }
  return nativeFetch(input,init);
};

require('./server.js');
