import type { Metadata } from "next";
import Link from "next/link";

const title = "Agents";
export const metadata: Metadata = { title };

export default function Page() {
  return (
    <>
      <div className="mb-8">
        <span className="text-xs font-semibold text-amber-600 uppercase tracking-widest">Reference</span>
        <h1 className="text-3xl font-bold text-stone-900 mt-2 mb-3">{title}</h1>
        <p className="text-stone-500 text-lg leading-relaxed">
          Full reference documentation coming soon.
        </p>
      </div>
      <p>
        In the meantime, see the <Link href="/docs/architecture">Architecture guide</Link> for a comprehensive overview, or the <Link href="/docs/quickstart">Quickstart</Link> to start building.
      </p>
    </>
  );
}
