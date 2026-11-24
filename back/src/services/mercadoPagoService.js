import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

// O dotenv é carregado no primeiro import do server.js. O cliente é criado
// sob demanda para que um token ausente gere um erro claro, e não uma falha
// obscura na primeira chamada à API.
let preferenceClient = null;
let paymentClient = null;

export class PaymentProviderError extends Error {}

function getClients() {
  if (preferenceClient && paymentClient) {
    return { preferenceClient, paymentClient };
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new PaymentProviderError(
      "Pagamento indisponível: MERCADO_PAGO_ACCESS_TOKEN não configurado."
    );
  }

  const client = new MercadoPagoConfig({
    accessToken,
    options: { timeout: 10000 },
  });
  preferenceClient = new Preference(client);
  paymentClient = new Payment(client);
  return { preferenceClient, paymentClient };
}

// Tokens de teste começam com "TEST-" e usam a URL de sandbox do Checkout Pro.
export function isSandboxToken() {
  return String(process.env.MERCADO_PAGO_ACCESS_TOKEN || "").startsWith("TEST-");
}

export const mercadoPagoService = {
  // idempotencyKey evita preferências duplicadas se a requisição for repetida.
  async createPreference(preferenceData, { idempotencyKey } = {}) {
    const { preferenceClient } = getClients();
    try {
      return await preferenceClient.create({
        body: preferenceData,
        requestOptions: idempotencyKey ? { idempotencyKey } : undefined,
      });
    } catch (err) {
      console.error("Erro ao criar preferência no Mercado Pago:", err);
      throw new PaymentProviderError(
        "Não foi possível iniciar o pagamento. Tente novamente em instantes."
      );
    }
  },

  async getPayment(paymentId) {
    const { paymentClient } = getClients();
    return paymentClient.get({ id: paymentId });
  },

  // Pagamentos de um pedido (usado na expiração para não cancelar um pedido
  // que já foi pago e cujo webhook ainda não chegou).
  async searchPaymentsByReference(externalReference) {
    const { paymentClient } = getClients();
    const result = await paymentClient.search({
      options: { external_reference: String(externalReference) },
    });
    return result?.results || [];
  },
};
