import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicProof X",
  description: "Privacy-preserving proof-of-humanity and one-person-one-vote MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <nav className="actions" style={{ marginBottom: "1rem" }}>
            <Link className="button secondary" href="/">Home</Link>
            <Link className="button secondary" href="/register">Register</Link>
            <Link className="button secondary" href="/verify-phone">Verify Phone</Link>
            <Link className="button secondary" href="/identity">Identity</Link>
            <Link className="button secondary" href="/vote">Vote</Link>
            <Link className="button secondary" href="/dashboard">Dashboard</Link>
          </nav>
          {children}
        </main>
      </body>
    </html>
  );
}
