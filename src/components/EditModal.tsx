"use client";

import { useState } from "react";
import type { AppWithHonestName, RenameRecord } from "@/lib/types";
import { gradientToHexStops } from "@/lib/tailwind-colors";
import { HONEYPOT_FIELD } from "@/lib/honeypot";

export default function EditModal({
  app,
  alternatives,
  onClose,
  onSubmit,
  onUpvote,
}: {
  app: AppWithHonestName | null;
  alternatives: RenameRecord[];
  onClose: () => void;
  onSubmit: (honestName: string, honeypot: string) => Promise<void>;
  onUpvote: (renameId: string) => void;
}) {
  const [value, setValue] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!app) return null;

  const { from, to } = gradientToHexStops(app.iconBg);
  const ogUrl = `/api/og?name=${encodeURIComponent(app.name)}&honest=${encodeURIComponent(
    app.honestName
  )}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  const shareText = `"${app.honestName}" — was ${app.name}. Rename tech honestly on RenameApps.`;

  async function handleSubmit() {
    if (!value.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(value.trim(), honeypot);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-dark border border-white/20 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-white/10 px-4 py-3 flex items-center justify-between border-b border-white/10 select-none shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition flex items-center justify-center text-[8px] text-black/60 font-bold"
            >
              ✕
            </button>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-xs font-semibold text-white/80">Rename {app.name}</span>
          <div className="w-12"></div>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="flex items-center space-x-4 mb-6 bg-white/5 p-3 rounded-xl border border-white/10">
            <div
              className={`w-14 h-14 rounded-[22%] bg-gradient-to-br ${app.iconBg} flex items-center justify-center text-4xl font-bold text-white shadow-lg shrink-0 border border-white/20`}
            >
              <i className={app.iconClass}></i>
            </div>
            <div>
              <div className="text-xs text-white/50 uppercase tracking-wider">Original Name</div>
              <div className="text-lg font-bold text-white">{app.name}</div>
              <div className="text-xs text-emerald-400 mt-0.5">{app.category}</div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-white/70 mb-1">
              Current Community Honest Name
            </label>
            <div className="font-marker text-red-400 text-lg bg-black/40 px-3 py-2 rounded-lg border border-red-500/30">
              &quot;{app.honestName}&quot;
            </div>
          </div>

          {alternatives.length > 1 && (
            <div className="mb-6">
              <label className="block text-xs font-medium text-white/70 mb-1">
                All Submissions ({alternatives.length})
              </label>
              <p className="text-[11px] text-white/40 mb-2">
                <i className="fa-solid fa-fire text-red-400 mr-1"></i>
                Hit the fire icon to upvote your favorite
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {alternatives.map((alt) => (
                  <div
                    key={alt.id}
                    className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg border border-white/10"
                  >
                    <span className="font-marker text-red-300 text-sm truncate mr-2">
                      &quot;{alt.honestName}&quot;
                    </span>
                    <button
                      onClick={() => onUpvote(alt.id)}
                      disabled={app.hasUpvoted}
                      className="shrink-0 flex items-center space-x-1 text-[11px] text-white/70 hover:text-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <i className="fa-solid fa-fire text-[10px]"></i>
                      <span>{alt.upvotes}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="honestInput" className="block text-xs font-medium text-white/90 mb-1">
              Your Honest Name <span className="text-red-400">*</span>
            </label>
            <input
              id="honestInput"
              type="text"
              maxLength={40}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. Merge Conflict Simulator"
              className="w-full bg-black/50 border border-white/20 focus:border-red-400 rounded-xl px-3.5 py-2.5 text-white font-marker text-base outline-none transition placeholder-white/30"
              onKeyUp={(e) => e.key === "Enter" && handleSubmit()}
            />
            <input
              type="text"
              name={HONEYPOT_FIELD}
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              className="absolute -left-[9999px] w-px h-px opacity-0"
              aria-hidden="true"
            />
            <div className="flex justify-between text-[11px] text-white/40 mt-1">
              <span>Keep it funny, short &amp; cheeky!</span>
              <span>{value.length}/40</span>
            </div>
            <p className="text-[11px] text-white/40 mt-2">
              <i className="fa-solid fa-fire text-red-400 mr-1"></i>
              Your submission joins the pool — it only becomes this app&apos;s displayed name once
              it has more upvotes than the current one.
            </p>
          </div>

          <div className="flex items-center space-x-3 mb-4">
            <button
              onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/15 text-white text-xs font-medium py-2.5 rounded-xl border border-white/10 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !value.trim()}
              className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center space-x-1"
            >
              <i className="fa-solid fa-check text-xs"></i>
              <span>{submitting ? "Publishing..." : "Publish Rename"}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 border-t border-white/10 pt-4">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-black hover:bg-zinc-800 text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center space-x-1.5 transition"
            >
              <i className="fa-brands fa-x-twitter"></i>
              <span>Share</span>
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                typeof window !== "undefined" ? window.location.origin : ""
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center space-x-1.5 transition"
            >
              <i className="fa-brands fa-linkedin-in"></i>
              <span>Share</span>
            </a>
            <a
              href={ogUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Preview share image"
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center transition"
            >
              <i className="fa-solid fa-image"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
