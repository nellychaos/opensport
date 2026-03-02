"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/docs", label: "Docs" },
  { href: "/docs/quickstart", label: "Quickstart" },
  { href: "https://github.com/opensport/opensport", label: "GitHub", external: true },
];

export default function Nav() {
  const pathname = usePathname();
  const isDocs = pathname.startsWith("/docs");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-100">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold text-sm select-none">
            OS
          </span>
          <span className="font-semibold text-stone-900 tracking-tight">
            opensport
            <span className="text-amber-500">.dev</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, external }) => {
            const isActive = !external && pathname === href;
            return (
              <Link
                key={href}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-amber-50 text-amber-700 font-medium"
                    : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
                }`}
              >
                {label}
                {external && (
                  <svg className="inline-block ml-1 mb-0.5 w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
