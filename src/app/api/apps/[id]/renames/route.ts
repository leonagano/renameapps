import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { getRequestIpHash } from "@/lib/ip-hash";
import { isBot } from "@/lib/honeypot";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = await getStore();
  const alternatives = await store.listAlternatives(id);
  return NextResponse.json({ alternatives });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  if (isBot(body)) {
    // Pretend it worked so scripts don't learn the honeypot exists.
    return NextResponse.json({ ok: true });
  }

  const honestName = typeof body.honestName === "string" ? body.honestName : "";
  const store = await getStore();
  const ipHash = await getRequestIpHash();
  const result = await store.submitRename(id, honestName, ipHash);

  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : result.reason === "invalid" ? 400 : 429;
    const messages: Record<string, string> = {
      cooldown: "You already renamed this app in the last 24 hours.",
      global_limit: "Whoa, slow down — max 5 renames per minute.",
      not_found: "App not found.",
      invalid: "Honest name must be 1-120 characters.",
    };
    return NextResponse.json({ ok: false, message: messages[result.reason] }, { status });
  }

  return NextResponse.json({ ok: true, rename: result.rename });
}
