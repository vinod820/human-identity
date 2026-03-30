"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BackgroundScene } from "@/components/BackgroundScene";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/wallet", label: "Wallet" },
    { href: "/voting", label: "Voting" },
    { href: "/auth", label: "Auth" }
  ];

  return (
    <div className="app">
      <BackgroundScene />

      <header className="header">
        <div className="header-content">
          <Link className="logo" href="/">CivicProof X</Link>

          <nav className="header-nav" aria-label="Primary">
            {navItems.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  className={`header-link ${active ? "active" : ""}`.trim()}
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="main-content">{children}</main>
    </div>
  );
}
