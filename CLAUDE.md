# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

JW Joalheria: jewelry catalog + made-to-order sales site. Monorepo with two independent npm projects (no root package.json); the UI and API messages are in Brazilian Portuguese.

- `back/` — Express 4 + Mongoose (ES modules), Node 18+
- `front/` — React 18 + Vite + Tailwind + react-router (public store + `/admin` panel)

There is no test runner and no linter configured in either project.

## Commands

Backend (`cd back`):
- `npm run dev` — nodemon on `server.js` (port 4000)
- `npm start` — production start
- `npm run seed` — populates products/orders/reviews with fake data
- `npm run migrate:shipping` — backfills `shipping.weight` on legacy products (default via `DEFAULT_PRODUCT_WEIGHT_GRAMS`)
- `node scripts/setAdminClaim.js --email=<email>` — sets Firebase custom claim `role: "admin"`

Frontend (`cd front`): `npm run dev` (port 5173), `npm run build`, `npm run preview`.

Vite proxies `/api` and `/uploads` to `localhost:4000` (`front/vite.config.js`). In production, `front/vercel.json` rewrites those paths to the deployed API (Render); `VITE_API_URL` can override the axios base URL.

Env vars: copy `back/.env.example` and `front/.env.example`. Backend needs MongoDB, Firebase Admin, Cloudinary, Correios and Mercado Pago values.

## Backend architecture

Layered as `routes/ → controllers/ → services/ + models/`, mounted in `back/server.js` under `/api/{auth,products,orders,reviews,announcements,shipping,upload,cart,payments}`.

**Auth is Firebase-only** (no own JWT). The frontend signs in with Firebase and sends the ID token as `Authorization: Bearer`; `middleware/authentication.js` verifies it with Firebase Admin and exposes `requireAuth`, `requireAdmin`, `optionalAuth`. Admin role = custom claim `role === "admin"` OR e-mail in `ADMIN_EMAILS` (fallback). Anyone who registers is a regular user with a server-side cart.

**Shipping** (`services/shippingService.js` → `correiosService.js`, config in `config/shippingConfig.js`): the client sends only CEP + `{productId, quantity}`; the server loads products from Mongo and computes weight (`product.shipping.weight` × qty + global packaging weight) and declared value itself. Never trust weight/price from the client. The quote adds `PRODUCTION_DAYS` to the Correios transit time. Without `CORREIOS_API_*` credentials the quote deliberately returns a 502 listing missing vars (no mocked response). Order creation requires a CEP and a previously calculated shipping.

**Payments** (Mercado Pago, `services/mercadoPagoService.js`, `controllers/paymentController.js`): `POST /api/payments/webhook` validates the `x-signature` HMAC (when `MERCADO_PAGO_WEBHOOK_SECRET` is set), re-fetches the payment from the MP API, finds the order via `external_reference` (= Order `_id`), stores `paymentId`/`paymentStatus`, and sets order status `confirmado` (approved) or `cancelado` (rejected/cancelled). Payment work is currently uncommitted/in progress alongside `orderController.js` and `models/Order.js`.

**Images**: uploads go through multer to Cloudinary (`services/cloudinaryService.js`); `/uploads` static dir is only a local fallback when Cloudinary isn't configured (and is ephemeral on Render).

## Frontend architecture

- `src/api/*Api.js` — one thin axios wrapper per backend resource, all built on `src/api/axios.js`, which auto-attaches the current Firebase user's ID token and rethrows errors as `Error(backendMessage)`.
- `src/contexts/` — `AuthContext` (customers), `AdminAuthContext` (admin), `CartContext` (cart synced to backend for logged-in users). Route guards: `RequireUser`, `RequireAdmin`.
- `src/pages/AdminDashboard.jsx` hosts the tabbed admin components in `src/components/admin/` (estoque, pedidos, avaliações, anúncios).
- `src/components/cart/CartDrawer.jsx` drives the checkout flow: CEP → shipping quote → "Ir para pagamento" enabled only after a successful quote; any cart change invalidates the quote.
- Product categories are duplicated in `back/src/constants/categories.js` and `front/src/constants/categories.js` — keep them in sync.

## Gotchas

- `README.md` (Portuguese) has the full API route table, deploy steps and pre-launch checklist; its claim that storage is only local `back/uploads` is outdated (Cloudinary is in use).
- Placeholder WhatsApp number (`5521999999999`) lives in `WhatsAppFab.jsx`, `Home.jsx`, `JoiaDetalhe.jsx`.
