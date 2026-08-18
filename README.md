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
# edite o .env com sua MONGODB_URI, JWT_SECRET e o e-mail/senha do admin

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

O servidor lê **apenas** `MONGODB_URI` para conectar ao banco — a connection string já inclui usuário e senha.

```env
MONGODB_URI="mongodb+srv://usuario:SUA_SENHA_AQUI@SEU-CLUSTER.mongodb.net/jw-joalheria?retryWrites=true&w=majority"
JWT_SECRET=uma_chave_bem_grande_e_aleatoria
PORT=4000
ADMIN_EMAIL=janayna@jwjoalheria.com
ADMIN_PASSWORD=escolha_uma_senha_forte
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

## Login do admin

O painel fica em `/admin`. Não existe cadastro público — o único acesso é o usuário criado pelo `npm run seed`, com o e-mail e senha definidos em `back/.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`). **Troque essa senha antes de repassar o link para a Janayna.**

## Upload de fotos dos produtos

As fotos enviadas pelo painel de Estoque são salvas em `back/uploads/` e servidas em `http://localhost:4000/uploads/...` (ou pelo domínio da API em produção). Formatos aceitos: JPG, PNG, WEBP e GIF, até 5 MB por arquivo e 6 fotos por peça.

> **Atenção — armazenamento local não é permanente em produção.** Serviços gratuitos como o Render têm sistema de arquivos efêmero: as fotos enviadas pelo admin podem ser perdidas a cada novo deploy ou reinício do servidor. Esse comportamento é aceitável enquanto o projeto está em avaliação. Para uso definitivo, planeje migrar o armazenamento de imagens para um serviço externo (ex.: Cloudinary, S3) — a mudança fica isolada em `back/routes/upload.js`.

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
| POST | `/api/orders` | Público | Cliente finaliza pedido pelo site |
| POST | `/api/orders/admin` | Admin | Admin cria pedido manualmente |
| GET | `/api/orders` | Admin | Lista todos os pedidos |
| PUT | `/api/orders/:id` | Admin | Edita pedido completo (cliente, itens, status, pagamento) |
| PUT | `/api/orders/:id/status` | Admin | Atualiza apenas o status do pedido |
| DELETE | `/api/orders/:id` | Admin | Remove pedido |
| POST | `/api/auth/login` | Público | Login do admin (retorna JWT) |
| GET/PUT/DELETE | `/api/feedback/...` | Público/Admin | Avaliações de clientes |

Rotas marcadas como **Admin** exigem header `Authorization: Bearer <token>` obtido no login.

## Deploy

Aplicação dividida em duas partes (front Vite + API Express) — o caminho mais simples é **backend no Render** e **frontend no Vercel**.

### Backend (API) no Render

1. Suba o projeto para um repositório no GitHub.
2. Em [render.com](https://render.com) → **New → Web Service** → conecte o repositório.
3. Configure:
   - **Root Directory:** `back`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Em **Environment**, adicione `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`. Não é preciso definir `PORT` — o Render injeta automaticamente.
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
- Trocar a senha do admin criada pelo seed.
- Confirmar se o plano de armazenamento de fotos (local vs. Cloudinary/S3) já foi decidido antes do lançamento definitivo.