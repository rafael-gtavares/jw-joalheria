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
  const { api, originCep, services } = shippingConfig;
  const missing = [];
  if (!originCep) missing.push("CORREIOS_CEP_ORIGEM");
  if (!services.length) missing.push("CORREIOS_SERVICES");
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
// Várias cotações simultâneas (PAC + SEDEX) compartilham a mesma
// autenticação em andamento, em vez de autenticar uma vez por chamada.
let pendingAuth = null;

function authenticate() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiresAt) {
    return Promise.resolve(cachedToken);
  }
  if (!pendingAuth) {
    pendingAuth = requestToken().finally(() => {
      pendingAuth = null;
    });
  }
  return pendingAuth;
}

async function requestToken() {
  const now = Date.now();
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
 * @param {string} params.serviceCode código do serviço ("coProduto"), ex.: PAC/SEDEX.
 * @param {string} params.cepDestino CEP de destino, somente dígitos.
 * @param {number} params.psObjeto peso total do pacote pronto, em gramas.
 * @param {number} params.vlDeclarado valor declarado da encomenda, em reais.
 * @returns {Promise<{ price: number, shippingDays: number }>}
 */
export async function getPrecoPrazo({ serviceCode, cepDestino, psObjeto, vlDeclarado }) {
  assertConfigured();

  const { originCep, objectType, packaging, api } = shippingConfig;

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

  // Preço e prazo são APIs distintas nos Correios (a de Preço não devolve
  // prazo): consulta as duas em paralelo.
  const [priceItem, deadlineItem] = await Promise.all([
    postBatch("/preco/v1/nacional", { idLote: "1", parametrosProduto: [parametro] }),
    postBatch("/prazo/v1/nacional", {
      idLote: "1",
      parametrosPrazo: [
        {
          coProduto: serviceCode,
          nuRequisicao: "1",
          cepOrigem: parametro.cepOrigem,
          cepDestino: parametro.cepDestino,
        },
      ],
    }),
  ]);

  const price = parseBrazilianNumber(priceItem.pcFinal ?? priceItem.valor ?? priceItem.preco);
  const shippingDays = parseInt(
    deadlineItem.prazoEntrega ?? deadlineItem.deadline ?? deadlineItem.prazo,
    10
  );

  if (!Number.isFinite(price)) {
    throw new ShippingProviderError("Preço retornado pelos Correios em formato inesperado.");
  }
  if (!Number.isFinite(shippingDays)) {
    throw new ShippingProviderError("Prazo retornado pelos Correios em formato inesperado.");
  }

  return { price, shippingDays };
}

// POST em lote (um único item) com autenticação e uma nova tentativa se o
// token tiver expirado antes do previsto. Devolve o item da resposta.
async function postBatch(path, body) {
  const { api } = shippingConfig;

  const call = async () => {
    const token = await authenticate();
    return fetchWithTimeout(`${api.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  let response = await call();
  if (response.status === 401 || response.status === 403) {
    cachedToken = null;
    response = await call();
    if (response.status === 401 || response.status === 403) {
      cachedToken = null;
      throw new ShippingProviderError("Sessão com os Correios expirada ou não autorizada.");
    }
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
      item?.txErro || item?.erro || "Os Correios não retornaram preço/prazo para este CEP."
    );
  }
  return item;
}

// ---------------------------------------------------------------------------
// Rastreamento (API SRO Rastro)
// ---------------------------------------------------------------------------
// ATENÇÃO: endpoint e formato da resposta abaixo seguem a documentação pública
// do SRO Rastro (GET /srorastro/v1/objetos/{codigo}?resultado=T), mas precisam
// ser confirmados com o contrato/credenciais da joalheria. A normalização é
// tolerante a variações de campos; a classificação do status usa o texto do
// evento mais recente.

function classifyEvent(event) {
  const text = `${event.description || ""}`.toLowerCase();
  const code = String(event.code || "").toUpperCase();

  if (/devolvid|devolu[cç][aã]o ao remetente/.test(text) || code === "BDE-DEV") return "devolvido";
  if (/n[aã]o entregue|ausente|destinat[aá]rio n[aã]o|tentativa/.test(text)) {
    return "tentativa_sem_sucesso";
  }
  if (/entregue ao destinat|objeto entregue/.test(text)) return "entregue";
  if (/saiu para entrega|saiu para entrega ao destinat/.test(text) || code === "OEC") {
    return "saiu_para_entrega";
  }
  if (/objeto postado|postado/.test(text) || code === "PO") return "postado";
  if (/encaminhado|em tr[aâ]nsito|recebido|chegou|unidade de tratamento|tratamento/.test(text)) {
    return "em_transito";
  }
  return "em_transito";
}

function normalizeTrackingEvent(raw) {
  const unit = raw.unidade || {};
  const address = unit.endereco || {};
  const place = [address.cidade, address.uf].filter(Boolean).join("/");
  const at = new Date(raw.dtHrCriado || raw.data || raw.dataHora || "");

  return {
    at: Number.isNaN(at.getTime()) ? undefined : at,
    description: String(raw.descricao || raw.description || "").trim(),
    location: [unit.nome || unit.tipo, place].filter(Boolean).join(" - "),
    code: String(raw.codigo || raw.tipo || ""),
  };
}

/**
 * Consulta o rastreio de um objeto na API dos Correios.
 *
 * @param {string} code código de rastreio (ex.: AA123456789BR)
 * @returns {Promise<{ deliveryStatus: string, events: Array }>} eventos do mais
 *   recente para o mais antigo.
 */
export async function getTracking(code) {
  assertConfigured();

  const { api } = shippingConfig;
  const url = `${api.baseUrl}/srorastro/v1/objetos/${encodeURIComponent(code)}?resultado=T`;

  const call = async () => {
    const token = await authenticate();
    return fetchWithTimeout(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
  };

  let response = await call();
  if (response.status === 401 || response.status === 403) {
    cachedToken = null;
    response = await call();
    if (response.status === 401 || response.status === 403) {
      cachedToken = null;
      throw new ShippingProviderError("Sessão com os Correios expirada ou não autorizada.");
    }
  }
  if (response.status === 429) {
    throw new ShippingProviderError("Limite de consultas dos Correios atingido. Tente mais tarde.");
  }
  if (!response.ok) {
    throw new ShippingProviderError("Não foi possível consultar o rastreio nos Correios.");
  }

  const data = await response.json().catch(() => null);
  const object = Array.isArray(data?.objetos) ? data.objetos[0] : Array.isArray(data) ? data[0] : data;

  if (!object) {
    throw new ShippingProviderError("Resposta inesperada do rastreio dos Correios.");
  }

  const rawEvents = Array.isArray(object.eventos) ? object.eventos : [];
  if (!rawEvents.length) {
    // Objeto ainda não postado/registrado: sem eventos não é erro.
    return { deliveryStatus: "aguardando_postagem", events: [] };
  }

  const events = rawEvents
    .map(normalizeTrackingEvent)
    .sort((a, b) => (b.at?.getTime() || 0) - (a.at?.getTime() || 0));

  return { deliveryStatus: classifyEvent(events[0]), events };
}
