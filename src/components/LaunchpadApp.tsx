"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import type { AppWithHonestName, FeedItem, RenameRecord } from "@/lib/types";
import AppCard from "@/components/AppCard";
import FeedPanel from "@/components/FeedPanel";
import EditModal from "@/components/EditModal";
import OnboardingModal from "@/components/OnboardingModal";
import Toasts, { type Toast } from "@/components/Toasts";

const ITEMS_PER_PAGE = 24;
const ONBOARDING_STORAGE_KEY = "renameapps_onboarded";
const TALLY_FORM_URL = "https://tally.so/r/VLgvKE";
type SortMode = "popular" | "alphabetical" | "recent";

export default function LaunchpadApp({
  initialApps,
  initialFeed,
}: {
  initialApps: AppWithHonestName[];
  initialFeed: FeedItem[];
}) {
  const [apps, setApps] = useState(initialApps);
  const [feed, setFeed] = useState(initialFeed);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("popular");
  const [page, setPage] = useState(1);
  const [feedPanelOpen, setFeedPanelOpen] = useState(true);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<RenameRecord[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const toastIdRef = useRef(0);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // localStorage isn't available during SSR, so this has to run post-mount
    // rather than as a lazy useState initializer.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!localStorage.getItem(ONBOARDING_STORAGE_KEY)) setOnboardingOpen(true);
    } catch {
      // Private browsing / blocked storage: just skip onboarding persistence.
    }
  }, []);

  function closeOnboarding() {
    setOnboardingOpen(false);
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
    } catch {
      // Nothing to persist to; it'll just show again next visit.
    }
  }

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apps
      .filter((app) => {
        const matchesCategory = category === "All" || app.category === category;
        const matchesSearch =
          q === "" ||
          app.name.toLowerCase().includes(q) ||
          app.honestName.toLowerCase().includes(q) ||
          app.category.toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sort === "popular") return b.upvotes - a.upvotes;
        if (sort === "alphabetical") return a.name.localeCompare(b.name);
        if (sort === "recent") {
          return (
            new Date(b.lastRenamedAt ?? 0).getTime() - new Date(a.lastRenamedAt ?? 0).getTime()
          );
        }
        return 0;
      });
  }, [apps, category, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredApps.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageApps = filteredApps.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  function goToPage(p: number) {
    setPage(p);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setCategoryAndReset(cat: string) {
    setCategory(cat);
    setPage(1);
  }

  async function openEditModal(appId: string) {
    setEditingAppId(appId);
    setAlternatives([]);
    try {
      const res = await fetch(`/api/apps/${appId}/renames`);
      const data = await res.json();
      setAlternatives(data.alternatives ?? []);
    } catch {
      // Alternatives are supplementary; the modal still works without them.
    }
  }

  async function submitRename(honestName: string, honeypot: string) {
    if (!editingAppId) return;
    const res = await fetch(`/api/apps/${editingAppId}/renames`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ honestName, company_website: honeypot }),
    });
    const data = await res.json();

    if (!data.ok) {
      showToast(data.message ?? "Couldn't publish that rename.", "error");
      return;
    }

    const app = apps.find((a) => a.id === editingAppId);
    setFeed((prev) => [
      {
        renameId: data.rename.id,
        appId: editingAppId,
        appName: app?.name ?? "",
        honestName: data.rename.honestName,
        createdAt: data.rename.createdAt,
      },
      ...prev,
    ]);
    showToast(`🎉 Submitted "${data.rename.honestName}" for ${app?.name}!`);
    setEditingAppId(null);
    await refreshApps();
  }

  async function refreshApps() {
    try {
      const res = await fetch("/api/apps");
      const data = await res.json();
      if (Array.isArray(data.apps)) setApps(data.apps);
    } catch {
      // Keep showing stale state; the next poll/action will resync.
    }
  }

  async function toggleUpvote(appId: string, renameId: string) {
    const res = await fetch(`/api/renames/${renameId}/upvote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId }),
    });
    const data = await res.json();

    if (!data.ok) {
      showToast(data.message ?? "Couldn't upvote.", "error");
      return;
    }

    setAlternatives((prev) =>
      prev.map((r) => (r.id === renameId ? { ...r, upvotes: data.upvotes } : r))
    );
    showToast("🔥 Upvoted!");
    await refreshApps();
  }

  function highlightAppCard(appId: string) {
    const index = filteredApps.findIndex((a) => a.id === appId);
    const targetPage = index === -1 ? 1 : Math.floor(index / ITEMS_PER_PAGE) + 1;
    if (targetPage !== currentPage) setPage(targetPage);

    setTimeout(() => {
      const card = document.getElementById(`app-card-${appId}`);
      card?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightId(appId);
      setTimeout(() => setHighlightId(null), 3000);
    }, 150);
  }

  // Poll the live feed so remote renames from other visitors show up.
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/feed?limit=25");
        const data = await res.json();
        if (Array.isArray(data.feed)) setFeed(data.feed);
      } catch {
        // Best-effort; the feed just won't update this tick.
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const editingApp = apps.find((a) => a.id === editingAppId) ?? null;

  return (
    <>
      <header className="glass-dark sticky top-0 z-40 w-full px-4 py-2 flex items-center justify-between text-xs sm:text-sm font-medium border-b border-white/10 shadow-lg select-none">
        <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar py-0.5">
          <div
            className="flex items-center space-x-2 mr-2 cursor-pointer"
            onClick={() => {
              setCategoryAndReset("All");
              setSearch("");
            }}
          >
            <i className="fa-brands fa-apple text-base text-white/90 hover:text-white transition"></i>
            <span className="font-bold tracking-tight text-white flex items-center gap-1.5">
              RenameApps
              <span className="text-[10px] bg-red-500/80 text-white font-semibold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                v1.0
              </span>
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryAndReset(cat)}
                className={`px-2.5 py-1 rounded-lg border text-xs whitespace-nowrap transition active:scale-95 ${
                  cat === category
                    ? "bg-red-500/80 text-white font-semibold shadow-md border-red-400/50"
                    : "bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border-white/10"
                }`}
              >
                {cat === "All" && <i className="fa-solid fa-grid-2 mr-1"></i>}
                {cat}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-white/50 text-xs"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={`Search ${apps.length}+ apps...`}
              className="bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder-white/50 text-xs rounded-lg pl-8 pr-3 py-1.5 outline-none border border-white/10 focus:border-red-400/80 transition w-36 sm:w-56"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          <button
            onClick={() => setOnboardingOpen(true)}
            title="How it works"
            className="bg-white/10 hover:bg-white/20 text-white/80 hover:text-white p-1.5 rounded-lg border border-white/10 transition active:scale-95"
          >
            <i className="fa-solid fa-circle-question text-xs"></i>
          </button>

          <a
            href={TALLY_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-md hover:shadow-lg transition flex items-center space-x-1.5 active:scale-95"
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
            <span className="hidden sm:inline">Add Your App</span>
          </a>

          <button
            onClick={() => setFeedPanelOpen((v) => !v)}
            title="Toggle Activity Feed"
            className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-lg border border-white/10 transition relative active:scale-95"
          >
            <i className="fa-solid fa-bolt text-xs text-yellow-300"></i>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </header>

      <div className="md:hidden glass-dark border-b border-white/10 px-3 py-2 flex items-center space-x-1.5 overflow-x-auto no-scrollbar text-xs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryAndReset(cat)}
            className={`px-2.5 py-1 rounded-lg border text-xs whitespace-nowrap transition active:scale-95 ${
              cat === category
                ? "bg-red-500/80 text-white font-semibold shadow-md border-red-400/50"
                : "bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border-white/10"
            }`}
          >
            {cat === "All" && <i className="fa-solid fa-grid-2 mr-1"></i>}
            {cat}
          </button>
        ))}
      </div>

      <main className="flex-1 relative flex overflow-hidden">
        <div
          ref={gridRef}
          className="flex-1 overflow-hidden px-4 sm:px-8 py-3 flex flex-col justify-between"
        >
          <div>
            <div className="max-w-7xl mx-auto mb-2 flex justify-end">
              <div className="flex items-center space-x-1.5 text-xs bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-white/60">Sort:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortMode)}
                  className="bg-transparent text-white text-xs outline-none"
                >
                  <option value="popular" className="bg-slate-900">
                    Most Roasted 🔥
                  </option>
                  <option value="alphabetical" className="bg-slate-900">
                    Name (A-Z)
                  </option>
                  <option value="recent" className="bg-slate-900">
                    Recently Renamed
                  </option>
                </select>
              </div>
            </div>

            {pageApps.length > 0 ? (
              <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-2 sm:gap-x-3 gap-y-4 sm:gap-y-5">
                {pageApps.map((app) => (
                  <div key={app.id} className={highlightId === app.id ? "highlight-pulse rounded-2xl" : ""}>
                    <AppCard app={app} onOpen={openEditModal} onUpvote={toggleUpvote} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl mb-3 text-white/60">
                  <i className="fa-solid fa-ghost"></i>
                </div>
                <h3 className="text-lg font-bold">No tech companies found</h3>
                <p className="text-xs text-white/60 max-w-sm mt-1">
                  Try tweaking your search term or add this missing company to the board!
                </p>
                <a
                  href={TALLY_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                >
                  Add This Company
                </a>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="max-w-7xl mx-auto w-full py-2 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    title={`Page ${p}`}
                    className={`h-2.5 rounded-full transition-all duration-200 ${
                      p === currentPage ? "w-8 bg-red-500 shadow-md" : "w-2.5 bg-white/30 hover:bg-white/60"
                    }`}
                  ></button>
                ))}
              </div>
            </div>
          )}
        </div>

        <FeedPanel
          feed={feed}
          open={feedPanelOpen}
          onClose={() => setFeedPanelOpen(false)}
          onSelect={highlightAppCard}
        />
      </main>

      <EditModal
        key={editingApp?.id ?? "none"}
        app={editingApp}
        alternatives={alternatives}
        onClose={() => setEditingAppId(null)}
        onSubmit={submitRename}
        onUpvote={(renameId) => editingAppId && toggleUpvote(editingAppId, renameId)}
      />

      <OnboardingModal open={onboardingOpen} onClose={closeOnboarding} />

      <Toasts toasts={toasts} />
    </>
  );
}
