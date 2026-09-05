import { calculateShipping, ShippingProviderError } from "../services/shippingService.js";

// Agora o cálculo depende dos produtos e quantidades do carrinho, então o
// endpoint recebe CEP + itens (productId/quantity) no corpo da requisição.
// O peso, o preço e o valor declarado são sempre resolvidos no backend a
// partir do MongoDB — nunca confiamos nesses valores vindos do cliente.
export async function getShippingQuote(req, res) {
  try {
    const { cep, items } = req.body;
    const quote = await calculateShipping(cep, items);
    res.json(quote);
  } catch (err) {
    if (err instanceof ShippingProviderError) {
      // Erro vindo da integração com os Correios (timeout, autenticação,
      // resposta inesperada, etc.) — não é culpa do usuário.
      return res.status(502).json({ error: err.message });
    }
    res.status(400).json({ error: err.message || "Não foi possível calcular o frete." });
  }
}
