import { NextResponse } from "next/server";
import { Store } from "@/app/lib/store";

export async function POST(
  req: Request,
  { params }: { params: { cartId: string } }
) {
  const { promoCode } = await req
    .json()
    .catch(() => ({ promoCode: undefined }));
  const order = Store.checkout(params.cartId, promoCode);
  if (!order)
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  return NextResponse.json(order, { status: 201 });
}
