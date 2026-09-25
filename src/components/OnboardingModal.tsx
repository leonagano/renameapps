"use client";

export default function OnboardingModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="glass-dark border border-white/20 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-white/10 px-4 py-3 flex items-center justify-between border-b border-white/10 select-none">
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
          <span className="text-xs font-semibold text-white/80">Welcome to RenameApps</span>
          <div className="w-12"></div>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white shadow-lg text-xl shrink-0">
              <i className="fa-solid fa-pen-nib"></i>
            </div>
            <p className="text-sm text-white/80 leading-snug">
              Tech, but named honestly. Here&apos;s how it works:
            </p>
          </div>

          <ul className="space-y-3 mb-6">
            {[
              {
                icon: "fa-solid fa-table-cells",
                text: "Browse the grid — every app already has a crowd-voted honest name.",
              },
              {
                icon: "fa-solid fa-pencil",
                text: "Click any app to submit your own honest rename. No login needed.",
              },
              {
                icon: "fa-solid fa-fire",
                text: "Upvote the funniest submissions — the top-voted one wins the card.",
              },
              {
                icon: "fa-solid fa-bolt",
                text: "Watch renames roll in live from everyone else in the feed sidebar.",
              },
              {
                icon: "fa-solid fa-plus",
                text: "Missing a company? Add or feature it from the top bar.",
              },
            ].map((item) => (
              <li key={item.text} className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-red-400 text-xs shrink-0 mt-0.5">
                  <i className={item.icon}></i>
                </div>
                <span className="text-xs text-white/70 leading-relaxed">{item.text}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-lg transition active:scale-95"
          >
            Let&apos;s roast some tech 🔥
          </button>
        </div>
      </div>
    </div>
  );
}
