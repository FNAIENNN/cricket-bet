// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers/session-provider";

export const metadata: Metadata = {
  title: "CricketBet — Toss Betting",
  description: "Bet on cricket toss outcomes. Fast, fair, and fun.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CricketBet",
  },
};

export const viewport: Viewport = {
  themeColor: "#052e16",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-gray-950 text-gray-100 min-h-screen">
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
