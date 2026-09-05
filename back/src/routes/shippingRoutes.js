import { Router } from "express";
import { getShippingQuote } from "../controllers/shippingController.js";

const router = Router();

// POST em vez de GET: agora o corpo da requisição carrega os itens do
// carrinho (productId + quantity), além do CEP de destino.
router.post("/quote", getShippingQuote);

export default router;
