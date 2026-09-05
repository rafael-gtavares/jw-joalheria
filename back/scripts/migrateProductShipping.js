// Migração/backfill: preenche `shipping.weight` para peças já existentes no
// banco que foram criadas antes deste campo se tornar obrigatório.
//
// Isso evita que produtos antigos fiquem "quebrados" para o cálculo de
// frete ou impeçam edições futuras no painel administrativo. O valor usado
// é apenas um placeholder conservador — a proprietária deve revisar e
// ajustar o peso real de cada peça no painel administrativo assim que
// possível.
//
// Uso:
//   node scripts/migrateProductShipping.js
//
// (ou "npm run migrate:shipping", ver back/package.json)

import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../src/models/Product.js";

dotenv.config();

// Peso padrão (gramas) atribuído a peças sem peso cadastrado. Ajustável via
// variável de ambiente para permitir recalibrar sem editar o script.
const DEFAULT_WEIGHT_GRAMS = Number(process.env.DEFAULT_PRODUCT_WEIGHT_GRAMS) || 20;

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Conectado ao MongoDB, verificando peças sem peso cadastrado...");

  const productsWithoutWeight = await Product.find({
    $or: [
      { "shipping.weight": { $exists: false } },
      { "shipping.weight": null },
    ],
  });

  if (!productsWithoutWeight.length) {
    console.log("Nenhuma peça pendente. Todas já possuem peso cadastrado.");
    await mongoose.disconnect();
    return;
  }

  for (const product of productsWithoutWeight) {
    product.shipping = { weight: DEFAULT_WEIGHT_GRAMS };
    await product.save();
    console.log(`- "${product.name}" atualizada com peso padrão de ${DEFAULT_WEIGHT_GRAMS}g.`);
  }

  console.log(
    `\n${productsWithoutWeight.length} peça(s) atualizada(s) com peso padrão de ${DEFAULT_WEIGHT_GRAMS}g.\n` +
      "IMPORTANTE: revise e ajuste o peso real de cada peça no painel administrativo assim que possível, " +
      "para que o frete calculado seja preciso."
  );

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
