import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { getRequestIpHash } from "@/lib/ip-hash";

export async function GET() {
  const store = await getStore();
  const ipHash = await getRequestIpHash();
  const apps = await store.listApps(ipHash);
  return NextResponse.json({ apps });
}
