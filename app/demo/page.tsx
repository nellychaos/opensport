import type { Metadata } from "next";
import DemoPlayground from "./DemoPlayground";

export const metadata: Metadata = {
  title: "Demo — Opensport",
  description:
    "Run live code snippets against real mock Premier League data. No API key or account required.",
};

export default function DemoPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Page header */}
      <div className="mb-12">
        <span className="text-xs font-semibold text-amber-600 uppercase tracking-widest">
          Interactive
        </span>
        <h1 className="text-4xl font-bold text-stone-900 mt-2 mb-4">Demo</h1>
        <p className="text-stone-500 text-lg leading-relaxed max-w-2xl">
          Click <strong className="text-stone-700 font-semibold">Run</strong> on any snippet to call
          a live API returning realistic Premier League data.{" "}
          <span className="text-stone-400">No API key or account needed.</span>
        </p>
      </div>

      <DemoPlayground />
    </div>
  );
}
