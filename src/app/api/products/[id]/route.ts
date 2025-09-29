import { NextResponse } from "next/server";
import { Store } from "@/app/lib/store";

export async function GET(_req: Request, {params} : {params: {id: string} } ) {
  const p = Store.getProduct(params.id);
  if (!p) return NextResponse.json({  error: 'Not found'}, {status: 404});
  return NextResponse.json(p);
}

