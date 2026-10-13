# Painel administrativo — Carlos Caminhões

Serviço separado do site da loja. Não publique a pasta como um site estático: ela precisa executar o servidor Node.js e usar PostgreSQL.

## Deploy na Render

1. Crie um PostgreSQL gerenciado na Render.
2. Crie um **Web Service separado** usando o mesmo repositório GitHub.
3. Defina **Root Directory** como `admin-panel`.
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Adicione estas variáveis ao serviço do painel:
   - `DATABASE_URL`: Internal Database URL do PostgreSQL da Render.
   - `ADMIN_PASSWORD`: crie uma senha forte exclusiva para o painel.
   - `ADMIN_SESSION_SECRET`: segredo aleatório longo e exclusivo.
   - `ADMIN_INGEST_TOKEN`: outro segredo aleatório longo e exclusivo, usado apenas na comunicação entre servidores.
   - `NODE_ENV=production`
7. No serviço existente da loja, configure `ADMIN_PANEL_URL` com a URL HTTPS do painel e `ADMIN_INGEST_TOKEN` com o mesmo token secreto.
8. Faça um teste com pedido real ou de baixo valor e confirme o registro do pedido e a atualização para PAGO depois da confirmação da Elite PAY.

**Segurança:** não coloque senhas, tokens ou URLs com credenciais no GitHub, no navegador ou em mensagens. Use apenas variáveis de ambiente da Render.

## Integração com contatos de anúncios

O painel aceita contatos pelo endpoint privado `POST /api/ingest/lead`. Um clique em anúncio ou a abertura do WhatsApp não fornece automaticamente nome, telefone ou mensagem do usuário. Para cadastrar esses dados, será necessário um formulário de lead ou uma integração autorizada com a plataforma de atendimento/WhatsApp. Os eventos de conversão do Google Ads/GA4 continuam independentes deste painel.
