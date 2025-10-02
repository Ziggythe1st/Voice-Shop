import { NextResponse } from "next/server";
import { Store } from "@/app/lib/store";

export async function POST(
  req: Request,
  { params }: { params: { cartId: string } }
) {
  // Parse JSON safely (no body or invalid JSON => 400)
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { productId, quantity } = body ?? {};
  if (
    typeof productId !== "string" ||
    typeof quantity !== "number" ||
    !Number.isFinite(quantity) ||
    quantity < 1
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const cart = Store.addToCart(params.cartId, productId, quantity);
  if (!cart) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(cart);
}
