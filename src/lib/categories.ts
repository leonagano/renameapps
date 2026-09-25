export const CATEGORIES = [
  "All",
  "AI & LLMs",
  "DevTools",
  "Cloud & Infra",
  "Social",
  "Productivity",
  "Enterprise",
  "VCs & Startups",
] as const;

export type Category = (typeof CATEGORIES)[number];
