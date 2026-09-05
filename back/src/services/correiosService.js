// Integração com a API oficial dos Correios (https://api.correios.com.br).
//
// Esta é a ÚNICA camada do sistema que fala diretamente com os Correios.
// Ela nunca deve ser chamada pelo frontend — apenas pelo shippingService,
// que já resolveu peso e valor declarado a partir do MongoDB antes de
// chegar aqui.
//
// IMPORTANTE — CREDENCIAIS: usuário/senha (ou código de acesso à API) e o
// cartão de postagem dependem do contrato comercial da joalheria com os
// Correios e NÃO estão disponíveis neste projeto. Configure-os em `.env`
// (ver `.env.example` e `shippingConfig.js`). Sem eles, esta camada lança
// um erro explicando o que falta — nunca inventamos um preço/prazo aqui.
//
// Referência: Manual - Uso da API Token e Manual - API Preço (Correios
// Web Services / CWS), portal https://cws.correios.com.br.

import shippingConfig from "../config/shippingConfig.js";

export class ShippingProviderError extends Error {}

let cachedToken = null;
let cachedTokenExpiresAt = 0;

function assertConfigured() {
  const { api, originCep, serviceCode } = shippingConfig;
  const missing = [];
  if (!originCep) missing.push("CORREIOS_CEP_ORIGEM");
  if (!serviceCode) missing.push("CORREIOS_SERVICE_CODE");
  if (!api.username) missing.push("CORREIOS_API_USERNAME");
  if (!api.password) missing.push("CORREIOS_API_PASSWORD");
  if (!api.cartaoPostagem) missing.push("CORREIOS_API_CARTAO_POSTAGEM");

  if (missing.length) {
    throw new ShippingProviderError(
      "Integração com os Correios não configurada. Configure no .env do backend: " +
        missing.join(", ") +
        "."
    );
  }
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), shippingConfig.api.timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new ShippingProviderError(
        "Tempo de resposta dos Correios excedido. Tente novamente."
      );
    }
    throw new ShippingProviderError("Não foi possível conectar à API dos Correios.");
  } finally {
    clearTimeout(timeout);
  }
}

function parseBrazilianNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return NaN;
  // Aceita tanto "12.34" quanto "1.234,56" (formato BR).
  const normalized = value.includes(",")
    ? value.replace(/\./g, "").replace(",", ".")
    : value;
  return Number(normalized);
}

// Autentica por cartão de postagem (usuário + senha/código de acesso da
// API + cartão de postagem), conforme a API Token dos Correios:
// POST /token/v1/autentica/cartaopostagem
async function authenticate() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiresAt) {
    return cachedToken;
  }

  const { api } = shippingConfig;
  const basicAuth = Buffer.from(`${api.username}:${api.password}`).toString("base64");

  const response = await fetchWithTimeout(
    `${api.baseUrl}/token/v1/autentica/cartaopostagem`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ numero: api.cartaoPostagem }),
    }
  );

  if (response.status === 401 || response.status === 403) {
    throw new ShippingProviderError(
      "Falha na autenticação com os Correios. Verifique usuário, senha e cartão de postagem configurados."
    );
  }
  if (!response.ok) {
    throw new ShippingProviderError("Erro inesperado ao autenticar com os Correios.");
  }

  const data = await response.json().catch(() => null);
  if (!data?.token) {
    throw new ShippingProviderError("Resposta inesperada da autenticação dos Correios.");
  }

  cachedToken = data.token;
  // A resposta real traz a validade do token (ex.: `expiraEm`); quando o
  // formato exato for confirmado com o contrato, usar esse valor aqui em
  // vez da margem fixa abaixo.
  cachedTokenExpiresAt = now + 10 * 60 * 1000;
  return cachedToken;
}

/**
 * Consulta preço e prazo de transporte na API dos Correios para um pacote
 * já pronto (peso e valor declarado calculados pelo shippingService a
 * partir do MongoDB).
 *
 * Endpoint: POST /preco/v1/nacional
 * Corpo conforme o Manual - API Preço dos Correios (lote com um único
 * produto/parâmetro).
 *
 * @param {Object} params
 * @param {string} params.cepDestino CEP de destino, somente dígitos.
 * @param {number} params.psObjeto peso total do pacote pronto, em gramas.
 * @param {number} params.vlDeclarado valor declarado da encomenda, em reais.
 * @returns {Promise<{ price: number, shippingDays: number }>}
 */
export async function getPrecoPrazo({ cepDestino, psObjeto, vlDeclarado }) {
  assertConfigured();

  const token = await authenticate();
  const { originCep, serviceCode, objectType, packaging, api } = shippingConfig;

  const parametro = {
    coProduto: serviceCode,
    nuRequisicao: "1",
    cepOrigem: originCep.replace(/\D/g, ""),
    cepDestino: String(cepDestino).replace(/\D/g, ""),
    psObjeto: String(psObjeto),
    tpObjeto: String(objectType),
    comprimento: String(packaging.lengthCm),
    largura: String(packaging.widthCm),
    altura: String(packaging.heightCm),
    vlDeclarado: String(vlDeclarado),
  };

  // nuContrato/nuDR são opcionais para autenticação por cartão de
  // postagem, mas alguns contratos exigem — envie se estiverem configurados.
  if (api.contrato) parametro.nuContrato = api.contrato;
  if (api.dr) parametro.nuDR = api.dr;

  const body = {
    idLote: "1",
    parametrosProduto: [parametro],
  };

  let response;
  try {
    response = await fetchWithTimeout(`${api.baseUrl}/preco/v1/nacional`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    if (err instanceof ShippingProviderError) throw err;
    throw new ShippingProviderError("Não foi possível conectar à API dos Correios.");
  }

  if (response.status === 401 || response.status === 403) {
    // Token pode ter expirado antes do previsto; limpa o cache para a
    // próxima tentativa reautenticar.
    cachedToken = null;
    throw new ShippingProviderError("Sessão com os Correios expirada ou não autorizada.");
  }
  if (!response.ok) {
    throw new ShippingProviderError(
      "Não foi possível calcular o frete pelos Correios no momento. Tente novamente."
    );
  }

  const data = await response.json().catch(() => null);
  const item = Array.isArray(data) ? data[0] : data;

  if (!item || item.txErro || item.erro) {
    throw new ShippingProviderError(
      item?.txErro || item?.erro || "Os Correios não retornaram um preço para este CEP."
    );
  }

  const price = parseBrazilianNumber(item.pcFinal ?? item.valor ?? item.preco);
  const shippingDays = parseInt(item.prazoEntrega ?? item.deadline ?? item.prazo, 10);

  if (!Number.isFinite(price)) {
    throw new ShippingProviderError("Preço retornado pelos Correios em formato inesperado.");
  }
  if (!Number.isFinite(shippingDays)) {
    throw new ShippingProviderError("Prazo retornado pelos Correios em formato inesperado.");
  }

  return { price, shippingDays };
}