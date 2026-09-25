"use client";

import type { FeedItem } from "@/lib/types";

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function FeedPanel({
  feed,
  open,
  onClose,
  onSelect,
}: {
  feed: FeedItem[];
  open: boolean;
  onClose: () => void;
  onSelect: (appId: string) => void;
}) {
  return (
    <aside
      id="feedPanel"
      className={`w-80 glass-dark border-l border-white/10 flex-col h-full transition-all duration-300 z-30 shadow-2xl relative shrink-0 ${
        open ? "flex" : "hidden"
      }`}
    >
      <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <h2 className="font-bold text-sm tracking-wide">Recently Renamed</h2>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white transition text-xs p-1">
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div className="bg-black/20 px-4 py-2 border-b border-white/5 flex items-center justify-between text-[11px] text-white/60">
        <span>Live Crowd Stream</span>
        <span className="text-emerald-400 font-mono">● LIVE UPDATES</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {feed.map((item) => (
          <div
            key={item.renameId}
            onClick={() => onSelect(item.appId)}
            className="bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/10 transition cursor-pointer group active:scale-98"
          >
            <div className="font-marker text-red-300 text-sm leading-snug group-hover:underline">
              &quot;{item.honestName}&quot;
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/50 mt-1">
              <span>
                was <strong className="text-white/80 font-semibold">{item.appName}</strong>
              </span>
              <span className="text-white/40">{timeAgo(item.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-black/30 border-t border-white/10 text-center text-[11px] text-white/50 space-y-1">
        <div>Sarcasm provided by users worldwide 🌍</div>
        <div>
          Created by{" "}
          <a
            href="https://x.com/leonagano"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/80 hover:text-red-400 transition"
          >
            Leo
          </a>
        </div>
      </div>
    </aside>
  );
}
