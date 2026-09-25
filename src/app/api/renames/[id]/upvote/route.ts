import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { getRequestIpHash } from "@/lib/ip-hash";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: renameId } = await params;
  const body = await req.json().catch(() => ({}));
  const appId = typeof body.appId === "string" ? body.appId : "";

  if (!appId) {
    return NextResponse.json({ ok: false, message: "Missing appId." }, { status: 400 });
  }

  const store = await getStore();
  const ipHash = await getRequestIpHash();
  const result = await store.toggleUpvote(appId, renameId, ipHash);

  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : 409;
    const messages: Record<string, string> = {
      already_upvoted: "You already upvoted a rename for this app.",
      not_found: "Rename not found.",
    };
    return NextResponse.json({ ok: false, message: messages[result.reason] }, { status });
  }

  return NextResponse.json({ ok: true, upvotes: result.upvotes });
}
