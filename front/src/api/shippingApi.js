import api from "./axios";

export const shippingApi = {
  // Agora o backend precisa dos itens do carrinho (productId + quantity)
  // para calcular peso total e valor declarado a partir do MongoDB — o
  // frontend nunca envia peso, preço ou valor declarado diretamente.
  quote: ({ cep, items }) =>
    api.post("/shipping/quote", { cep, items }).then((res) => res.data),
};

export default shippingApi;
