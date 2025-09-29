import { NextResponse } from "next/server";
import { Store } from "@/app/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: { cartId: string } }
) {
  const cart = Store.getCart(params.cartId);
  if (!cart) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(cart);
}
