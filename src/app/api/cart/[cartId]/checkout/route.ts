import { NextResponse } from "next/server";
import { Store } from "@/app/lib/store";

export async function POST(
  req: Request,
  { params }: { params: { cartId: string } }
) {
  let promoCode: string | undefined;
  try {
    const body = await req.json();
    if (body && typeof body.promoCode === "string") promoCode = body.promoCode;
  } catch {
    // no body or invalid JSON => just treat as no promoCode
  }

  const order = Store.checkout(params.cartId, promoCode);
  if (!order)
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });

  return NextResponse.json(order, { status: 201 });
}
