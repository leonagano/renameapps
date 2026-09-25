import { createHash } from "crypto";
import { headers } from "next/headers";

const SALT = process.env.IP_HASH_SALT ?? "renameapps-dev-salt-change-me";

export function hashIp(ip: string): string {
  return createHash("sha256").update(`${SALT}:${ip}`).digest("hex");
}

export async function getRequestIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  return "0.0.0.0";
}

export async function getRequestIpHash(): Promise<string> {
  return hashIp(await getRequestIp());
}
