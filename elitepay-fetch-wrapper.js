const nativeFetch=global.fetch;
const ELITE_DEPOSIT='/api/v1/deposit';

global.fetch=async function(input,init){
  const url=typeof input==='string'?input:(input&&input.url)||'';
  if(url.endsWith(ELITE_DEPOSIT)&&init&&typeof init.body==='string'){
    try{
      const payload=JSON.parse(init.body);
      if(Object.prototype.hasOwnProperty.call(payload,'amount')){
        const raw=payload.amount;
        // O server.js trabalha internamente em centavos (ex.: 103200).
        // A Elite PAYbr, porém, deve receber o valor monetário com ponto:
        // R$ 1.032,00 -> "1032.00". Convertemos uma única vez aqui.
        if(typeof raw==='number' && Number.isSafeInteger(raw)){
          payload.amount=(raw/100).toFixed(2);
        }else if(typeof raw==='string' && /^\d+$/.test(raw.trim())){
          payload.amount=(Number(raw.trim())/100).toFixed(2);
        }
        init={...init,body:JSON.stringify(payload)};
        console.log(`Elite PAY /deposit → amount final enviado: ${payload.amount}`);
      }
    }catch(_){
      // Mantém o comportamento nativo para payloads que não sejam JSON.
    }
  }
  return nativeFetch(input,init);
};

require('./server.js');
