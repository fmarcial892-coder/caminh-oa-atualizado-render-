const nativeFetch=global.fetch;
const ELITE_DEPOSIT='/api/v1/deposit';

global.fetch=async function(input,init){
  const url=typeof input==='string'?input:(input&&input.url)||'';
  if(url.endsWith(ELITE_DEPOSIT)&&init&&typeof init.body==='string'){
    try{
      const payload=JSON.parse(init.body);
      if(Object.prototype.hasOwnProperty.call(payload,'amount')){
        // server.js já converte o valor em reais para centavos.
        // Não converter novamente aqui: isso causava 1032,00 -> 10.320,00.
        console.log(`Elite PAY /deposit → amount enviado ao gateway: ${payload.amount}`);
      }
    }catch(_){
      // Mantém o comportamento nativo para payloads que não sejam JSON.
    }
  }
  return nativeFetch(input,init);
};

require('./server.js');
