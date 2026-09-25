# RenameApps

Crowdsourced, tongue-in-cheek satire platform for giving "honest" names to popular apps and tech
tools, in a high-density macOS Launchpad UI. Implements `renameapps_prd.md`; visual layout ported
from `rename_tech_honest_launchpad.html`.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Neon (serverless Postgres) via `@neondatabase/serverless`, with an in-memory fallback store for
  local development when `DATABASE_URL` isn't set (`src/lib/store/memory.ts`)
- Tally.so for paid "Feature Your App" submissions, via webhook
- `next/og` for social share image generation

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in what you have; everything is optional locally
npm run dev
```

Without `DATABASE_URL`, the app runs entirely in memory (seeded from
`src/lib/data/seed-apps.ts`) and resets whenever the dev server restarts — good enough to build
and demo the UI. To persist data:

1. Create a Neon Postgres database.
2. Run `src/lib/schema.sql` against it.
3. Set `DATABASE_URL` in `.env.local` (or your Vercel project env vars).

## Environment variables

See `.env.example`. Notably:

- `IP_HASH_SALT` — salt for hashing visitor IPs before they're stored (rate limiting without
  storing raw IPs). Set a real random value in production.
- `TALLY_WEBHOOK_SECRET` — shared secret configured on the Tally webhook; verified against the
  `Tally-Signature` header on `POST /api/webhooks/tally`.

## How the PRD requirements map to the code

| PRD ref | Implementation |
| --- | --- |
| 3.1 Launchpad grid, categories | `src/components/LaunchpadApp.tsx`, `src/lib/categories.ts` |
| 3.2 Zero-friction inline editing | `EditModal.tsx` → `POST /api/apps/[id]/renames` |
| 3.3 Rate limiting & bot protection | `src/lib/honeypot.ts`, `src/proxy.ts` (edge throttle), per-store rate-limit checks in `src/lib/store/*.ts` |
| 3.4 Upvoting / alternatives drawer | `POST /api/renames/[id]/upvote`, alternatives list in `EditModal.tsx` |
| 3.5 Live feed ticker | `FeedPanel.tsx`, polls `GET /api/feed` |
| 3.6 Social share | `GET /api/og`, share buttons in `EditModal.tsx` |
| 4 Tally monetization + webhook | "Add Your App" links to `https://tally.so/r/VLgvKE` (`LaunchpadApp.tsx`), `POST /api/webhooks/tally` |
| 5.2 Data model | `src/lib/schema.sql` |

### Rate limiting specifics (FR-04)

- **Per-IP-per-app rename cooldown**: 24h, enforced in `store.submitRename`.
- **Global rename limit**: 20 renames/min/IP (raised from the PRD's original 5/min — 5 was too
  easy to hit legitimately, e.g. renaming a single popular app repeatedly), enforced in
  `store.submitRename` (DB/memory check) plus a coarser 30-req/min edge throttle in
  `src/proxy.ts` as defense in depth.
- **Upvotes**: 1 per IP per app (not time-windowed — PRD's stated rule), enforced in
  `store.toggleUpvote`.
- IPs are never stored raw — only `sha256(salt + ip)` (`src/lib/ip-hash.ts`).

The edge throttle in `src/proxy.ts` uses an in-memory `Map`, which is per-instance. That's fine for
a single Vercel region or local dev; if you scale to multiple edge regions, swap it for Upstash
Redis (as the PRD suggests) so the counter is shared.

## Tally webhook setup

1. Build a Tally form with fields whose **labels** contain: "name", "url"/"website"/"link",
   "category", "honest" (the honest name), and "tier"/"placement"/"plan". Field labels are matched
   case-insensitively by keyword — see `findField` in
   `src/app/api/webhooks/tally/route.ts`.
2. Point the Tally webhook at `https://your-domain/api/webhooks/tally`.
3. Set the same secret in Tally and in `TALLY_WEBHOOK_SECRET`.

## Known gaps / follow-ups

- Icon/category are free text on the Tally submission today; there's no moderation queue UI for
  free-tier submissions (PRD §4.1) — they go live immediately via the webhook, same as sponsored
  ones. Add a `status` column + admin view if you need a review step.
- `next/og` share cards use inline hex colors derived from the app's Tailwind gradient class
  (`src/lib/tailwind-colors.ts`); only the palette used by the seed dataset is mapped.
