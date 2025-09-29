import { NextResponse } from "next/server";
import { Store } from "@/app/lib/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const category = searchParams.get("category") || undefined;
  return NextResponse.json({ products: Store.listProducts(q, category) });
}
