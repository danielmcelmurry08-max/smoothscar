import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { getProduct, priceOf, ProductId } from "./catalog";
import { storage } from "./utils/storage";

export type CartLine = { id: ProductId; qty: number };
type Cart = {
  lines: CartLine[];
  count: number;
  /** Total of priced lines, or null when any line has no verified price. */
  total: number | null;
  add: (id: ProductId, qty: number) => void;
  setQty: (id: ProductId, qty: number) => void;
  remove: (id: ProductId) => void;
};

const KEY = "smoothscar.cart.v1";
const MAX_QTY = 20;
const CartContext = createContext<Cart | null>(null);
const clamp = (n: number) => Math.max(1, Math.min(MAX_QTY, Math.floor(n) || 1));

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    storage.getItem(KEY, "[]").then((raw) => {
      try {
        const parsed = JSON.parse(String(raw ?? "[]")) as CartLine[];
        setLines(parsed.filter((l) => getProduct(l.id)).map((l) => ({ id: l.id, qty: clamp(l.qty) })));
      } catch {
        setLines([]);
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) storage.setItem(KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const value = useMemo<Cart>(() => {
    const prices = lines.map((l) => priceOf(l.id));
    return {
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      total: lines.length && prices.every((p) => p != null) ? lines.reduce((s, l, i) => s + (prices[i] as number) * l.qty, 0) : null,
      add: (id, qty) =>
        setLines((cur) => (cur.some((l) => l.id === id) ? cur.map((l) => (l.id === id ? { ...l, qty: clamp(l.qty + qty) } : l)) : [...cur, { id, qty: clamp(qty) }])),
      setQty: (id, qty) => setLines((cur) => cur.map((l) => (l.id === id ? { ...l, qty: clamp(qty) } : l))),
      remove: (id) => setLines((cur) => cur.filter((l) => l.id !== id)),
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
