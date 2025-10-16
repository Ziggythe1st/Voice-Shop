import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureConversation, addMessage, getMessages } from "@/app/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId)
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  return NextResponse.json({ sessionId, messages: getMessages(sessionId) });
}

export async function POST(req: Request) {
  // Optional: let your Python agent post messages turn-by-turn
  const Body = z.object({
    sessionId: z.string(),
    role: z.enum(["user", "assistant", "system"]),
    text: z.string(),
    ts: z.number().optional(),
    meta: z.any().optional(),
  });
  const m = Body.parse(await req.json());
  ensureConversation(m.sessionId);
  addMessage({ ...m, ts: m.ts ?? Date.now() });
  return NextResponse.json({ ok: true });
}
