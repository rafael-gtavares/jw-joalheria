import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import dotenv from "dotenv";
import mongoose from "mongoose";
import Admin from "./models/Admin.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import Feedback from "./models/Feedback.js";

dotenv.config();

const products = [
  {
    name: "Anel Flor de Maio",
    slug: "anel-flor-de-maio",
    description: "Anel em prata 925 com detalhe floral trabalhado à mão e banho de ouro 18k.",
    category: "Anéis",
    material: "Prata 925 banhada a ouro",
    price: 289.9,
    stock: 8,
    featured: true,
    images: ["/products/anel-flor-de-maio.png"],
  },
  {
    name: "Brinco Gota de Luz",
    slug: "brinco-gota-de-luz",
    description: "Brinco delicado em formato de gota com zircônias cravejadas à mão.",
    category: "Brincos",
    material: "Prata 925",
    price: 219.9,
    stock: 12,
    featured: true,
    images: ["/products/brinco-gota-de-luz.png"],
  },
  {
    name: "Colar Raiz",
    slug: "colar-raiz",
    description: "Colar minimalista com pingente orgânico inspirado em raízes.",
    category: "Colares",
    material: "Prata 925 banhada a ouro",
    price: 349.0,
    stock: 5,
    featured: true,
    images: ["/products/colar-raiz.png"],
  },
  {
    name: "Pulseira Elos do Tempo",
    slug: "pulseira-elos-do-tempo",
    description: "Pulseira de elos artesanais, peça exclusiva e atemporal.",
    category: "Pulseiras",
    material: "Prata 925",
    price: 259.9,
    stock: 10,
    featured: false,
    images: ["/products/pulseira-elos-do-tempo.png"],
  },
  {
    name: "Anel Ondas do Mar",
    slug: "anel-ondas-do-mar",
    description: "Anel esculpido à mão inspirado no movimento das ondas.",
    category: "Anéis",
    material: "Prata 925",
    price: 269.9,
    stock: 6,
    featured: false,
    images: ["/products/anel-ondas-do-mar.png"],
  },
  {
    name: "Broche Hebe",
    slug: "broche-hebe",
    description: "Broche exclusivo em homenagem à calopsita Hebe, feito sob encomenda.",
    category: "Broches",
    material: "Prata 925 banhada a ouro",
    price: 199.9,
    stock: 4,
    featured: true,
    images: ["/products/broche-hebe.png"],
  },
  {
    name: "Colar Ponto de Luz",
    slug: "colar-ponto-de-luz",
    description: "Colar com pingente solitário em zircônia, ideal para o dia a dia.",
    category: "Colares",
    material: "Prata 925",
    price: 179.9,
    stock: 15,
    featured: false,
    images: ["/products/colar-ponto-de-luz.png"],
  },
  {
    name: "Brinco Argola Autoral",
    slug: "brinco-argola-autoral",
    description: "Argola média texturizada à mão, peça assinatura da JW.",
    category: "Brincos",
    material: "Prata 925 banhada a ouro",
    price: 239.9,
    stock: 9,
    featured: false,
    images: ["/products/brinco-argola-autoral.png"],
  },
];

const feedbackSeed = [
  {
    customerName: "Marina Torres",
    rating: 5,
    message: "Peça linda, chegou muito bem embalada e o acabamento é impecável. Já quero a próxima!",
    approved: true,
  },
  {
    customerName: "Camila Duarte",
    rating: 5,
    message: "Comprei o colar Raiz de presente para minha mãe e ela amou. Atendimento super atencioso.",
    approved: true,
  },
  {
    customerName: "Fernanda Alves",
    rating: 4,
    message: "Anel muito bonito, só demorou um pouco mais que o esperado para chegar.",
    approved: true,
  },
  {
    customerName: "Juliana Prado",
    rating: 5,
    message: "Trabalho autoral de verdade, dá pra sentir o cuidado em cada detalhe da peça.",
    approved: false,
  },
  {
    customerName: "Renata Costa",
    rating: 5,
    message: "Já é a terceira peça que compro, virei cliente fiel da JW Joalheria!",
    approved: true,
  },
  {
    customerName: "Beatriz Martins",
    rating: 5,
    message: "A peça é ainda mais bonita pessoalmente. Design delicado, elegante e cheio de personalidade.",
    approved: true,
  },
  {
    customerName: "Larissa Mendes",
    rating: 5,
    message: "Fiquei encantada com a qualidade e o cuidado da embalagem. A joia é simplesmente perfeita!",
    approved: true,
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Conectado ao MongoDB, iniciando seed...");

  await Product.deleteMany({});
  await Order.deleteMany({});
  await Feedback.deleteMany({});

  const createdProducts = await Product.insertMany(products);
  console.log(`${createdProducts.length} peças criadas.`);

  const feedbackWithProducts = feedbackSeed.map((f, i) => ({
    ...f,
    product: createdProducts[i % createdProducts.length]._id,
  }));
  await Feedback.insertMany(feedbackWithProducts);
  console.log(`${feedbackWithProducts.length} avaliações criadas.`);

  const sampleOrders = [
    {
      customerName: "Beatriz Lima",
      customerEmail: "beatriz.lima@email.com",
      customerPhone: "(21) 99888-1122",
      items: [
        {
          product: createdProducts[0]._id,
          name: createdProducts[0].name,
          price: createdProducts[0].price,
          quantity: 1,
        },
      ],
      total: createdProducts[0].price,
      status: "enviado",
      paymentMethod: "Pix",
    },
    {
      customerName: "Larissa Nunes",
      customerEmail: "larissa.nunes@email.com",
      customerPhone: "(21) 98777-3344",
      items: [
        {
          product: createdProducts[1]._id,
          name: createdProducts[1].name,
          price: createdProducts[1].price,
          quantity: 2,
        },
      ],
      total: createdProducts[1].price * 2,
      status: "confirmado",
      paymentMethod: "Cartão de crédito",
    },
    {
      customerName: "Patrícia Gomes",
      customerEmail: "patricia.gomes@email.com",
      customerPhone: "(21) 99666-5566",
      items: [
        {
          product: createdProducts[2]._id,
          name: createdProducts[2].name,
          price: createdProducts[2].price,
          quantity: 1,
        },
        {
          product: createdProducts[5]._id,
          name: createdProducts[5].name,
          price: createdProducts[5].price,
          quantity: 1,
        },
      ],
      total: createdProducts[2].price + createdProducts[5].price,
      status: "pendente",
      paymentMethod: "Pix",
    },
    {
      customerName: "Sofia Ramos",
      customerEmail: "sofia.ramos@email.com",
      customerPhone: "(21) 99555-7788",
      items: [
        {
          product: createdProducts[3]._id,
          name: createdProducts[3].name,
          price: createdProducts[3].price,
          quantity: 1,
        },
      ],
      total: createdProducts[3].price,
      status: "entregue",
      paymentMethod: "Pix",
    },
  ];
  await Order.insertMany(sampleOrders);
  console.log(`${sampleOrders.length} pedidos criados.`);

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@jwjoalheria.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "troque_essa_senha";
  const existingAdmin = await Admin.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const passwordHash = await Admin.hashPassword(adminPassword);
    await Admin.create({ name: "Janayna Waite", email: adminEmail, passwordHash });
    console.log(`Admin criado: ${adminEmail} (senha definida em ADMIN_PASSWORD no .env)`);
  } else {
    console.log("Admin já existe, mantido como está.");
  }

  console.log("Seed concluído.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
