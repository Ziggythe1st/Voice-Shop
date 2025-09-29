import { NextResponse } from "next/server";
import { Store } from "@/app/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: { orderId: string } }
) {
  const order = Store.getOrder(params.orderId);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}
