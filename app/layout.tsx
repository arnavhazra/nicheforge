import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NicheForge — Multi-Vertical Voice & CRM Cockpit",
  description:
    "Instant multi-vertical closing demos and a one-click fulfillment compiler for AI agencies. Voice, dead-lead reactivation, AEO, and a margin-safe client pack.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${serif.variable} ${mono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
