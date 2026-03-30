import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteChrome } from "@/components/SiteChrome";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "CivicProof X",
  description: "Blockchain voting platform demo"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
