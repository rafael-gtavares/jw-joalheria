// Configuração centralizada do frete (Correios).
//
// Todos os valores fixos usados no cálculo de frete (embalagem, CEP de
// origem, código do serviço, prazo de produção e credenciais da API dos
// Correios) ficam concentrados aqui, lidos do ambiente (.env). Nada disso
// deve ser hardcoded em outros arquivos — se um novo valor for necessário,
// adicione-o aqui e em `.env.example`.
//
// As dimensões e o peso da embalagem abaixo têm um valor padrão (fallback)
// apenas para não travar o ambiente de desenvolvimento antes de a
// proprietária informar as medidas reais das embalagens usadas. Em
// produção, configure sempre pelo `.env`.

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseServices(list, legacyCode) {
  const parsed = String(list || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [code, ...nameParts] = entry.split(":");
      const trimmedCode = code.trim();
      return { code: trimmedCode, name: nameParts.join(":").trim() || trimmedCode };
    })
    .filter((s) => s.code);

  if (parsed.length) return parsed;
  if (legacyCode) return [{ code: legacyCode.trim(), name: "Correios" }];
  return [];
}

export const shippingConfig = {
  // CEP de origem: pertence à loja/joalheria. Nunca é informado pelo cliente.
  originCep: process.env.CORREIOS_CEP_ORIGEM || "",

  // Embalagem: configuração GLOBAL (não fica no produto individualmente).
  // Comprimento/largura/altura em centímetros, peso em gramas.
  packaging: {
    weightGrams: toNumber(process.env.CORREIOS_PACKAGING_WEIGHT_GRAMS, 300),
    lengthCm: toNumber(process.env.CORREIOS_PACKAGE_LENGTH_CM, 15),
    widthCm: toNumber(process.env.CORREIOS_PACKAGE_WIDTH_CM, 11),
    heightCm: toNumber(process.env.CORREIOS_PACKAGE_HEIGHT_CM, 1),
  },

  // Serviços dos Correios oferecidos ao cliente (ex.: PAC, SEDEX).
  // CORREIOS_SERVICES="03298:PAC,03220:SEDEX"; cai no CORREIOS_SERVICE_CODE
  // (um único serviço) se a lista não estiver definida.
  services: parseServices(
    process.env.CORREIOS_SERVICES,
    process.env.CORREIOS_SERVICE_CODE
  ),

  // Tipo do objeto postado, exigido pela API de Preço dos Correios:
  // 1 = Envelope | 2 = Pacote/Caixa | 3 = Rolo/Prisma.
  // Uma joia embalada em caixa usa "2" por padrão.
  objectType: process.env.CORREIOS_TIPO_OBJETO || "2",

  // Prazo fixo de produção da joia, em dias úteis — somado ao prazo de
  // transporte retornado pelos Correios.
  productionDays: toNumber(process.env.PRODUCTION_DAYS, 15),

  // Credenciais/autenticação da API dos Correios. Dependem do contrato
  // comercial da joalheria com os Correios e NÃO estão disponíveis neste
  // projeto — configure-as no `.env` quando o contrato existir.
  api: {
    baseUrl: process.env.CORREIOS_API_BASE_URL || "https://api.correios.com.br",
    username: process.env.CORREIOS_API_USERNAME || "",
    password: process.env.CORREIOS_API_PASSWORD || "",
    cartaoPostagem: process.env.CORREIOS_API_CARTAO_POSTAGEM || "",
    contrato: process.env.CORREIOS_API_CONTRATO || "",
    dr: process.env.CORREIOS_API_DR || "",
    timeoutMs: toNumber(process.env.CORREIOS_API_TIMEOUT_MS, 10000),
  },
};

// Indica se há informação suficiente para de fato chamar a API dos Correios.
// Usado para dar uma mensagem de erro clara em vez de uma falha genérica.
export function isCorreiosConfigured() {
  const { api, originCep, services } = shippingConfig;
  return Boolean(
    originCep &&
      services.length &&
      api.username &&
      api.password &&
      api.cartaoPostagem
  );
}

export default shippingConfig;