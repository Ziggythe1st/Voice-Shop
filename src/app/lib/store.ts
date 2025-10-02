import { Product, Cart, Order, Promo } from "./types";

export const PRODUCTS: Product[] = [
  {
    id: "p-100",
    name: "AuWireless over-ear with spatial audio",
    price: 12900,
    currency: "USD",
    sku: "AUR-HE-001",
    stock: 12,
    category: "audio",
    image: "https://picsum.photos/id/180/600/400",
    description: "",
  },
  {
    id: "p-101",
    name: "Nimbus Keyboard",
    description: "Low-profile mechanical, hot-swappable",
    price: 9900,
    currency: "USD",
    sku: "NIM-KB-002",
    stock: 8,
    category: "peripherals",
    image: "https://picsum.photos/id/1060/600/400",
  },
  {
    id: "p-102",
    name: "Lumen Desk Lamp",
    description: "USB-C smart lamp, warm-to-cool",
    price: 5900,
    currency: "USD",
    sku: "LUM-LA-003",
    stock: 25,
    category: "home",
    image: "https://picsum.photos/id/29/600/400",
  },
];

// --- Promos
export const PROMOS: Promo[] = [
  { code: "WELCOME10", description: "10% off first order", discountPct: 10 },
  { code: "FREESHIP", description: "Free shipping over $50", discountPct: 0 },
];

// --- Carts & Orders
const carts = new Map<string, Cart>();
const orders = new Map<string, Order>();

const id = () => Math.random().toString(36).slice(2, 10);

export const Store = {
  listProducts(query?: string, category?: string) {
    let data = PRODUCTS.slice();
    if (category) data = data.filter((p) => p.category === category);
    if (query) {
      const q = query.toLowerCase();
      data = data.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return data;
  },
  getProduct(productId: string) {
    return PRODUCTS.find((p) => p.id === productId) || null;
  },
  createCart() {
    const cart: Cart = { id: id(), items: [] }; // ← plain object
    carts.set(cart.id, cart);
    return cart;
  },
  getCart(cartId: string) {
    return carts.get(cartId) || null;
  },
  addToCart(cartId: string, productId: string, quantity: number) {
    const cart = carts.get(cartId);
    if (!cart) return null;
    const product = this.getProduct(productId);
    if (!product) return null;
    const current = cart.items.find((i) => i.productId === productId);
    if (current) current.quantity += quantity;
    else cart.items.push({ productId, quantity });
    return cart;
  },
  checkout(cartId: string, promoCode?: string) {
    const cart = carts.get(cartId);
    if (!cart) return null;
    let subtotal = 0;
    for (const i of cart.items) {
      const p = this.getProduct(i.productId);
      if (!p) continue;
      subtotal += p.price * i.quantity;
    }
    let discount = 0;
    if (promoCode) {
      const promo = PROMOS.find(
        (p) => p.code.toUpperCase() === promoCode.toUpperCase()
      );
      if (promo) discount = Math.round((subtotal * promo.discountPct) / 100);
    }
    const total = Math.max(0, subtotal - discount);
    const order: Order = {
      id: "o-" + id(),
      cartId,
      total,
      currency: "USD",
      status: "processing",
      etaDays: 5,
      createdAt: new Date().toISOString(),
    };
    orders.set(order.id, order);
    return order;
  },
  getOrder(orderId: string) {
    return orders.get(orderId) || null;
  },
  listPromos() {
    return PROMOS;
  },
};
