import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RenameApps — Honest Names for Tech, Crowdsourced",
  description:
    "A crowdsourced, tongue-in-cheek satire platform where users give honest names to popular apps, tech tools, and startups.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- root layout applies site-wide, not a single page */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Permanent+Marker&family=Kalam:wght@700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className="macos-bg font-mac text-white h-screen flex flex-col overflow-hidden selection:bg-red-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
