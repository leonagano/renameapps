import type { Store } from "@/lib/store/types";

let cached: Promise<Store> | null = null;

export function getStore(): Promise<Store> {
  if (!cached) {
    cached = process.env.DATABASE_URL
      ? import("@/lib/store/neon").then((m) => m.neonStore)
      : import("@/lib/store/memory").then((m) => m.memoryStore);
  }
  return cached;
}
