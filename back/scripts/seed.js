import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../src/models/Product.js";
import Order from "../src/models/Order.js";
import Review from "../src/models/Review.js";

dotenv.config();

const products = [
  {
    name: "Anel Flor de Maio",
    slug: "anel-flor-de-maio",
    description: "Anel em prata 950 com detalhe floral trabalhado à mão e banho de ouro 18k.",
    category: "Anéis",
    collectionName: "Origem",
    material: "Prata 950 banhada a ouro 18k",
    price: 289.9,
    stock: 8,
    featured: true,
    images: [{ url: "/products/anel-flor-de-maio.png" }],
    shipping: { weight: 18 },
  },
  {
    name: "Brinco Gota de Luz",
    slug: "brinco-gota-de-luz",
    description: "Brinco delicado em formato de gota com madrepérola.",
    category: "Brincos",
    collectionName: "Origem",
    material: "Prata 950",
    price: 219.9,
    stock: 12,
    featured: true,
    images: [{ url: "/products/brinco-gota-de-luz.png" }],
    shipping: { weight: 12 },
  },
  {
    name: "Colar Raiz",
    slug: "colar-raiz",
    description: "Colar minimalista com pingente orgânico inspirado em raízes.",
    category: "Colares",
    collectionName: "Bauhaus",
    material: "Prata 950 banhada a ouro 18k",
    price: 349.0,
    stock: 5,
    featured: true,
    images: [{ url: "/products/colar-raiz.png" }],
    shipping: { weight: 25 },
  },
  {
    name: "Pulseira Elos do Tempo",
    slug: "pulseira-elos-do-tempo",
    description: "Pulseira de elos artesanais, peça exclusiva e atemporal.",
    category: "Pulseiras",
    collectionName: "Bauhaus",
    material: "Prata 950",
    price: 259.9,
    stock: 10,
    featured: false,
    images: [{ url: "/products/pulseira-elos-do-tempo.png" }],
    shipping: { weight: 22 },
  },
  {
    name: "Anel Ondas do Mar",
    slug: "anel-ondas-do-mar",
    description: "Anel esculpido à mão inspirado no movimento das ondas, com ágata.",
    category: "Anéis",
    collectionName: "Origem",
    material: "Prata 950",
    price: 269.9,
    stock: 6,
    featured: false,
    images: [{ url: "/products/anel-ondas-do-mar.png" }],
    shipping: { weight: 20 },
  },
  {
    name: "Broche Hebe",
    slug: "broche-hebe",
    description: "Broche exclusivo com ametista, peça-assinatura da JW.",
    category: "Broches",
    collectionName: "",
    material: "Prata 950 banhada a ouro 18k",
    price: 199.9,
    stock: 4,
    featured: true,
    images: [{ url: "/products/broche-hebe.png" }],
    shipping: { weight: 15 },
  },
  {
    name: "Colar Ponto de Luz",
    slug: "colar-ponto-de-luz",
    description: "Colar com pingente solitário em quartzo, ideal para o dia a dia.",
    category: "Colares",
    collectionName: "Bauhaus",
    material: "Prata 950",
    price: 179.9,
    stock: 15,
    featured: false,
    images: [{ url: "/products/colar-ponto-de-luz.png" }],
    shipping: { weight: 20 },
  },
  {
    name: "Brinco Argola Autoral",
    slug: "brinco-argola-autoral",
    description: "Argola média texturizada à mão, peça-assinatura da JW.",
    category: "Brincos",
    collectionName: "",
    material: "Prata 950 banhada a ouro 18k",
    price: 239.9,
    stock: 9,
    featured: false,
    images: [{ url: "/products/brinco-argola-autoral.png" }],
    shipping: { weight: 14 },
  },
];

const reviewsSeed = [
  { customerName: "Marina Torres", rating: 5, message: "Peça linda, chegou muito bem embalada e o acabamento é impecável. Já quero a próxima!", approved: true, featuredHome: true },
  { customerName: "Camila Duarte", rating: 5, message: "Comprei o colar Raiz de presente para minha mãe e ela amou. Atendimento super atencioso.", approved: true, featuredHome: true },
  { customerName: "Fernanda Alves", rating: 4, message: "Anel muito bonito, só demorou um pouco mais que o esperado para chegar.", approved: true, featuredHome: false },
  { customerName: "Juliana Prado", rating: 5, message: "Trabalho autoral de verdade, dá pra sentir o cuidado em cada detalhe da peça.", approved: false, featuredHome: false },
  { customerName: "Renata Costa", rating: 5, message: "Já é a terceira peça que compro, virei cliente fiel da JW Joalheria!", approved: true, featuredHome: true },
  { customerName: "Beatriz Martins", rating: 5, message: "A peça é ainda mais bonita pessoalmente. Design delicado, elegante e cheio de personalidade.", approved: true, featuredHome: false },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Conectado ao MongoDB, iniciando seed...");

  await Product.deleteMany({});
  await Order.deleteMany({});
  await Review.deleteMany({});

  const createdProducts = await Product.insertMany(products);
  console.log(`${createdProducts.length} peças criadas.`);

  const reviewsWithProducts = reviewsSeed.map((r, i) => ({
    ...r,
    product: createdProducts[i % createdProducts.length]._id,
  }));
  await Review.insertMany(reviewsWithProducts);
  console.log(`${reviewsWithProducts.length} avaliações criadas.`);

  const sampleOrders = [
    {
      customerName: "Beatriz Lima",
      customerPhone: "(21) 99888-1122",
      items: [{ product: createdProducts[0]._id, name: createdProducts[0].name, price: createdProducts[0].price, quantity: 1 }],
      subtotal: createdProducts[0].price,
      shippingCep: "20000-000",
      shippingCost: 20,
      total: createdProducts[0].price + 20,
      status: "enviado",
      paymentMethod: "Pix",
    },
    {
      customerName: "Larissa Nunes",
      customerPhone: "(21) 98777-3344",
      items: [{ product: createdProducts[1]._id, name: createdProducts[1].name, price: createdProducts[1].price, quantity: 2 }],
      subtotal: createdProducts[1].price * 2,
      shippingCep: "01000-000",
      shippingCost: 22,
      total: createdProducts[1].price * 2 + 22,
      status: "confirmado",
      paymentMethod: "Cartão de crédito (6x sem juros)",
    },
  ];
  await Order.insertMany(sampleOrders);
  console.log(`${sampleOrders.length} pedidos criados.`);

  console.log(
    "\nSeed concluído. IMPORTANTE: o login administrativo agora usa Firebase Authentication.\n" +
      "Crie o usuário admin no Console do Firebase (Authentication > Users) e adicione o e-mail\n" +
      "correspondente na variável ADMIN_EMAILS do backend/.env."
  );
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
