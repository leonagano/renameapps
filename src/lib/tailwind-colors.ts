// Minimal subset of the default Tailwind palette, used to translate an
// `iconBg` gradient class (e.g. "from-purple-600 to-indigo-700") into hex
// stops for the @vercel/og share-card renderer, which can't read Tailwind CSS.
const PALETTE: Record<string, string> = {
  "red-500": "#ef4444", "red-600": "#dc2626", "red-700": "#b91c1c",
  "rose-500": "#f43f5e", "rose-600": "#e11d48", "rose-700": "#be123c", "rose-800": "#9f1239", "rose-900": "#881337",
  "orange-500": "#f97316", "orange-600": "#ea580c", "orange-700": "#c2410c",
  "amber-500": "#f59e0b", "amber-600": "#d97706", "amber-700": "#b45309",
  "yellow-500": "#eab308", "yellow-600": "#ca8a04",
  "purple-600": "#9333ea", "purple-700": "#7e22ce", "purple-800": "#6b21a8",
  "violet-600": "#7c3aed",
  "indigo-500": "#6366f1", "indigo-600": "#4f46e5", "indigo-700": "#4338ca", "indigo-800": "#3730a3", "indigo-900": "#312e81",
  "blue-500": "#3b82f6", "blue-600": "#2563eb", "blue-700": "#1d4ed8", "blue-800": "#1e40af", "blue-900": "#1e3a8a",
  "sky-500": "#0ea5e9", "sky-600": "#0284c7",
  "cyan-500": "#06b6d4", "cyan-600": "#0891b2", "cyan-700": "#0e7490",
  "teal-400": "#2dd4bf", "teal-600": "#0d9488", "teal-700": "#0f766e", "teal-800": "#115e59",
  "emerald-500": "#10b981", "emerald-600": "#059669", "emerald-700": "#047857",
  "green-600": "#16a34a", "green-900": "#14532d",
  "zinc-300": "#d4d4d8", "zinc-600": "#52525b", "zinc-800": "#27272a", "zinc-900": "#18181b", "zinc-950": "#09090b",
  "neutral-800": "#262626",
  "slate-800": "#1e293b", "slate-900": "#0f172a", "slate-950": "#020617",
  "gray-800": "#1f2937",
  "black": "#000000",
  "pink-500": "#ec4899",
};

export function gradientToHexStops(iconBg: string): { from: string; to: string } {
  const parts = iconBg.split(/\s+/);
  const fromToken = parts.find((p) => p.startsWith("from-"))?.replace("from-", "");
  const toToken = [...parts].reverse().find((p) => p.startsWith("to-"))?.replace("to-", "");
  return {
    from: (fromToken && PALETTE[fromToken]) || "#ef4444",
    to: (toToken && PALETTE[toToken]) || "#7c2d12",
  };
}
