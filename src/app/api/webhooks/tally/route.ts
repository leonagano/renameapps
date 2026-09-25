import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import type { SponsorTier, TallySubmission } from "@/lib/types";

interface TallyField {
  key: string;
  label: string;
  type: string;
  value: unknown;
}

interface TallyPayload {
  eventId: string;
  eventType: string;
  data: {
    fields: TallyField[];
  };
}

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

function findField(fields: TallyField[], labelMatch: RegExp): string {
  const field = fields.find((f) => labelMatch.test(f.label ?? ""));
  if (!field || field.value == null) return "";
  return Array.isArray(field.value) ? String(field.value[0] ?? "") : String(field.value);
}

function normalizeTier(raw: string): SponsorTier {
  const lower = raw.toLowerCase();
  if (lower.includes("takeover") || lower.includes("99")) return "takeover";
  if (lower.includes("featured") || lower.includes("29")) return "featured";
  return "free";
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const secret = process.env.TALLY_WEBHOOK_SECRET;

  if (secret) {
    const signature = req.headers.get("tally-signature");
    if (!verifySignature(rawBody, signature, secret)) {
      return NextResponse.json({ ok: false, message: "Invalid signature." }, { status: 401 });
    }
  }

  let payload: TallyPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const fields = payload.data?.fields ?? [];
  const name = findField(fields, /name/i);
  const websiteUrl = findField(fields, /url|website|link/i);
  const category = findField(fields, /category/i) || "Enterprise";
  const honestName = findField(fields, /honest/i);
  const tierRaw = findField(fields, /tier|placement|plan/i);

  if (!name || !honestName) {
    return NextResponse.json(
      { ok: false, message: "Missing required fields (name, honest name)." },
      { status: 400 }
    );
  }

  const submission: TallySubmission = {
    name,
    websiteUrl: websiteUrl || undefined,
    category,
    honestName,
    tier: normalizeTier(tierRaw),
  };

  const store = await getStore();
  const app = await store.createFromTally(submission);

  return NextResponse.json({ ok: true, app });
}
