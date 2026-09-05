import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { cartApi } from "../api/cartApi";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const { user } = useAuth();

  // Evita salvar no backend antes do carrinho da conta ter sido carregado
  // (senão sobrescreveríamos o carrinho salvo com um array vazio inicial).
  const cartLoadedRef = useRef(false);

  // Sempre que o usuário logado mudar (login, troca de conta ou logout),
  // busca o carrinho vinculado a essa conta no backend. Sem usuário
  // logado, não existe carrinho persistido (adicionar item exige login).
  useEffect(() => {
    cartLoadedRef.current = false;

    if (!user) {
      setItems([]);
      return;
    }

    cartApi
      .get()
      .then((serverItems) => setItems(serverItems))
      .catch(() => setItems([]))
      .finally(() => {
        cartLoadedRef.current = true;
      });
  }, [user]);

  // Sincroniza qualquer alteração do carrinho de volta para a conta.
  useEffect(() => {
    if (!user || !cartLoadedRef.current) return;
    cartApi.update(items).catch(() => {});
  }, [items, user]);

  // Visitante pode navegar livremente; a autenticação só é exigida no
  // momento de adicionar um produto ao carrinho. A mesma trava pode
  // futuramente ser reaproveitada para finalizar pedido, pagamento,
  // histórico, etc.
  function addItem(product, quantity = 1) {
    if (!user) {
      setAuthPromptOpen(true);
      return false;
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product._id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0]?.url || product.images?.[0] || "",
          quantity,
        },
      ];
    });
    setOpen(true);
    return true;
  }

  function removeItem(productId) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function updateQuantity(productId, quantity) {
    if (quantity < 1) return removeItem(productId);
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  }

  function clearCart() {
    setItems([]);
  }

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        open,
        setOpen,
        authPromptOpen,
        setAuthPromptOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}