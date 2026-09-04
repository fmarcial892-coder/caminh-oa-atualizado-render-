LINHA PESADA — versão catálogo + checkout PIX

1) O site tem 10 produtos em cada uma das 5 categorias: Rodas, Pneus, Motor, Suspensão e Cubos.
2) Os preços são referências pesquisadas em páginas de lojas online. Antes de vender, substitua/valide com os seus preços, estoque e condições.
3) Não foi inventado preço para a Bolsa BOLS124B-I porque não havia valor confirmado na fonte consultada.
4) Fotos: somente URLs de fotos de produto confirmadas foram usadas; onde a foto real não pôde ser confirmada, o card informa isso em vez de usar foto ilustrativa inventada.
5) Compra no site: o carrinho usa o preço PIX cadastrado no catálogo.
6) Compra com especialista: abre WhatsApp com o produto e código.
7) Checkout PIX: o frontend chama /api/create-pix. A API key NÃO fica no navegador.

GGPIXAPI
- Endpoint usado: POST https://ggpixapi.com/api/v1/pix/in
- Variável de ambiente obrigatória: GGPIX_API_KEY
- Variável opcional: GGPIX_WEBHOOK_URL
- O backend envia amountCents, description, payerName, payerDocument, externalId e demais dados.
- O pagamento só deve ser considerado confirmado após status/webhook final do gateway.

DEPLOY
GitHub Pages não executa a pasta /api. Para checkout real, hospede esta pasta em Vercel (ou outro backend/serverless), configure GGPIX_API_KEY como variável secreta e use o mesmo domínio/base URL para o frontend.

IMPORTANTE
Nunca coloque sua API key no index.html, app.js ou em arquivo público do GitHub.
