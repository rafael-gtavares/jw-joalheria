// Gera dados FICTÍCIOS para testar o acompanhamento e o histórico de pedidos
// (cliente e admin) sem depender de pagamento real nem dos Correios.
//
// Uso (a partir de back/):
//   npm run seed:orders
//   npm run seed:orders -- --email=voce@exemplo.com   # liga alguns pedidos à sua conta
//   npm run seed:orders -- --dry-run                  # só valida, não grava
//
// Não apaga dados reais: tudo o que é criado aqui é identificável
// (usuários uid "seed_*" / e-mail "@example.test"; pedidos com
// idempotencyKey "seed-*" e "[DADOS FICTÍCIOS]" nas observações) e é só isso
// que é removido ao rodar o script de novo. Os pedidos de rastreio usam
// `tracking.simulated = true`, então a API dos Correios nunca é consultada.

import "dotenv/config";
import mongoose from "mongoose";
import Product from "../src/models/Product.js";
import Order from "../src/models/Order.js";
import User from "../src/models/User.js";

const FAKE_NOTE = "[DADOS FICTÍCIOS]";
const args = process.argv.slice(2);
const argValue = (name) =>
  args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const force = args.includes("--force");
// --dry-run: monta e valida os dados contra o schema, sem conectar nem gravar no banco.
const dryRun = args.includes("--dry-run");
const ownerEmail = argValue("email")?.trim().toLowerCase();

if (process.env.NODE_ENV === "production" && !force) {
  console.error("Recusado: NODE_ENV=production. Use --force se tiver certeza.");
  process.exit(1);
}

// Gerador pseudoaleatório determinístico: o mesmo conjunto a cada execução.
let seedState = 20260101;
function rand() {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
}
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const pick = (list) => list[Math.floor(rand() * list.length)];

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const now = Date.now();
const at = (daysAgo, extraHours = 0) => new Date(now - daysAgo * DAY + extraHours * HOUR);

const CUSTOMERS = [
  { name: "Ana Beatriz Souza", gender: "feminino", age: 24 },
  { name: "Camila Ferreira", gender: "feminino", age: 29 },
  { name: "Juliana Rocha", gender: "feminino", age: 33 },
  { name: "Mariana Alves", gender: "feminino", age: 38 },
  { name: "Patrícia Gomes", gender: "feminino", age: 45 },
  { name: "Helena Martins", gender: "feminino", age: 58 },
  { name: "Lúcia Andrade", gender: "feminino", age: 67 },
  { name: "Rafael Carvalho", gender: "masculino", age: 27 },
  { name: "Bruno Teixeira", gender: "masculino", age: 41 },
  { name: "Carlos Mendes", gender: "masculino", age: 52 },
  { name: "Alex Moreira", gender: "outro", age: 31 },
  { name: "Cliente sem dados", gender: "nao_informado", age: null },
];

const CEPS = ["20040-020", "01310-100", "30130-010", "80010-000", "40020-000", "90010-000", "70040-010"];

// Cada cenário define a "situação final" do pedido e em que janela de dias atrás ele foi criado.
const SCENARIOS = [
  { key: "entregue", days: [25, 340] },
  { key: "entregue", days: [25, 340] },
  { key: "entregue", days: [25, 340] },
  { key: "enviado_transito", days: [8, 20] },
  { key: "enviado_saiu", days: [10, 22] },
  { key: "enviado_tentativa", days: [12, 24] },
  { key: "em_producao", days: [3, 14] },
  { key: "pronto_envio", days: [9, 24] },
  { key: "confirmado", days: [1, 5] },
  { key: "aguardando_pagamento", days: [0, 0] },
  { key: "cancelado_expirado", days: [3, 60] },
  { key: "cancelado_admin", days: [6, 120] },
];

function trackingCode(n) {
  return `SS${String(100000000 + n * 7919).slice(-9)}BR`;
}

function buildTrackingEvents(dispatchedAt, kind) {
  const events = [
    { description: "Objeto postado", location: "Agência dos Correios - Rio de Janeiro/RJ", code: "PO", offsetH: 6 },
    { description: "Objeto encaminhado", location: "Unidade de Tratamento - Rio de Janeiro/RJ", code: "RO", offsetH: 30 },
    { description: "Objeto em trânsito - por favor aguarde", location: "Unidade de Tratamento - São Paulo/SP", code: "DO", offsetH: 70 },
  ];
  if (["saiu", "tentativa", "entregue"].includes(kind)) {
    events.push({ description: "Objeto saiu para entrega ao destinatário", location: "Unidade de Distribuição", code: "OEC", offsetH: 110 });
  }
  if (kind === "tentativa") {
    events.push({ description: "Objeto não entregue - destinatário ausente", location: "Unidade de Distribuição", code: "BDE", offsetH: 118 });
  }
  if (kind === "entregue") {
    events.push({ description: "Objeto entregue ao destinatário", location: "Unidade de Distribuição", code: "BDE", offsetH: 120 });
  }
  return events
    .map((e) => ({
      at: new Date(dispatchedAt.getTime() + e.offsetH * HOUR),
      description: e.description,
      location: e.location,
      code: e.code,
    }))
    .filter((e) => e.at.getTime() <= now)
    .reverse(); // do mais recente para o mais antigo
}

function entry(status, paymentStatus, date, source, note) {
  return { status, paymentStatus, at: date, source, note };
}

function buildOrderState(scenario, createdAt, code) {
  const history = [entry("pendente", "pending", createdAt, "sistema", "Pedido criado.")];
  const paidAt = new Date(createdAt.getTime() + 2 * HOUR);
  const base = { paymentStatus: "pending", paidAt: undefined, tracking: undefined };

  const paid = () => {
    base.paymentStatus = "approved";
    base.paidAt = paidAt;
    history.push(entry("confirmado", "approved", paidAt, "pagamento", "Pagamento approved (Mercado Pago)."));
  };
  const production = () =>
    history.push(entry("em produção", "approved", new Date(paidAt.getTime() + 1 * DAY), "admin", "Peça em produção."));
  const ready = () =>
    history.push(entry("pronto para envio", "approved", new Date(paidAt.getTime() + 8 * DAY), "admin", "Peça pronta, embalada."));
  const dispatch = (kind) => {
    const dispatchedAt = new Date(paidAt.getTime() + 10 * DAY);
    history.push(entry("enviado", "approved", dispatchedAt, "admin", `Despachado. Rastreio ${code}.`));
    const events = buildTrackingEvents(dispatchedAt, kind);
    const statusByKind = {
      transito: "em_transito",
      saiu: "saiu_para_entrega",
      tentativa: "tentativa_sem_sucesso",
      entregue: "entregue",
    };
    base.tracking = {
      code,
      carrier: "correios",
      dispatchedAt,
      deliveryStatus: statusByKind[kind],
      events,
      lastEventAt: events[0]?.at,
      lastCheckedAt: new Date(now - 1 * HOUR),
      simulated: true,
    };
    return events[0]?.at;
  };

  let status;
  switch (scenario) {
    case "entregue": {
      paid(); production(); ready();
      const deliveredAt = dispatch("entregue");
      history.push(entry("entregue", "approved", deliveredAt, "correios", "Objeto entregue ao destinatário"));
      status = "entregue";
      break;
    }
    case "enviado_transito":
      paid(); production(); ready(); dispatch("transito"); status = "enviado"; break;
    case "enviado_saiu":
      paid(); production(); ready(); dispatch("saiu"); status = "enviado"; break;
    case "enviado_tentativa":
      paid(); production(); ready(); dispatch("tentativa"); status = "enviado"; break;
    case "pronto_envio":
      paid(); production(); ready(); status = "pronto para envio"; break;
    case "em_producao":
      paid(); production(); status = "em produção"; break;
    case "confirmado":
      paid(); status = "confirmado"; break;
    case "aguardando_pagamento":
      status = "pendente"; break;
    case "cancelado_expirado":
      history.push(entry("cancelado", "pending", new Date(createdAt.getTime() + 24 * HOUR), "sistema", "Pedido expirado sem pagamento."));
      status = "cancelado"; break;
    case "cancelado_admin":
      paid();
      history.push(entry("cancelado", "approved", new Date(paidAt.getTime() + 2 * DAY), "admin", "Cancelado a pedido da cliente."));
      status = "cancelado"; break;
    default:
      throw new Error(`Cenário desconhecido: ${scenario}`);
  }

  return { status, history, ...base };
}

async function main() {
  if (!dryRun) {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado ao MongoDB.");
  }

  const products = dryRun
    ? [
        { _id: new mongoose.Types.ObjectId(), name: "Peça de teste A", price: 289.9 },
        { _id: new mongoose.Types.ObjectId(), name: "Peça de teste B", price: 219.9 },
      ]
    : await Product.find({ active: { $ne: false } });
  if (!products.length) {
    console.error("Nenhum produto encontrado. Rode `npm run seed` antes (ou cadastre produtos pelo painel).");
    process.exit(1);
  }

  // Limpa apenas os dados fictícios de execuções anteriores.
  if (!dryRun) {
    const removedOrders = await Order.deleteMany({ idempotencyKey: /^seed-/ });
    const removedUsers = await User.deleteMany({ uid: /^seed_/ });
    console.log(`Removidos: ${removedOrders.deletedCount} pedidos e ${removedUsers.deletedCount} clientes fictícios anteriores.`);
  }

  // Clientes fictícios.
  const customers = CUSTOMERS.map((c, i) => {
    const n = String(i + 1).padStart(2, "0");
    let birthDate;
    if (c.age !== null) {
      birthDate = new Date(now - c.age * 365.25 * DAY - randInt(10, 300) * DAY);
      birthDate.setUTCHours(12, 0, 0, 0);
    }
    return {
      uid: `seed_${n}`,
      name: c.name,
      email: `cliente${n}@example.test`,
      provider: "password",
      role: "user",
      gender: c.gender,
      birthDate,
    };
  });
  if (dryRun) {
    const invalid = customers
      .map((c) => new User(c).validateSync())
      .filter(Boolean);
    if (invalid.length) throw invalid[0];
  } else {
    await User.insertMany(customers);
  }
  console.log(`${customers.length} clientes fictícios ${dryRun ? "validados" : "criados"}.`);

  // Conta real do usuário (opcional) para ver "Meus pedidos" logado.
  let owner = null;
  if (ownerEmail && !dryRun) {
    owner = await User.findOne({ email: new RegExp(`^${ownerEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
    if (!owner) {
      console.warn(`Aviso: usuário "${ownerEmail}" não encontrado. Entre no site com essa conta uma vez e rode de novo.`);
    }
  }

  const docs = [];
  const TOTAL_ORDERS = 36;

  for (let i = 0; i < TOTAL_ORDERS; i++) {
    const scenario = SCENARIOS[i % SCENARIOS.length];
    const daysAgo = randInt(scenario.days[0], scenario.days[1]);
    const createdAt =
      scenario.key === "aguardando_pagamento" ? new Date(now - randInt(1, 10) * HOUR) : at(daysAgo, randInt(0, 12));

    // A cada 3 pedidos, um fica na conta do usuário (se informada).
    const useOwner = owner && i % 3 === 0;
    const customer = useOwner
      ? { uid: owner.uid, name: owner.name || "Você", email: owner.email }
      : customers[i % customers.length];

    // 1 a 3 itens.
    const itemCount = randInt(1, 3);
    const items = Array.from({ length: itemCount }, () => {
      const p = pick(products);
      return { product: p._id, name: p.name, price: p.price, quantity: randInt(1, 2) };
    });
    const subtotal = Math.round(items.reduce((s, it) => s + it.price * it.quantity, 0) * 100) / 100;
    const service = pick([{ code: "03298", name: "PAC" }, { code: "03220", name: "SEDEX" }]);
    const shippingPrice = service.name === "PAC" ? randInt(2200, 3600) / 100 : randInt(4200, 6900) / 100;
    const total = Math.round((subtotal + shippingPrice) * 100) / 100;
    const cep = pick(CEPS);

    const code = trackingCode(i + 1);
    const state = buildOrderState(scenario.key, createdAt, code);
    const approved = state.paymentStatus === "approved";

    docs.push({
      user: customer.uid,
      idempotencyKey: `seed-${String(i + 1).padStart(3, "0")}`,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: "(21) 99999-0000",
      items,
      subtotal,
      shippingCep: cep,
      shippingCost: shippingPrice,
      shipping: {
        cep,
        serviceCode: service.code,
        serviceName: service.name,
        price: shippingPrice,
        productionDays: 15,
        shippingDays: service.name === "PAC" ? 6 : 3,
        estimatedDeliveryDate: new Date(createdAt.getTime() + 22 * DAY).toLocaleDateString("pt-BR"),
      },
      total,
      paymentMethod: "Mercado Pago",
      status: state.status,
      paymentStatus: scenario.key === "cancelado_expirado" ? "cancelled" : state.paymentStatus,
      paymentId: approved ? `seed-pay-${i + 1}` : undefined,
      paidAt: state.paidAt,
      preferenceId: `seed-pref-${i + 1}`,
      checkoutUrl: state.status === "pendente" ? "https://example.test/checkout/dados-ficticios" : undefined,
      expiresAt: new Date(createdAt.getTime() + 24 * HOUR),
      statusHistory: state.history,
      tracking: state.tracking,
      stockReserved: false,
      notes: FAKE_NOTE,
      createdAt,
    });
  }

  if (dryRun) {
    const invalid = docs.map((d) => new Order(d).validateSync()).filter(Boolean);
    if (invalid.length) throw invalid[0];
  } else {
    await Order.create(docs);
  }

  const byStatus = docs.reduce((acc, d) => ({ ...acc, [d.status]: (acc[d.status] || 0) + 1 }), {});
  console.log(`${docs.length} pedidos fictícios ${dryRun ? "validados (nada foi gravado)" : "criados"}:`, byStatus);
  if (owner) {
    console.log(`${docs.filter((d) => d.user === owner.uid).length} deles estão na conta ${owner.email}.`);
  }
  console.log("Pronto. Os rastreios são simulados: nenhuma chamada é feita aos Correios.");

  if (!dryRun) await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
