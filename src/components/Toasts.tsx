"use client";

export interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

export default function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`glass-dark border px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium flex items-center space-x-2 pointer-events-auto transition-all duration-300 ${
            toast.type === "error"
              ? "bg-red-900/90 border-red-500 text-red-200"
              : "bg-slate-900/90 border-emerald-500/50 text-white"
          }`}
        >
          <i
            className={
              toast.type === "error"
                ? "fa-solid fa-circle-exclamation text-red-400"
                : "fa-solid fa-circle-check text-emerald-400"
            }
          ></i>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
