export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: "USD";
  sku: string;
  stock: number;
  category: string;
  image?: string;
};

export type CartItem = { productId: string; quantity: number };
export type Cart = { id: string; items: CartItem[] };

export type Order = {
  id: string;
  cartId: string;
  total: number; // cents
  currency: "USD";
  status: "processing" | "paid" | "shipped" | "delivered";
  etaDays: number;
  createdAt: string;
};

export type Promo = {
  code: string;
  description: string;
  discountPct: number; // 0..100
};
