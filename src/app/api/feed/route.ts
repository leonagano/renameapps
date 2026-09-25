import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET(req: Request) {
  const store = await getStore();
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 25, 50);
  const feed = await store.listFeed(limit);
  return NextResponse.json({ feed });
}
