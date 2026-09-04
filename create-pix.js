export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const {amountCents,payerName,payerDocument,payerEmail,payerPhone,metadata}=req.body||{};
    if(!process.env.GGPIX_API_KEY) return res.status(500).json({error:'GGPIX_API_KEY não configurada no servidor'});
    if(!Number.isInteger(amountCents)||amountCents<100) return res.status(400).json({error:'Valor inválido'});
    if(!payerName||!/^\d{11}$|^\d{14}$/.test(String(payerDocument||''))) return res.status(400).json({error:'Nome e CPF/CNPJ são obrigatórios'});
    const externalId='lp-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
    const payload={amountCents,description:'Pedido Linha Pesada',payerName,payerDocument:String(payerDocument),externalId,payerEmail,payerPhone,metadata,webhookUrl:process.env.GGPIX_WEBHOOK_URL||undefined};
    const r=await fetch('https://ggpixapi.com/api/v1/pix/in',{method:'POST',headers:{'Content-Type':'application/json','X-API-Key':process.env.GGPIX_API_KEY},body:JSON.stringify(payload)});
    const data=await r.json();
    if(!r.ok) return res.status(r.status).json(data);
    return res.status(201).json({id:data.id||data.transactionId,status:data.status||'PENDING',pixCopyPaste:data.pixCopyPaste,qrCode:data.qrCode,externalId});
  }catch(e){return res.status(500).json({error:'Erro interno ao criar PIX'})}
}
