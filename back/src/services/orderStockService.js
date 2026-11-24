import Order from "../models/Order.js";
import Product from "../models/Product.js";

export class StockError extends Error {}

// Reserva o estoque dos itens de forma atômica (um updateOne condicional por
// item). Se algum item não tiver estoque, devolve o que já havia sido
// abatido e lança StockError, sem deixar o estoque inconsistente.
export async function reserveStock(items) {
  const reserved = [];

  for (const item of items) {
    const result = await Product.updateOne(
      { _id: item.product, active: { $ne: false }, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );

    if (result.modifiedCount !== 1) {
      await restoreStock(reserved);
      throw new StockError(
        `A peça "${item.name}" não tem estoque suficiente para a quantidade pedida.`
      );
    }
    reserved.push(item);
  }
}

export async function restoreStock(items) {
  for (const item of items) {
    await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
  }
}

// Devolve o estoque reservado de um pedido no máximo uma vez. O flag
// stockReleased é marcado de forma atômica ANTES de repor, então chamadas
// concorrentes (webhook + expiração) nunca devolvem em duplicidade.
export async function releaseOrderStock(orderId) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, stockReserved: true, stockReleased: false },
    { $set: { stockReleased: true } },
    { new: true }
  );

  if (!order) return false;

  await restoreStock(order.items.filter((i) => i.product));
  return true;
}

// Reserva novamente o estoque de um pedido cujo estoque já havia sido
// devolvido (ex.: pagamento aprovado chegou depois da expiração). Retorna
// false se não houver estoque; nesse caso o pedido segue pago e o admin
// precisa resolver manualmente.
export async function reReserveOrderStock(order) {
  if (!order.stockReleased) return true;

  try {
    await reserveStock(order.items.filter((i) => i.product));
  } catch (err) {
    if (err instanceof StockError) return false;
    throw err;
  }

  await Order.updateOne({ _id: order._id }, { $set: { stockReleased: false } });
  return true;
}
