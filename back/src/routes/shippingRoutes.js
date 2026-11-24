import { Router } from "express";
import { getShippingQuote } from "../controllers/shippingController.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = Router();

// POST em vez de GET: agora o corpo da requisição carrega os itens do
// carrinho (productId + quantity), além do CEP de destino. Rota pública que
// dispara chamadas aos Correios, por isso tem limite de requisições.
router.post("/quote", rateLimit({ windowMs: 60_000, max: 20 }), getShippingQuote);

export default router;
