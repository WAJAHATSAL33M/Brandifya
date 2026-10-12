"use client";
import { useEffect, useState } from "react";
import { sanitizeCart, type CartItem, type Product } from "../lib/catalog";
export type StoreConfig = {
  live: boolean;
  cod: boolean;
  stripe: boolean;
  country: string;
  currency: string;
  shippingMinor: number;
};
export function useStore() {
  const [catalog, setCatalog] = useState<Product[]>([]),
    [cart, setCart] = useState<CartItem[]>([]),
    [saved, setSaved] = useState<number[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [config, setConfig] = useState<StoreConfig | null>(null),
    [configError, setConfigError] = useState(false),
    [notice, setNotice] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    setConfigError(false);
    const results = await Promise.allSettled([
      fetch("/api/catalog", { cache: "no-store" }).then(async (r) => {
        if (!r.ok) throw Error();
        const d = await r.json();
        if (!Array.isArray(d.products)) throw Error();
        return d;
      }),
      fetch("/api/checkout", { cache: "no-store" }).then(async (r) => {
        if (!r.ok) throw Error();
        return r.json();
      }),
    ]);
    const inventory = results[0],
      settings = results[1];
    if (inventory.status === "fulfilled") {
      setCatalog(inventory.value.products);
      try {
        const original = JSON.parse(
            localStorage.getItem("brandifya-cart") || "[]",
          ),
          next = sanitizeCart(original, inventory.value.products);
        setCart(next);
        localStorage.setItem("brandifya-cart", JSON.stringify(next));
        if (JSON.stringify(original) !== JSON.stringify(next))
          setNotice("Your cart was updated to match current availability.");
      } catch {
        setCart([]);
      }
      try {
        const value = JSON.parse(
          localStorage.getItem("brandifya-saved") || "[]",
        );
        setSaved(
          Array.isArray(value)
            ? [
                ...new Set<number>(
                  value.filter(
                    (id: unknown): id is number =>
                      typeof id === "number" &&
                      Number.isSafeInteger(id) &&
                      (id > 0 || (id >= -12 && id < 0)),
                  ),
                ),
              ]
            : [],
        );
      } catch {
        setSaved([]);
      }
    } else
      setError(
        "We couldn’t load the products. Your saved cart has been kept. Please try again.",
      );
    if (settings.status === "fulfilled") setConfig(settings.value);
    else setConfigError(true);
    setLoading(false);
  }
  useEffect(() => {
    load();
    const sync = (e: StorageEvent) => {
      if (e.key === "brandifya-cart" || e.key === "brandifya-saved") load();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function updateCart(next: CartItem[]) {
    setCart(next);
    try {
      localStorage.setItem("brandifya-cart", JSON.stringify(next));
    } catch {
      setNotice(
        "Your browser couldn’t save your cart. Please allow browser storage before checkout.",
      );
    }
  }
  function quantity(id: number, value: number) {
    const p = catalog.find((p) => p.id === id);
    if (!p) return;
    updateCart(
      value < 1
        ? cart.filter((i) => i.id !== id)
        : cart.map((i) =>
            i.id === id ? { ...i, quantity: Math.min(value, p.stock, 99) } : i,
          ),
    );
  }
  function add(p: Product, value: number) {
    const current = catalog.find((item) => item.id === p.id);
    if (!current) return false;
    const count = cart.find((i) => i.id === p.id)?.quantity || 0;
    if (
      p.id < 1 ||
      !Number.isInteger(value) ||
      value < 1 ||
      count + value > Math.min(current.stock, 99)
    )
      return false;
    updateCart(
      count
        ? cart.map((i) =>
            i.id === p.id ? { ...i, quantity: count + value } : i,
          )
        : [...cart, { id: p.id, quantity: value }],
    );
    setNotice(`${p.name} added to your cart.`);
    return true;
  }
  function favorite(id: number) {
    const next = saved.includes(id)
      ? saved.filter((i) => i !== id)
      : [...saved, id];
    setSaved(next);
    try {
      localStorage.setItem("brandifya-saved", JSON.stringify(next));
    } catch {
      setNotice("Your browser couldn’t save your favorites.");
    }
  }
  return {
    catalog,
    cart,
    saved,
    loading,
    error,
    config,
    configError,
    notice,
    setNotice,
    load,
    quantity,
    add,
    favorite,
    clearCart: () => updateCart([]),
    count: cart.reduce((n, i) => n + i.quantity, 0),
  };
}
export type Store = ReturnType<typeof useStore>;
