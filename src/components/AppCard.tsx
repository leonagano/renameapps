"use client";

import type { AppWithHonestName } from "@/lib/types";

export default function AppCard({
  app,
  onOpen,
  onUpvote,
}: {
  app: AppWithHonestName;
  onOpen: (appId: string) => void;
  onUpvote: (appId: string, renameId: string) => void;
}) {
  return (
    <div
      id={`app-card-${app.id}`}
      className="app-card glass-card rounded-2xl p-1.5 flex flex-col items-center justify-between text-center relative group cursor-pointer select-none transition-all duration-200"
      onClick={() => onOpen(app.id)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (app.honestNameId) onUpvote(app.id, app.honestNameId);
        }}
        disabled={app.hasUpvoted}
        className={`absolute top-2 right-2 opacity-80 group-hover:opacity-100 bg-black/40 hover:bg-black/60 px-2 py-0.5 rounded-full text-[10px] flex items-center space-x-1 border border-white/10 transition z-10 ${
          app.hasUpvoted
            ? "text-amber-400 font-bold border-amber-400/40 bg-amber-500/20"
            : "text-white/70"
        }`}
        title={app.hasUpvoted ? "Already upvoted" : "Upvote Roast"}
      >
        <i
          className={`fa-solid fa-fire text-[10px] ${
            app.hasUpvoted ? "text-amber-400 animate-bounce" : "text-white/50"
          }`}
        ></i>
        <span>{app.upvotes || 0}</span>
      </button>

      {app.isSponsored && (
        <div className="absolute top-2 left-2 bg-emerald-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
          <i className="fa-solid fa-star mr-1"></i>Featured
        </div>
      )}
      {!app.isSponsored && (
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 bg-red-500/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md transition duration-150">
          <i className="fa-solid fa-pencil mr-1"></i>Edit
        </div>
      )}

      <div className="mt-0.5 mb-1">
        <div
          className={`app-icon w-14 h-14 sm:w-[4.5rem] sm:h-[4.5rem] bg-gradient-to-br ${app.iconBg} flex items-center justify-center text-white text-4xl sm:text-5xl font-extrabold shadow-lg relative overflow-hidden border border-white/20`}
        >
          <i className={`${app.iconClass} drop-shadow-md`}></i>
        </div>
      </div>

      <div className="w-full flex-1 flex flex-col justify-center">
        <div className="font-marker text-red-400 text-xs sm:text-sm leading-tight mb-0.5 line-clamp-2 hover:underline marker-text">
          &quot;{app.honestName}&quot;
        </div>
        <div className="text-[11px] text-white/50 font-medium tracking-tight">
          was <span className="text-white/80">{app.name}</span>
        </div>
        {app.renameCount > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(app.id);
            }}
            className="text-[10px] text-amber-400/90 hover:text-amber-300 transition mt-0.5"
          >
            <i className="fa-solid fa-fire text-[9px] mr-1"></i>
            {app.renameCount} alternatives
          </button>
        )}
      </div>
    </div>
  );
}
