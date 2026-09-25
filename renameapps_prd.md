# Product Requirement Document (PRD): **RenameApps**

**Document Details:**

* **Product Name:** RenameApps
* **Document Status:** Draft / Ready for Engineering
* **Target Audience:** Software Developers, Tech Workers, Founders, Product Managers, VCs, Tech Enthusiasts
* **Core Concept:** A crowdsourced, tongue-in-cheek satire platform where users give "honest" names to popular apps, tech tools, and startups in a high-density macOS Launchpad UI.

---

## 1. Executive Summary & Vision

**RenameApps** transforms corporate tech branding into an interactive, crowd-edited digital playground. Utilizing a high-density macOS Launchpad layout and handwritten "marker overlay" aesthetic, the platform allows users to re-label recognizable apps with funny, brutally honest descriptions (e.g., *Slack* $\rightarrow$ *"Anxiety Red Dot"*, *AWS* $\rightarrow$ *"Surprise $4,000 Bill"*).

By pairing zero-friction editing mechanics with real-time global feed tickers, IP-based rate limiting, and 1-click social sharing, **RenameApps** is built for rapid viral loops across X (Twitter), Hacker News, Product Hunt, and Reddit.

---

## 2. Target Personas

1. **The Tech Consumer / Dev (Primary User):**
* Wants quick, relatable humor during work breaks.
* Enjoys upvoting top community roasts and contributing clever renames.
* Loves sharing custom-generated app grids on social media.


2. **The Indie Hacker / Early-Stage Founder (Monetization Persona):**
* Wants cheap, targeted exposure for their new tool or startup.
* Uses the simple Tally form submission to feature their startup on the main grid.



---

## 3. Key User Flows & Features

### 3.1. High-Density Launchpad App Grid

* **Visual Experience:** Full-screen responsive grid mimicking macOS Launchpad/iOS App Library with app icons, original names, and top crowd-voted "honest" names displayed in a red-marker font.
* **Pagination & Categories:** Supports hundreds of apps grouped into filterable tabs:
* *AI & ML*
* *DevTools & Cloud*
* *Productivity & SaaS*
* *Social & Communication*
* *VCs & Startups*



### 3.2. Zero-Friction Inline Editing

* **Mechanism:** Clicking any app card opens an instant lightweight edit modal or inline text box with zero login required.
* **Submission:** Users type an alternative "honest name" and hit **Submit**. Edits immediately update the live ticker and contribute to the candidate pool for upvoting.

### 3.3. Rate Limiting & Bot Protection

* **Per-IP Per-App Cooldown:** Users are restricted to **1 rename submission per app per IP every 24 hours** to prevent manipulation.
* **Global Rate Limiting:** Maximum 20 renames total across the site per IP per minute. (Revised from 5/min — that limit was too easy to hit legitimately, e.g. renaming one popular app repeatedly.)
* **Bot Defenses:**
* Honeypot input fields in submit modals.
* Server-side IP hashing before database lookup to protect privacy while blocking automated script spam.
* Cloudflare / Vercel Web Application Firewall (WAF) bot filtering enabled at the edge.



### 3.4. Upvoting & "Most Roasted" Engine

* **Upvoting:** Each app card displays an upvote counter for the current displayed label (rate-limited to 1 upvote per IP per app).
* **Alternative Names View:** Clicking an app card opens a drawer listing alternative crowd submissions ranked by votes, allowing users to upvote their favorite renames.

### 3.5. Real-Time Global Feed Ticker

* **Sidebar / Overlay Ticker:** Live stream displaying recent renames happening globally (e.g., *"Anxiety Red Dot was Slack — 2m ago"*).
* **Social Proof:** Keeps the site feeling active, alive, and community-driven.

### 3.6. 1-Click Social Share Engine

* **Auto-Crop Image Generator:** When a user submits an edit or views an app, a **"Share to X / LinkedIn"** button dynamically crops a clean PNG preview of that specific app card with its new name and site watermark.

---

## 4. Monetization Engine (Pay to Feature / Add Your Startup)

To keep engineering complexity minimal during launch, **RenameApps** delegates all submission, payment processing, and customer intake to an external **Tally form**.

### 4.1. Tiered Pricing Model

| Tier | Price | Features / Benefits |
| --- | --- | --- |
| **Standard Submission** | **Free** | Submitted via Tally form to moderation queue; added to standard category index once approved. |
| **Featured Spot** | **$29** (One-time) | Handled in Tally form via native payment block. Guaranteed **Top 20 Grid Placement** in chosen category for 7 days + Verified Badge. |
| **Main Page Takeover** | **$99** (One-time) | Handled in Tally form via native payment block. Guaranteed **First-Row Placement** on global home grid for 14 days + direct outbound link. |

### 4.2. User Intake Flow (Tally Integration)

1. User clicks **"+ Add / Feature Your App"** on the main navigation bar.
2. The site opens a dedicated **Tally Form** (`[https://tally.so/r/](https://tally.so/r/)...`) in a clean modal overlay or new tab.
3. The Tally form collects:
* Startup Name & Target URL
* Logo / Icon Upload
* Category Selection
* Chosen Placement Tier (Free / $29 / $99)
* Payment collection (collected directly via Tally's native payment integration)


4. Upon Tally form submission:
* **Webhook to Vercel Endpoint:** Tally triggers a webhook to a `POST /api/webhooks/tally` route on Vercel.
* **Database Insert:** The Next.js API route validates the payload and writes the new app entry directly into **Neon (Postgres)** database.



---

## 5. Technical Architecture & Data Model

### 5.1. Tech Stack

* **Frontend & API:** Next.js (App Router), Tailwind CSS, Framer Motion, HTML2Canvas / `@vercel/og` (for share images).
* **Hosting & Platform:** **Vercel** (Global Edge Deployment).
* **Database:** **Neon** (Serverless PostgreSQL connected via `@neondatabase/serverless`).
* **Form & Payment Intake:** **Tally.so** (External embedded form handling submission inputs and payments).
* **Rate Limiting:** Vercel Edge Middleware / Upstash Redis for IP tracking and request throttling.

### 5.2. Database Schema (Neon PostgreSQL)

```sql
-- Apps Directory
CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name VARCHAR(100) NOT NULL,
  icon_url TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  website_url TEXT,
  is_sponsored BOOLEAN DEFAULT FALSE,
  sponsor_tier VARCHAR(20) DEFAULT 'free',
  sponsor_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crowd Renames
CREATE TABLE renames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  honest_name VARCHAR(120) NOT NULL,
  upvotes INTEGER DEFAULT 1,
  ip_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- IP Rate Limits Tracker
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash VARCHAR(64) NOT NULL,
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  action_type VARCHAR(20) NOT NULL, -- 'rename' OR 'upvote'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast rate-limit lookups
CREATE INDEX idx_rate_limits_ip_app ON rate_limits (ip_hash, app_id, action_type);

```

---

## 6. Functional Requirements

| Req ID | Priority | Feature Description | Acceptance Criteria |
| --- | --- | --- | --- |
| **FR-01** | P0 | Launchpad App Grid | Renders responsive macOS Launchpad grid of apps pulled from Neon DB with active red-marker names. |
| **FR-02** | P0 | Search & Category Filter | Auto-filters app cards in real-time by original or honest name. |
| **FR-03** | P0 | Inline Edit & Rename | Simple modal to submit alternative names directly to Neon DB. |
| **FR-04** | P0 | Per-IP Per-App Rate Limiting | Edge middleware / DB check blocks user from renaming the same app twice within 24 hours. |
| **FR-05** | P0 | Bot / Anti-Spam Defenses | Includes honeypot inputs and server-side rate limits to prevent scripted spam attacks. |
| **FR-06** | P1 | Tally Form Integration | "+ Add / Feature App" button opens external Tally form link; webhook auto-populates Neon DB. |
| **FR-07** | P1 | Live Feed Sidebar | Realtime sidebar displays recent global edits with time ago markers. |
| **FR-08** | P1 | Social Image Export | Generates clean PNG cards suitable for Twitter/LinkedIn posts. |

---

## 7. Success Metrics & Key Performance Indicators (KPIs)

* **Viral Traffic:** >50,000 Unique Visitors in Launch Week on Vercel Analytics.
* **Engagement:** >20,000 Total Renames/Upvotes submitted without bot degradation.
* **Security Rate-Limit Efficiency:** 0 automated spam flooding incidents logged in Neon DB.
* **Monetization Revenue:** $1,000+ generated through Tally form paid startup submissions during the launch wave.
