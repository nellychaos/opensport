import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Opensport — Open framework for sports data, odds & agent execution",
};

const FEATURES = [
  {
    icon: "⚡",
    title: "Query any sport, any event",
    body: "A unified Event model normalises data from any source — soccer, NFL, NBA, tennis, horse racing. One interface, every sport.",
  },
  {
    icon: "📊",
    title: "Read odds from any bookmaker",
    body: "Pluggable provider adapters. Connect The Odds API, Betfair, Sportradar, or your own feed by implementing a single abstract class.",
  },
  {
    icon: "🧪",
    title: "Simulate before you go live",
    body: "A built-in paper trading engine tracks P&L, win rates, and ROI with full commission support — no real money, no risk.",
  },
  {
    icon: "🤖",
    title: "Built for agents",
    body: "BaseAgent gives LLM-driven or rule-based agents a clean evaluate → place loop with stake clamping and risk guards baked in.",
  },
  {
    icon: "🔌",
    title: "Swap every layer",
    body: "Provider, executor, and agent are all abstract base classes. Swap any component — mock to live, sim to exchange — without touching your strategy.",
  },
  {
    icon: "🌐",
    title: "Python + TypeScript",
    body: "A Python SDK for modelling and agents. A TypeScript SDK for API layers and real-time feeds. Same concepts, same structure, both open source.",
  },
];

const CODE_EXAMPLE = `from opensport.providers.mock import MockProvider
from opensport.execution.simulator import Simulator
from opensport.agents.example import ValueAgent

# Wire up components — swap any layer for a real one
provider = MockProvider()
sim      = Simulator(bankroll=1_000)
agent    = ValueAgent(provider=provider, execution=sim)

# Fetch, evaluate, and place — all in one call
positions = agent.run(sport="soccer")

sim.print_summary()
# ══════════════════════════════════════════════════
#   Balance:     £1,062.40  (started £1,000.00)
#   Total P&L:   +£62.40  (+6.2% ROI)
#   W / L:       4 / 2  (66.7% win rate)
# ══════════════════════════════════════════════════`;

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 text-sm text-amber-700 font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Open source · MIT License
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-stone-900 leading-[1.1] mb-6">
          The open framework<br />
          <span className="text-amber-500">for sports agents</span>
        </h1>

        <p className="text-lg text-stone-500 leading-relaxed max-w-2xl mx-auto mb-10">
          Query events, read odds from any bookmaker, and place positions —
          all through a single provider-agnostic API. Built for autonomous agents,
          data scientists, and developers who move fast.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/docs/quickstart"
            className="w-full sm:w-auto px-6 py-3 bg-stone-900 text-white rounded-xl font-medium text-sm hover:bg-stone-800 transition-colors"
          >
            Get started →
          </Link>
          <Link
            href="/docs"
            className="w-full sm:w-auto px-6 py-3 border border-stone-200 text-stone-700 rounded-xl font-medium text-sm hover:border-stone-300 hover:bg-stone-50 transition-colors"
          >
            Read the docs
          </Link>
          <a
            href="https://github.com/opensport/opensport"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 border border-stone-200 text-stone-700 rounded-xl font-medium text-sm hover:border-stone-300 hover:bg-stone-50 transition-colors"
          >
            GitHub ↗
          </a>
        </div>
      </section>

      {/* Code example */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div className="bg-cream-50 border border-stone-100 rounded-2xl p-1">
          <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-stone-100 bg-stone-50">
              <div className="w-3 h-3 rounded-full bg-red-300" />
              <div className="w-3 h-3 rounded-full bg-amber-300" />
              <div className="w-3 h-3 rounded-full bg-green-300" />
              <span className="ml-3 text-xs text-stone-400 font-mono">agent.py</span>
            </div>
            <pre className="p-6 text-sm font-mono leading-7 text-stone-700 overflow-x-auto whitespace-pre">
{CODE_EXAMPLE}
            </pre>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-stone-900 mb-3">Everything an agent needs</h2>
          <p className="text-stone-500 max-w-xl mx-auto">
            A complete, layered toolkit — from raw data to executed positions.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl border border-stone-100 bg-white hover:border-stone-200 hover:shadow-sm transition-all"
            >
              <div className="text-2xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-stone-900 mb-2">{f.title}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture overview */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="bg-cream-50 border border-stone-100 rounded-2xl p-8 sm:p-12">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Layered by design</h2>
          <p className="text-stone-500 mb-8 leading-relaxed">
            Every layer is an abstract base class. Swap mock for real, simulator for exchange, without touching your strategy code.
          </p>

          <div className="space-y-3">
            {[
              { label: "Agent", desc: "Your strategy — evaluate events, return BetIntents", color: "bg-purple-100 text-purple-700 border-purple-200" },
              { label: "Executor", desc: "Simulator (paper) or Exchange (live) — accepts BetIntents, returns Positions", color: "bg-blue-100 text-blue-700 border-blue-200" },
              { label: "Provider", desc: "Fetches Events and OddsSnapshots from any data source", color: "bg-amber-100 text-amber-700 border-amber-200" },
              { label: "Core models", desc: "Event · Market · OddsSnapshot · BetIntent · Position", color: "bg-stone-100 text-stone-600 border-stone-200" },
            ].map((layer, i) => (
              <div key={layer.label} className="flex items-start gap-4">
                <div className={`shrink-0 px-3 py-1.5 rounded-lg border text-xs font-semibold font-mono ${layer.color}`}>
                  {layer.label}
                </div>
                <p className="text-sm text-stone-500 leading-relaxed pt-1">{layer.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-stone-200">
            <Link href="/docs/architecture" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              Read the architecture guide →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-28 text-center">
        <h2 className="text-3xl font-bold text-stone-900 mb-4">Ready to build?</h2>
        <p className="text-stone-500 mb-8">
          Start with the MockProvider and Simulator — no API keys, no account setup, no real money.
        </p>
        <Link
          href="/docs/quickstart"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors"
        >
          Get started in 5 minutes →
        </Link>
      </section>
    </div>
  );
}
