import { NextResponse, type NextRequest } from "next/server";

// Coarse, best-effort edge throttle in front of the DB-backed rate limiter in
// lib/store. Single-instance in-memory map: fine for one Vercel region / dev,
// swap for Upstash Redis if you scale to multiple edge regions.
// Kept above the store's GLOBAL_LIMIT_MAX (renames/min) so this coarse net
// only catches abuse, not legitimate rename bursts that the DB check already allows.
const WINDOW_MS = 60_000;
const MAX_WRITES_PER_WINDOW = 30;
const hits = new Map<string, number[]>();

export function proxy(req: NextRequest) {
  if (req.method !== "POST") return NextResponse.next();

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0";

  const now = Date.now();
  const timestamps = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_WRITES_PER_WINDOW) {
    return NextResponse.json(
      { ok: false, message: "Too many requests. Slow down." },
      { status: 429 }
    );
  }

  timestamps.push(now);
  hits.set(ip, timestamps);
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/apps/:path*", "/api/renames/:path*"],
};
