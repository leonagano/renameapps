export interface SeedApp {
  id: string;
  name: string;
  honestName: string;
  category: string;
  upvotes: number;
  iconBg: string;
  iconClass: string;
  websiteUrl?: string;
}

// Ported from rename_tech_honest_launchpad.html DEFAULT_APPS
export const SEED_APPS: SeedApp[] = [
  { id: "slack", name: "Slack", honestName: "Anxiety Red Dot", category: "Productivity", upvotes: 1842, iconBg: "from-purple-600 to-indigo-700", iconClass: "fa-brands fa-slack" },
  { id: "openai", name: "OpenAI", honestName: "Sam's Hype Factory", category: "AI & LLMs", upvotes: 2410, iconBg: "from-emerald-500 to-teal-700", iconClass: "fa-solid fa-brain" },
  { id: "anthropic", name: "Anthropic", honestName: "Safety Meeting Generator", category: "AI & LLMs", upvotes: 1290, iconBg: "from-amber-600 to-orange-700", iconClass: "fa-solid fa-robot" },
  { id: "zoom", name: "Zoom", honestName: "Are You On Mute?", category: "Productivity", upvotes: 1650, iconBg: "from-blue-500 to-cyan-600", iconClass: "fa-solid fa-video" },
  { id: "linkedin", name: "LinkedIn", honestName: "Humblebrag Hub", category: "Social", upvotes: 3105, iconBg: "from-blue-700 to-indigo-900", iconClass: "fa-brands fa-linkedin-in" },
  { id: "notion", name: "Notion", honestName: "Over-Engineered To-Do", category: "Productivity", upvotes: 1420, iconBg: "from-neutral-800 to-zinc-950", iconClass: "fa-solid fa-note-sticky" },
  { id: "vscode", name: "VS Code", honestName: "RAM Eater 3000", category: "DevTools", upvotes: 1980, iconBg: "from-sky-500 to-blue-700", iconClass: "fa-solid fa-code" },
  { id: "spotify", name: "Spotify", honestName: "Code Core + Cry", category: "Social", upvotes: 1210, iconBg: "from-emerald-500 to-green-600", iconClass: "fa-brands fa-spotify" },
  { id: "aws", name: "AWS", honestName: "Surprise $5,000 Bill", category: "Cloud & Infra", upvotes: 2890, iconBg: "from-amber-500 to-yellow-600", iconClass: "fa-brands fa-aws" },
  { id: "github", name: "GitHub", honestName: "Merge Conflict Arena", category: "DevTools", upvotes: 2150, iconBg: "from-gray-800 to-black", iconClass: "fa-brands fa-github" },
  { id: "stripe", name: "Stripe", honestName: "3% Cut of My Dreams", category: "Enterprise", upvotes: 1760, iconBg: "from-violet-600 to-purple-800", iconClass: "fa-brands fa-stripe" },
  { id: "vercel", name: "Vercel", honestName: "Next.js Propaganda", category: "Cloud & Infra", upvotes: 1540, iconBg: "from-black to-zinc-800", iconClass: "fa-solid fa-triangle-exclamation" },
  { id: "figma", name: "Figma", honestName: "10 People Watching You Move A Pixel", category: "Productivity", upvotes: 1890, iconBg: "from-rose-500 to-purple-600", iconClass: "fa-brands fa-figma" },
  { id: "discord", name: "Discord", honestName: "Unmoderated Chaos Lounge", category: "Social", upvotes: 1670, iconBg: "from-indigo-500 to-blue-600", iconClass: "fa-brands fa-discord" },
  { id: "twitter", name: "X / Twitter", honestName: "Dunning-Kruger Arena", category: "Social", upvotes: 3420, iconBg: "from-zinc-900 to-black", iconClass: "fa-brands fa-x-twitter" },
  { id: "reddit", name: "Reddit", honestName: "Thread Closed 11 yrs Ago", category: "Social", upvotes: 2010, iconBg: "from-orange-600 to-red-600", iconClass: "fa-brands fa-reddit-alien" },
  { id: "supabase", name: "Supabase", honestName: "Firebase with SQL Propaganda", category: "DevTools", upvotes: 980, iconBg: "from-emerald-600 to-teal-800", iconClass: "fa-solid fa-database" },
  { id: "datadog", name: "Datadog", honestName: "More Expensive Than Cloud", category: "Cloud & Infra", upvotes: 1830, iconBg: "from-purple-700 to-indigo-900", iconClass: "fa-solid fa-dog" },
  { id: "linear", name: "Linear", honestName: "Shortcuts Nobody Remembers", category: "Productivity", upvotes: 1120, iconBg: "from-indigo-600 to-slate-900", iconClass: "fa-solid fa-bars-staggered" },
  { id: "postman", name: "Postman", honestName: "Overcomplicated Curl", category: "DevTools", upvotes: 890, iconBg: "from-orange-500 to-amber-600", iconClass: "fa-solid fa-paper-plane" },
  { id: "docker", name: "Docker", honestName: "It Works On My Machine", category: "DevTools", upvotes: 2310, iconBg: "from-sky-600 to-blue-800", iconClass: "fa-brands fa-docker" },
  { id: "chatgpt", name: "ChatGPT", honestName: "My Real Senior Engineer", category: "AI & LLMs", upvotes: 3890, iconBg: "from-teal-600 to-emerald-800", iconClass: "fa-solid fa-comments" },
  { id: "midjourney", name: "Midjourney", honestName: "7 Fingers Generator", category: "AI & LLMs", upvotes: 1450, iconBg: "from-blue-900 to-slate-950", iconClass: "fa-solid fa-wand-magic-sparkles" },
  { id: "uber", name: "Uber", honestName: "Taxi With 500% Surge", category: "Enterprise", upvotes: 1340, iconBg: "from-black to-zinc-900", iconClass: "fa-solid fa-car" },
  { id: "salesforce", name: "Salesforce", honestName: "1998 Database in 2026", category: "Enterprise", upvotes: 2210, iconBg: "from-sky-500 to-blue-700", iconClass: "fa-solid fa-cloud" },
  { id: "yc", name: "Y Combinator", honestName: "SaaS Wrapper Factory", category: "VCs & Startups", upvotes: 2750, iconBg: "from-orange-500 to-amber-600", iconClass: "fa-solid fa-hand-holding-dollar" },
  { id: "netflix", name: "Netflix", honestName: "30 Min Scroll, 5 Min Sleep", category: "Social", upvotes: 1620, iconBg: "from-red-700 to-rose-900", iconClass: "fa-solid fa-film" },
  { id: "tesla", name: "Tesla", honestName: "FSD (For Real This Year)", category: "Enterprise", upvotes: 1980, iconBg: "from-red-600 to-zinc-900", iconClass: "fa-solid fa-bolt" },
  { id: "apple", name: "Apple", honestName: "$1,200 Stand Sold Separately", category: "Enterprise", upvotes: 3120, iconBg: "from-zinc-300 to-zinc-600", iconClass: "fa-brands fa-apple" },
  { id: "google", name: "Google", honestName: "Killed Product Graveyard", category: "Enterprise", upvotes: 2940, iconBg: "from-blue-500 via-red-500 to-yellow-500", iconClass: "fa-brands fa-google" },
  { id: "microsoft", name: "Microsoft", honestName: "Forced Reboot At 4PM", category: "Enterprise", upvotes: 2510, iconBg: "from-blue-600 to-teal-600", iconClass: "fa-brands fa-microsoft" },
  { id: "meta", name: "Meta", honestName: "Eavesdropping On Your Dinner", category: "Social", upvotes: 2680, iconBg: "from-blue-600 to-indigo-800", iconClass: "fa-brands fa-meta" },
  { id: "stackoverflow", name: "Stack Overflow", honestName: "Closed as Duplicate", category: "DevTools", upvotes: 3510, iconBg: "from-amber-600 to-orange-700", iconClass: "fa-brands fa-stack-overflow" },
  { id: "cloudflare", name: "Cloudflare", honestName: "502 Gateway Saver", category: "Cloud & Infra", upvotes: 1420, iconBg: "from-orange-500 to-amber-600", iconClass: "fa-solid fa-shield-halved" },
  { id: "jira", name: "Jira", honestName: "Agile Suffering Tracker", category: "Productivity", upvotes: 3890, iconBg: "from-blue-600 to-indigo-800", iconClass: "fa-solid fa-list-check" },
  { id: "mongodb", name: "MongoDB", honestName: "Web Scale (Lost My Data)", category: "DevTools", upvotes: 1150, iconBg: "from-emerald-700 to-green-900", iconClass: "fa-solid fa-leaf" },
  { id: "kubernetes", name: "Kubernetes", honestName: "PhD Required for Nginx", category: "Cloud & Infra", upvotes: 2640, iconBg: "from-blue-600 to-cyan-700", iconClass: "fa-solid fa-dharmachakra" },
  { id: "twilio", name: "Twilio", honestName: "2FA Text Sender", category: "Enterprise", upvotes: 780, iconBg: "from-red-600 to-rose-800", iconClass: "fa-solid fa-comment-sms" },
  { id: "producthunt", name: "Product Hunt", honestName: "Wrapper App Upvote Ring", category: "VCs & Startups", upvotes: 2190, iconBg: "from-orange-600 to-rose-600", iconClass: "fa-solid fa-rocket" },
  { id: "hackernews", name: "Hacker News", honestName: "Built This in C in 3 Hours", category: "VCs & Startups", upvotes: 2840, iconBg: "from-orange-500 to-amber-600", iconClass: "fa-brands fa-y-combinator" },
  { id: "substack", name: "Substack", honestName: "Unread Newsletter Box", category: "Social", upvotes: 940, iconBg: "from-orange-500 to-amber-600", iconClass: "fa-solid fa-newspaper" },
  { id: "canva", name: "Canva", honestName: "Photoshop for Marketers", category: "Productivity", upvotes: 1250, iconBg: "from-cyan-500 to-blue-600", iconClass: "fa-solid fa-palette" },
  { id: "tiktok", name: "TikTok", honestName: "Dopamine Shredder", category: "Social", upvotes: 3210, iconBg: "from-teal-400 via-pink-500 to-black", iconClass: "fa-brands fa-tiktok" },
  { id: "instagram", name: "Instagram", honestName: "Fake Vacation Photos", category: "Social", upvotes: 2790, iconBg: "from-amber-500 via-rose-500 to-purple-600", iconClass: "fa-brands fa-instagram" },
  { id: "sentry", name: "Sentry", honestName: "10,000 Unhandled Exceptions", category: "DevTools", upvotes: 1090, iconBg: "from-purple-800 to-slate-900", iconClass: "fa-solid fa-bug" },
  { id: "heroku", name: "Heroku", honestName: "RIP Free Tier", category: "Cloud & Infra", upvotes: 2040, iconBg: "from-purple-600 to-indigo-800", iconClass: "fa-solid fa-cubes" },
  { id: "redis", name: "Redis", honestName: "Cache Everything & Pray", category: "DevTools", upvotes: 1380, iconBg: "from-red-600 to-rose-800", iconClass: "fa-solid fa-bolt-lightning" },
  { id: "postgresql", name: "PostgreSQL", honestName: "Old Reliable Elephant", category: "DevTools", upvotes: 2450, iconBg: "from-blue-700 to-slate-800", iconClass: "fa-solid fa-elephant" },
  { id: "raycast", name: "Raycast", honestName: "Spotlight on Steroids", category: "Productivity", upvotes: 1560, iconBg: "from-red-500 to-orange-600", iconClass: "fa-solid fa-terminal" },
  { id: "cursor", name: "Cursor", honestName: "Vibe Coding Engine", category: "DevTools", upvotes: 3120, iconBg: "from-indigo-600 to-purple-800", iconClass: "fa-solid fa-i-cursor" },
  { id: "medium", name: "Medium", honestName: "Paywall After 3 Lines", category: "Social", upvotes: 1140, iconBg: "from-black to-zinc-800", iconClass: "fa-brands fa-medium" },
  { id: "asana", name: "Asana", honestName: "Unfinished Gantt Chart", category: "Productivity", upvotes: 890, iconBg: "from-rose-500 to-pink-600", iconClass: "fa-solid fa-circle-nodes" },
];
