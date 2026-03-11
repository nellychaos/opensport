import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-stone-100 bg-white mt-24">
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-stone-400">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center text-white font-bold text-[10px]">OS</span>
          <span>opensport.dev — MIT License</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/docs" className="hover:text-stone-600 transition-colors">Docs</Link>
          <Link href="/docs/quickstart" className="hover:text-stone-600 transition-colors">Quickstart</Link>
          <Link href="/demo" className="hover:text-stone-600 transition-colors">Demo</Link>
          <a href="https://github.com/nellychaos/opensport" target="_blank" rel="noopener noreferrer" className="hover:text-stone-600 transition-colors">GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
