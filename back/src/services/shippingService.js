// Camada isolada para cálculo de frete.
//
// O MOCK anterior (baseado apenas na primeira casa do CEP) foi substituído
// pela integração real com os Correios (ver `correiosService.js`).
//
// O backend é a fonte de verdade: peso, valor declarado e dimensões nunca
// vêm do frontend. O frontend informa apenas o CEP de destino e os itens do
// carrinho (productId + quantidade); tudo o mais é resolvido aqui a partir
// do MongoDB e da configuração global da loja (`shippingConfig.js`).
//
// A joia possui um prazo fixo de produção (ver `PRODUCTION_DAYS` em
// `shippingConfig.js`). O prazo total é sempre:
// produção + transporte (retornado pelos Correios).

import Product from "../models/Product.js";
import shippingConfig from "../config/shippingConfig.js";
import { getPrecoPrazo, ShippingProviderError } from "./correiosService.js";

export { ShippingProviderError };

export function isValidCep(cep) {
  return /^\d{5}-?\d{3}$/.test(String(cep || "").trim());
}

function normalizeCep(cep) {
  const digits = String(cep || "").replace(/\D/g, "");
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function addBusinessDays(date, days) {
  const result = new Date(date);
  let remaining = days;

  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    // 0 = domingo | 6 = sábado
    if (day !== 0 && day !== 6) {
      remaining--;
    }
  }

  return result;
}

function formatDate(date) {
  return date.toLocaleDateString("pt-BR");
}

// Aceita itens no formato do carrinho já existente no projeto
// ({ productId, quantity }), mas também tolera { product, quantity } para
// reaproveitar a mesma função a partir de outras estruturas (ex.: pedidos).
function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("O carrinho está vazio. Adicione peças antes de calcular o frete.");
  }

  const normalized = items
    .map((item) => ({
      productId: item.productId || item.product || item._id,
      quantity: Math.max(0, parseInt(item.quantity, 10) || 0),
    }))
    .filter((item) => item.productId && item.quantity > 0);

  if (!normalized.length) {
    throw new Error("Itens do carrinho inválidos.");
  }

  return normalized;
}

// Busca os produtos no MongoDB e calcula o peso total das joias e o valor
// declarado do pacote. Nunca confia em peso/preço enviados pelo cliente.
async function resolveCartItems(items) {
  const normalized = normalizeItems(items);
  const ids = normalized.map((i) => i.productId);

  const products = await Product.find({ _id: { $in: ids } });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  let weightGrams = 0;
  let declaredValue = 0;

  for (const { productId, quantity } of normalized) {
    const product = byId.get(String(productId));
    if (!product) {
      throw new Error("Um dos produtos do carrinho não foi encontrado.");
    }
    if (product.active === false) {
      throw new Error(`A peça "${product.name}" não está mais disponível.`);
    }

    const productWeight = product.shipping?.weight;
    if (!Number.isFinite(productWeight) || productWeight <= 0) {
      throw new Error(
        `A peça "${product.name}" está sem peso cadastrado. Contate a loja para que o cálculo de frete possa ser feito.`
      );
    }

    weightGrams += productWeight * quantity;
    declaredValue += product.price * quantity;
  }

  return { weightGrams, declaredValue };
}

// Valida CEP/origem e resolve peso e valor declarado do pacote (sempre a
// partir do MongoDB). Compartilhado por `calculateShipping` e `quoteForService`.
async function preparePackage(cep, items) {
  if (!isValidCep(cep)) {
    throw new Error("CEP inválido. Use o formato 00000-000.");
  }

  if (!shippingConfig.originCep) {
    throw new Error(
      "Frete indisponível no momento: CEP de origem da loja não configurado."
    );
  }

  const { weightGrams: productsWeight, declaredValue } = await resolveCartItems(items);

  return {
    destinationCep: normalizeCep(cep),
    // peso dos produtos + peso fixo da embalagem = peso total enviado aos Correios
    psObjeto: Math.round(productsWeight + shippingConfig.packaging.weightGrams),
    // soma do valor de todos os produtos do pacote
    vlDeclarado: Math.round(declaredValue * 100) / 100,
  };
}

async function quoteService(service, pkg) {
  const { price, shippingDays } = await getPrecoPrazo({
    serviceCode: service.code,
    cepDestino: pkg.destinationCep,
    psObjeto: pkg.psObjeto,
    vlDeclarado: pkg.vlDeclarado,
  });

  const productionDays = shippingConfig.productionDays;
  const totalBusinessDays = productionDays + shippingDays;
  const estimatedDeliveryDate = addBusinessDays(new Date(), totalBusinessDays);

  return {
    serviceCode: service.code,
    serviceName: service.name,
    // Correios devolvem reais; arredonda para centavos para evitar ruído de ponto flutuante.
    price: Math.round(price * 100) / 100,

    productionDays,
    shippingDays,
    totalBusinessDays,

    estimatedDeliveryDate: formatDate(estimatedDeliveryDate),
  };
}

/**
 * Calcula as opções de frete (ex.: PAC e SEDEX) para o CEP de destino,
 * considerando todos os itens do carrinho (produtos + quantidades).
 * Um serviço que falha é omitido; só falha se nenhum serviço responder.
 *
 * @param {string} cep CEP de destino informado pelo cliente.
 * @param {Array<{productId: string, quantity: number}>} items itens do carrinho.
 */
export async function calculateShipping(cep, items) {
  const pkg = await preparePackage(cep, items);
  const services = shippingConfig.services;

  if (!services.length) {
    throw new ShippingProviderError(
      "Integração com os Correios não configurada. Configure no .env do backend: CORREIOS_SERVICES."
    );
  }

  const settled = await Promise.allSettled(services.map((s) => quoteService(s, pkg)));
  const options = settled.filter((r) => r.status === "fulfilled").map((r) => r.value);

  if (!options.length) {
    const firstError = settled.find((r) => r.status === "rejected")?.reason;
    throw firstError instanceof ShippingProviderError
      ? firstError
      : new ShippingProviderError("Não foi possível calcular o frete pelos Correios no momento.");
  }

  return {
    cep: pkg.destinationCep,
    options,
    provider: "correios",
    isEstimate: false,
  };
}

/**
 * Recalcula UMA opção de frete (a escolhida pelo cliente). Usado na criação
 * do pedido: o valor do frete nunca vem do cliente, é sempre recotado aqui.
 *
 * @returns {Promise<{ cep: string, option: object }>}
 */
export async function quoteForService(cep, items, serviceCode) {
  const service = shippingConfig.services.find((s) => s.code === String(serviceCode));
  if (!service) {
    throw new Error("Opção de frete inválida. Calcule o frete novamente.");
  }

  const pkg = await preparePackage(cep, items);
  const option = await quoteService(service, pkg);
  return { cep: pkg.destinationCep, option };
}
