import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Opensport — Open framework for sports data, odds & agent execution",
    template: "%s · Opensport",
  },
  description:
    "Provider-agnostic, agent-friendly open-source framework for querying sports events, reading odds from any bookmaker, and placing positions via a simulator or live exchange.",
  openGraph: {
    title: "Opensport",
    description: "Open framework for sports data, odds & agent-driven position management.",
    url: "https://opensport.dev",
    siteName: "Opensport",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Opensport",
    description: "Open framework for sports data, odds & agent-driven position management.",
  },
  metadataBase: new URL("https://opensport.dev"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-white text-stone-900 antialiased">
        <Nav />
        <main className="pt-14">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
