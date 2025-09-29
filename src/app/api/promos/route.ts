import { NextResponse } from "next/server";
import { Store } from "@/app/lib/store";

export async function GET() {
  return NextResponse.json({ promos: Store.listPromos() });
}
