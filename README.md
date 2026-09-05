# JW Joalheria Autoral

Plataforma de catálogo e vendas sob encomenda para a JW Joalheria. **React + Vite + Tailwind** no front-end e **Express + Node.js + MongoDB/Mongoose** no back-end, com painel administrativo completo para gestão de estoque e pedidos.

## Estrutura

```
jw-joalheria/
  front/   → React + Vite + Tailwind (site público + painel admin)
  back/    → Express + Mongoose (API, autenticação e upload de imagens)
```

## Funcionalidades

**Site público**
- Catálogo de peças com filtro por categoria, faixa de preço e busca por nome
- Página de detalhe da peça com galeria de fotos e botão de contato via WhatsApp
- Seção de avaliações de clientes aprovadas pelo admin

**Painel administrativo** (`/admin`, login obrigatório)
- **Estoque**: cadastro e edição de peças com upload de até 6 fotos por produto (escolha a foto de capa, remova fotos), controle de quantidade em estoque, categoria, material, preço e destaque na home
- **Pedidos**: listagem em cards com busca e filtro por status; criação manual de pedido (o admin escolhe as peças do estoque, o sistema calcula o total automaticamente); edição completa de um pedido existente (cliente, itens, forma de pagamento, status); exclusão de pedidos
- **Avaliações**: aprovação, ocultação e remoção do que aparece publicamente no site

## Requisitos

- Node.js 18 ou superior
- MongoDB (local ou Atlas)

## Como rodar localmente

### 1. Banco de dados

Use um MongoDB local (`mongodb://localhost:27017/jw-joalheria`) ou um cluster gratuito no [MongoDB Atlas](https://www.mongodb.com/atlas).

### 2. Backend

```bash
cd back
cp .env.example .env
# edite o .env com sua MONGODB_URI, credenciais do Firebase Admin, ADMIN_EMAILS e config de frete (Correios)

npm install
npm run seed   # popula peças, pedidos e avaliações fictícias + cria o usuário admin
npm run dev    # sobe em http://localhost:4000
```

### 3. Frontend

```bash
cd front
npm install
npm run dev    # sobe em http://localhost:5173
```

O Vite já redireciona `/api/*` e `/uploads/*` para `http://localhost:4000` (veja `front/vite.config.js`), então basta abrir `http://localhost:5173`.

## Variáveis de ambiente (`back/.env`)

Veja `back/.env.example` para a lista completa e atualizada (MongoDB, Firebase Admin, Cloudinary e Correios). Resumo do banco:

```env
MONGODB_URI="mongodb+srv://usuario:SUA_SENHA_AQUI@SEU-CLUSTER.mongodb.net/jw-joalheria?retryWrites=true&w=majority"
PORT=4000
```

Observações:
- Pegue a connection string em **Atlas → Database → Connect → Drivers (Node.js)**. Ela vem com `<db_password>` no lugar da senha — substitua pela senha real.
- Adicione o nome do banco depois da barra: `...net/jw-joalheria?...`.
- Se a senha tiver caracteres especiais (`@ : / ? # &`), use a versão URL-encoded que o próprio Atlas oferece.
- Em **Atlas → Network Access**, libere `0.0.0.0/0` (ou o IP do servidor) para o backend conseguir conectar.
- `MONGODB_USERNAME` / `MONGODB_PASSWORD` no `.env.example` são só referência — o código não os utiliza.

Depois de configurar:

```bash
cd back
npm run seed   # cria peças, pedidos, avaliações e o usuário admin
npm run dev
```

## Login e papéis de usuário (Firebase Authentication)

O login (tanto de clientes quanto do admin) é feito pelo **Firebase Authentication** no frontend — não existe mais `ADMIN_EMAIL`/`ADMIN_PASSWORD`/JWT próprio. O frontend autentica com o Firebase e envia o **ID Token** do Firebase em cada requisição (`Authorization: Bearer <token>`); o backend valida esse token com o **Firebase Admin SDK** (`back/src/config/firebase.js`).

Quem é "admin" é decidido assim (`back/src/middleware/authentication.js`):

1. **Custom Claim `role: "admin"`** no próprio token do Firebase — a forma definitiva. Para aplicar essa claim a um usuário já existente no Firebase, rode a partir de `back/`:
   ```bash
   node scripts/setAdminClaim.js --email=email-do-admin@exemplo.com
   ```
   A pessoa precisa sair e entrar novamente (ou esperar o token renovar) para a claim valer.
2. **Allowlist por e-mail** (`ADMIN_EMAILS` no `.env` do backend, e-mails separados por vírgula) — um fallback enquanto a claim acima ainda não foi aplicada ao usuário.

Ou seja: **qualquer pessoa que se cadastra no site vira um usuário comum** (`role: "user"`), com carrinho próprio salvo no Mongo. Ela só age como admin se o e-mail dela estiver em `ADMIN_EMAILS` **ou** se tiver recebido a custom claim via `setAdminClaim.js`. Isso explica por que, ao configurar só um usuário, ele aparece como cliente comum — o admin precisa ser promovido por um desses dois caminhos depois de criado no Firebase (Console → Authentication → Users).

Configure no `back/.env`:
```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
ADMIN_EMAILS=janayna@jwjoalheria.com
```
e no `front/.env` as credenciais **públicas** do app Firebase (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`).

## Upload de fotos dos produtos

As fotos enviadas pelo painel de Estoque são salvas em `back/uploads/` e servidas em `http://localhost:4000/uploads/...` (ou pelo domínio da API em produção). Formatos aceitos: JPG, PNG, WEBP e GIF, até 5 MB por arquivo e 6 fotos por peça.

> **Atenção — armazenamento local não é permanente em produção.** Serviços gratuitos como o Render têm sistema de arquivos efêmero: as fotos enviadas pelo admin podem ser perdidas a cada novo deploy ou reinício do servidor. Esse comportamento é aceitável enquanto o projeto está em avaliação. Para uso definitivo, planeje migrar o armazenamento de imagens para um serviço externo (ex.: Cloudinary, S3) — a mudança fica isolada em `back/routes/upload.js`.

## Frete (Correios) — obrigatório antes do pagamento

O frete deixou de ser opcional e passou a usar a **API real dos Correios** em vez do mock antigo (baseado só no primeiro dígito do CEP).

**Fluxo:**
1. Cliente adiciona peças ao carrinho e informa o CEP no drawer do carrinho.
2. O frontend envia ao backend **apenas** o CEP e os itens do carrinho (`productId` + `quantity`) — nunca peso, preço ou valor declarado.
3. O backend (`shippingService.js`) busca os produtos no MongoDB, soma o peso de cada peça (`shipping.weight`, em gramas) × quantidade, soma o peso fixo da embalagem (config global) e calcula o valor declarado (`preço do produto × quantidade`, somado para todos os itens).
4. O backend chama a API dos Correios (`correiosService.js`) com CEP de origem (config), CEP de destino, peso total (`psObjeto`), dimensões fixas da embalagem e valor declarado (`vlDeclarado`).
5. Os Correios retornam preço e prazo de transporte; o backend soma os **15 dias úteis de produção** (configurável) e devolve preço + prazo total ao frontend.
6. O botão **"Ir para pagamento"** só fica habilitado depois de um frete calculado com sucesso; qualquer alteração no carrinho invalida o frete calculado e exige novo cálculo.

**Onde configurar** (`back/.env`, ver `.env.example`):
- `CORREIOS_CEP_ORIGEM` — CEP de onde a loja despacha.
- `CORREIOS_PACKAGING_WEIGHT_GRAMS`, `CORREIOS_PACKAGE_LENGTH_CM`, `CORREIOS_PACKAGE_WIDTH_CM`, `CORREIOS_PACKAGE_HEIGHT_CM` — embalagem, hoje **global** (não por produto); valores de partida (300g, 15×11×1cm) até a proprietária informar a embalagem real.
- `CORREIOS_SERVICE_CODE` — código do serviço dos Correios (PAC/SEDEX) do contrato.
- `PRODUCTION_DAYS` — prazo de produção da joia, em dias úteis (padrão 15).
- `CORREIOS_API_*` — credenciais de autenticação da API dos Correios (usuário, senha, cartão de postagem, contrato). **Dependem do contrato comercial da joalheria com os Correios** e não vêm preenchidas neste projeto; enquanto ausentes, o cálculo de frete retorna um erro claro em vez de simular uma resposta.

**Peso das peças:** agora é um campo obrigatório do produto (`shipping.weight`, em gramas), validado no cadastro/edição pelo painel administrativo. Ele é usado só internamente — não aparece na loja pública.

**Produtos antigos:** o schema não quebra leituras de produtos que já existiam sem esse campo, mas eles não conseguem participar do cálculo de frete até terem um peso. Rode o backfill:
```bash
cd back
npm run migrate:shipping
```
Isso atribui um peso padrão (ajustável via `DEFAULT_PRODUCT_WEIGHT_GRAMS`) a qualquer peça sem peso, para não travar o carrinho — depois é só revisar o valor real de cada peça pelo painel.

**Como testar o cálculo** (sem esperar o contrato dos Correios ficar pronto): sem as credenciais `CORREIOS_API_*` configuradas, a chamada a `/api/shipping/quote` responde com erro 502 explicando quais variáveis faltam — confirmando que o restante do fluxo (validação de CEP, busca dos produtos, soma de peso/valor declarado) está correto antes mesmo de existir contrato ativo com os Correios.

## API — rotas principais

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/products` | Público | Lista peças ativas (filtros: `category`, `featured`, `search`) |
| GET | `/api/products/:slug` | Público | Detalhe de uma peça |
| GET | `/api/products/admin/all` | Admin | Lista todas as peças (inclusive inativas) |
| POST | `/api/products` | Admin | Cria peça |
| PUT | `/api/products/:id` | Admin | Edita peça |
| DELETE | `/api/products/:id` | Admin | Remove peça |
| POST | `/api/upload` | Admin | Upload de imagens (multipart, campo `images`, até 6 arquivos) |
| POST | `/api/shipping/quote` | Público | Calcula frete (CEP + itens do carrinho); nunca recebe peso/preço do cliente |
| POST | `/api/orders` | Público | Cliente finaliza pedido (exige CEP + frete já calculado) |
| POST | `/api/orders/admin` | Admin | Admin cria pedido manualmente |
| GET | `/api/orders` | Admin | Lista todos os pedidos |
| PUT | `/api/orders/:id` | Admin | Edita pedido completo (cliente, itens, status, pagamento) |
| PUT | `/api/orders/:id/status` | Admin | Atualiza apenas o status do pedido |
| DELETE | `/api/orders/:id` | Admin | Remove pedido |
| GET/PUT | `/api/cart` | Usuário logado | Carrinho persistido por conta |
| GET/PUT/DELETE | `/api/reviews/...` | Público/Admin | Avaliações de clientes |

Rotas marcadas como **Admin**/**Usuário logado** exigem header `Authorization: Bearer <token>` com o **ID Token do Firebase** (ver seção "Login e papéis de usuário" acima) — não é mais um JWT emitido pelo próprio backend.

## Deploy

Aplicação dividida em duas partes (front Vite + API Express) — o caminho mais simples é **backend no Render** e **frontend no Vercel**.

### Backend (API) no Render

1. Suba o projeto para um repositório no GitHub.
2. Em [render.com](https://render.com) → **New → Web Service** → conecte o repositório.
3. Configure:
   - **Root Directory:** `back`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Em **Environment**, adicione todas as variáveis de `back/.env.example` (MongoDB, Firebase Admin, `ADMIN_EMAILS`, Cloudinary e as variáveis de frete/Correios). Não é preciso definir `PORT` — o Render injeta automaticamente.
5. Após o primeiro deploy, rode o seed uma vez pela aba **Shell** do Render: `npm run seed`.
6. Anote a URL pública gerada (ex.: `https://jw-joalheria-api.onrender.com`).

### Frontend no Vercel

1. Em [vercel.com](https://vercel.com) → **Add New → Project** → mesmo repositório.
2. Configure:
   - **Root Directory:** `front`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Atualize `front/vercel.json` substituindo `SUA-API-NO-RENDER.onrender.com` pela URL real do backend (o arquivo já contém os rewrites de `/api` e `/uploads`).
4. Deploy. O site fica disponível na URL da Vercel.

> **Alternativa "tudo em um":** hospedar front e back juntos em um único serviço no Render, servindo o `front/dist` pelo Express. Funciona, mas exige configuração adicional de build — o caminho Vercel + Render é o mais direto.

## Antes de publicar

- Trocar o número de WhatsApp de exemplo (`5521999999999`) em `WhatsAppFab.jsx`, `Home.jsx` e `JoiaDetalhe.jsx` pelo número real da Janayna.
- Trocar o link do Instagram em `Footer.jsx`.
- Aplicar a custom claim de admin (`node scripts/setAdminClaim.js --email=...`) ou incluir o e-mail em `ADMIN_EMAILS`.
- Preencher as variáveis de frete/Correios em `back/.env` (CEP de origem, embalagem real, código do serviço e credenciais do contrato) — sem elas o cálculo de frete não funciona.
- Rodar `npm run migrate:shipping` se houver peças cadastradas antes deste peso se tornar obrigatório, e depois revisar o peso real de cada peça no painel.
- Confirmar se o plano de armazenamento de fotos (local vs. Cloudinary/S3) já foi decidido antes do lançamento definitivo.