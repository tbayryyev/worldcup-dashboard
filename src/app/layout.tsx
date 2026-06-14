import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://worldcup-dashboard.mrtahyr.workers.dev";
const DESCRIPTION =
  "Live scores, standings, fixtures, match detail, team profiles and stats for the FIFA World Cup 2026 — updated in real time.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "World Cup 2026 — Live Dashboard",
    template: "%s — World Cup 2026",
  },
  description: DESCRIPTION,
  applicationName: "World Cup 2026 Dashboard",
  keywords: [
    "World Cup 2026",
    "live scores",
    "standings",
    "fixtures",
    "top scorers",
    "football",
    "soccer",
  ],
  openGraph: {
    type: "website",
    siteName: "World Cup 2026 Dashboard",
    title: "World Cup 2026 — Live Dashboard",
    description: DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/og.svg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "World Cup 2026 — Live Dashboard",
    description: DESCRIPTION,
    images: ["/og.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
