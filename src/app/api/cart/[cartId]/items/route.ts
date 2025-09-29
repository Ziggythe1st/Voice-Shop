import { NextResponse } from "next/server";
import { Store } from "@/app/lib/store";

export async function POST(
  req: Request,
  { params }: { params: { cartId: string } }
) {
  const { productId, quantity } = await req.json();
  if (!productId || !quantity || quantity < 1) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const cart = Store.addToCart(params.cartId, productId, quantity);
  if (!cart) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(cart);
}
