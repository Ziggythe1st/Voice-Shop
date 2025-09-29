"use client";
import { useEffect, useMemo, useState } from "react";
import type { Product, Cart } from "./lib/types";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [promo, setPromo] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products));
  }, []);

  const makeCart = async () => {
    if (cart) return;
    const r = await fetch("/api/cart", { method: "POST" });
    const c = await r.json();
    setCart(c);
  };

  const add = async (id: string) => {
    if (!cart) await makeCart();
    const cartId =
      cart?.id ||
      (await (await fetch("/api/cart", { method: "POST" })).json()).id;
    const r = await fetch(`/api/cart/${cartId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, quantity: 1 }),
    });
    const c = await r.json();
    setCart(c);
  };

  const checkout = async () => {
    if (!cart) return;
    const r = await fetch(`/api/cart/${cart.id}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promoCode: promo || undefined }),
    });
    const o = await r.json();
    setOrderId(o.id);
  };

  const totalCents = useMemo(() => {
    if (!cart) return 0;
    return cart.items.reduce((sum, it) => {
      const p = products.find((pr) => pr.id === it.productId);
      return sum + (p ? p.price * it.quantity : 0);
    }, 0);
  }, [cart, products]);

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Voice Shop (Demo)</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-4">
            <input
              placeholder="Search products..."
              className="border rounded px-3 py-2 w-full"
              onChange={async (e) => {
                const q = e.target.value;
                const r = await fetch(
                  `/api/products${q ? `?q=${encodeURIComponent(q)}` : ""}`
                );
                const d = await r.json();
                setProducts(d.products);
              }}
            />
            <button
              className="border rounded px-3 py-2"
              onClick={() => setPromo((p) => (p ? "" : "WELCOME10"))}
            >
              {promo ? `Promo: ${promo}` : "Apply WELCOME10"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="border rounded-xl p-4 flex flex-col gap-2 shadow-sm"
              >
                {p.image && (
                  <img src={p.image} alt={p.name} className="rounded-lg" />
                )}
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-gray-600">{p.description}</div>
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-medium">
                    ${(p.price / 100).toFixed(2)}
                  </span>
                  <button
                    onClick={() => add(p.id)}
                    className="bg-black text-white px-3 py-1 rounded-lg"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="border rounded-xl p-4 h-fit sticky top-4 space-y-3">
          <h2 className="font-semibold text-lg">Cart</h2>
          {!cart && (
            <button onClick={makeCart} className="border px-3 py-1 rounded">
              Create Cart
            </button>
          )}
          {cart && (
            <div className="space-y-2">
              {cart.items.length === 0 && (
                <div className="text-sm text-gray-500">Empty</div>
              )}
              {cart.items.map((it) => {
                const p = products.find((pr) => pr.id === it.productId);
                if (!p) return null;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>
                      {p.name} × {it.quantity}
                    </span>
                    <span>${((p.price * it.quantity) / 100).toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="border-t pt-2 flex items-center justify-between font-medium">
                <span>Total</span>
                <span>${(totalCents / 100).toFixed(2)}</span>
              </div>
              <button
                onClick={checkout}
                className="w-full bg-black text-white py-2 rounded-lg"
              >
                Checkout
              </button>
              {orderId && (
                <div className="text-sm">
                  Order created: <code>{orderId}</code>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
