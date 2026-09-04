export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).end();
  // Em produção: valide a autenticação/assinatura do webhook conforme a configuração da sua conta GGPIXAPI,
  // grave o evento de forma idempotente e atualize o pedido no banco.
  console.log('GGPIX webhook recebido', JSON.stringify(req.body));
  return res.status(200).json({ok:true});
}
