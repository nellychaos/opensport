import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { template: "%s · Opensport Docs", default: "Docs · Opensport" } };

const SIDEBAR = [
  {
    section: "Getting started",
    links: [
      { href: "/docs", label: "Overview" },
      { href: "/docs/quickstart", label: "Quickstart" },
    ],
  },
  {
    section: "Concepts",
    links: [
      { href: "/docs/architecture", label: "Architecture" },
    ],
  },
  {
    section: "Reference",
    links: [
      { href: "/docs/providers", label: "Providers" },
      { href: "/docs/execution", label: "Execution" },
      { href: "/docs/agents", label: "Agents" },
    ],
  },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex gap-12">
        {/* Sidebar */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-20 space-y-6">
            {SIDEBAR.map(({ section, links }) => (
              <div key={section}>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">
                  {section}
                </p>
                <ul className="space-y-0.5">
                  {links.map(({ href, label }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="block px-3 py-1.5 text-sm text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1 prose-docs">
          {children}
        </div>
      </div>
    </div>
  );
}
