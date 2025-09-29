import { NextResponse } from "next/server";
import { Store } from "@/app/lib/store";

export async function POST() {
  const cart = Store.createCart();
  return NextResponse.json(cart, { status: 201 });
}
