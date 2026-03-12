"use client";

import { useState, useCallback, ReactNode } from "react";

// ── Syntax-highlight helpers ────────────────────────────────────────────────
const Kw = ({ c }: { c: string }) => <span className="text-amber-400">{c}</span>;
const St = ({ c }: { c: string }) => <span className="text-green-400">{c}</span>;
const Fn = ({ c }: { c: string }) => <span className="text-sky-400">{c}</span>;
const Cm = ({ c }: { c: string }) => <span className="text-stone-500">{c}</span>;
const Nm = ({ c }: { c: string }) => <span className="text-orange-400">{c}</span>;

// ── Types ───────────────────────────────────────────────────────────────────
interface EventRow {
  id: string;
  home_team: string;
  away_team: string;
  competition: string;
  start_time: string;
  status: string;
}

interface OddsOutcome {
  bookmaker: string;
  label: string;
  decimal_odds: number;
  is_available: boolean;
}

interface OddsResult {
  match: string;
  markets: Array<{
    market_type: string;
    outcomes: OddsOutcome[];
    best: Record<string, { odds: number; bookmaker: string }>;
  }>;
}

interface ValueBetRow {
  event_id: string;
  event_summary: string;
  outcome_label: string;
  decimal_odds: number;
  edge_pct: number;
  bookmaker: string;
}

type DemoState = "idle" | "loading" | "done" | "error";

// ── Output renderers ────────────────────────────────────────────────────────
function EventsOutput({ data }: { data: EventRow[] }) {
  return (
    <div className="space-y-1.5">
      {data.map((ev) => (
        <div key={ev.id} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-stone-100">
          <div>
            <span className="text-sm font-medium text-stone-800">
              {ev.home_team} <span className="text-stone-400">vs</span> {ev.away_team}
            </span>
            <span className="ml-2 text-xs text-stone-400">{ev.competition}</span>
          </div>
          <span className="text-xs font-mono text-stone-500">{ev.start_time.slice(0, 16)}</span>
        </div>
      ))}
    </div>
  );
}

function OddsOutput({ data }: { data: OddsResult }) {
  const market = data.markets[0];
  const bookmakers = Array.from(new Set(market.outcomes.map((o) => o.bookmaker)));
  const labels = ["Home", "Draw", "Away"];

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-stone-700">{data.match} — Match Winner</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 pr-4 text-xs font-medium text-stone-400">Bookmaker</th>
              {labels.map((l) => (
                <th key={l} className="text-right py-2 px-3 text-xs font-medium text-stone-400">{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookmakers.map((bm) => (
              <tr key={bm} className="border-t border-stone-100">
                <td className="py-2 pr-4 text-xs font-medium text-stone-600">{bm}</td>
                {labels.map((label) => {
                  const outcome = market.outcomes.find((o) => o.bookmaker === bm && o.label === label);
                  const isBest = market.best[label]?.bookmaker === bm;
                  return (
                    <td key={label} className="py-2 px-3 text-right font-mono text-xs">
                      <span className={isBest
                        ? "bg-green-50 text-green-700 font-semibold px-1.5 py-0.5 rounded"
                        : "text-stone-600"
                      }>
                        {outcome?.decimal_odds.toFixed(2) ?? "—"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-stone-200">
              <td className="py-2 pr-4 text-xs font-semibold text-stone-500">Best</td>
              {labels.map((label) => (
                <td key={label} className="py-2 px-3 text-right font-mono text-xs">
                  <span className="text-green-700 font-semibold">
                    {market.best[label]?.odds.toFixed(2)}
                  </span>
                  <span className="text-stone-400 text-[10px] ml-1">
                    ({market.best[label]?.bookmaker.slice(0, 3).toUpperCase()})
                  </span>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function ValueBetsOutput({ data }: { data: ValueBetRow[] }) {
  return (
    <div className="space-y-2">
      {data.map((bet, i) => {
        const match = bet.event_summary.split(" | ")[0];
        const edgeCls =
          bet.edge_pct >= 10 ? "bg-green-100 text-green-800" :
          bet.edge_pct >=  5 ? "bg-amber-100 text-amber-800" :
                               "bg-stone-100 text-stone-600";
        return (
          <div key={i} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-stone-100">
            <div>
              <span className="text-sm font-medium text-stone-800">{match}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-stone-500">
                  {bet.outcome_label} @{" "}
                  <span className="font-mono text-stone-700">{bet.decimal_odds.toFixed(2)}</span>
                </span>
                <span className="text-xs text-stone-400">via {bet.bookmaker}</span>
              </div>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${edgeCls}`}>
              +{bet.edge_pct.toFixed(1)}% edge
            </span>
          </div>
        );
      })}
    </div>
  );
}

function FindEventsOutput({ data }: { data: EventRow[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-stone-400 py-4 text-center">No fixtures found.</p>;
  }
  return (
    <div className="space-y-1.5">
      {data.map((ev) => (
        <div key={ev.id} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-stone-100">
          <div>
            <span className="text-sm font-medium text-stone-800">
              {ev.home_team} <span className="text-stone-400">vs</span> {ev.away_team}
            </span>
            <span className="ml-2 text-xs text-stone-400">{ev.competition}</span>
          </div>
          <span className="text-xs font-mono text-stone-500">{ev.start_time.slice(0, 16)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Demo definitions ────────────────────────────────────────────────────────
interface Demo {
  id: string;
  title: string;
  badge: string;
  description: string;
  codeLines: ReactNode[];
  action: string;
  params?: Record<string, string>;
  renderOutput: (data: unknown) => ReactNode;
}

const DEMOS: Demo[] = [
  {
    id: "events",
    title: "Upcoming fixtures",
    badge: "get_events()",
    description: "Fetch the next Premier League matchweek — all ten Matchweek 30 fixtures.",
    action: "events",
    codeLines: [
      <><Kw c="from" /> opensport.providers.mock <Kw c="import" /> MockProvider</>,
      <>&nbsp;</>,
      <><Cm c="# Initialise provider (zero API keys required)" /></>,
      <>provider = <Fn c="MockProvider" />(seed=<Nm c="42" />)</>,
      <>&nbsp;</>,
      <><Cm c="# Fetch all scheduled Premier League matches" /></>,
      <>events = provider.<Fn c="get_events" />(</>,
      <>{"    "}sport=<St c='"soccer"' />, status=<St c='"scheduled"' /></>,
      <>)</>,
      <>&nbsp;</>,
      <><Kw c="for" /> event <Kw c="in" /> events:</>,
      <>{"    "}print(event.<Fn c="summary" />())</>,
    ],
    renderOutput: (data) => <EventsOutput data={data as EventRow[]} />,
  },
  {
    id: "odds",
    title: "Compare bookmaker prices",
    badge: "get_odds()",
    description: "Fan out to Cloudbet, Stake, and Polymarket and surface the best available price for each outcome. Fetches the next scheduled PL match live.",
    action: "odds",
    codeLines: [
      <><Kw c="from" /> opensport.providers <Kw c="import" /> ProviderRegistry, MultiProvider</>,
      <>&nbsp;</>,
      <><Cm c="# Auto-loads providers from env vars" /></>,
      <>registry = ProviderRegistry.<Fn c="from_env" />()</>,
      <>provider = <Fn c="MultiProvider" />(registry)</>,
      <>&nbsp;</>,
      <><Cm c="# get_odds() fans out to all active bookmakers" /></>,
      <>events  = provider.<Fn c="get_events" />(sport=<St c='"soccer"' />, status=<St c='"scheduled"' />)</>,
      <>snap    = provider.<Fn c="get_odds" />(events[<Nm c="0" />].id)  <Cm c="# next match" /></>,
      <>&nbsp;</>,
      <><Kw c="for" /> market <Kw c="in" /> snap.markets:</>,
      <>{"    "}<Kw c="for" /> o <Kw c="in" /> market.outcomes:</>,
      <>{"        "}print(o.bookmaker, o.label, o.decimal_odds)</>,
    ],
    renderOutput: (data) => <OddsOutput data={data as OddsResult} />,
  },
  {
    id: "value_bets",
    title: "Scan for value bets",
    badge: "get_value_bets()",
    description: "Strip bookmaker overround to find fair probabilities, then surface positive-EV opportunities sorted by edge.",
    action: "value_bets",
    codeLines: [
      <><Kw c="from" /> opensport.providers.mock <Kw c="import" /> MockProvider</>,
      <><Kw c="from" /> opensport.utils <Kw c="import" /> get_value_bets</>,
      <>&nbsp;</>,
      <>provider = <Fn c="MockProvider" />(seed=<Nm c="42" />)</>,
      <>&nbsp;</>,
      <><Cm c="# Surface all +EV opportunities above 2% edge" /></>,
      <>bets = <Fn c="get_value_bets" />(</>,
      <>{"    "}provider,</>,
      <>{"    "}sport=<St c='"soccer"' />,</>,
      <>{"    "}min_edge_pct=<Nm c="0.02" />,</>,
      <>)</>,
      <>&nbsp;</>,
      <><Kw c="for" /> b <Kw c="in" /> bets:</>,
      <>{"    "}print(<Fn c="f" /><St c={`"${"{b['outcome_label']}"} @ ${"{b['decimal_odds']:.2f}"}  edge=${"{b['edge_pct']:.1f}"}%"`} />)</>,
    ],
    renderOutput: (data) => <ValueBetsOutput data={data as ValueBetRow[]} />,
  },
  {
    id: "find_events",
    title: "Search by team name",
    badge: "find_events()",
    description: "Case-insensitive substring search across all events — handy for tracking a specific club across competitions.",
    action: "find_events",
    params: { team: "Arsenal" },
    codeLines: [
      <><Kw c="from" /> opensport.providers.mock <Kw c="import" /> MockProvider</>,
      <>&nbsp;</>,
      <>provider = <Fn c="MockProvider" />(seed=<Nm c="42" />)</>,
      <>&nbsp;</>,
      <><Cm c="# Case-insensitive substring match on team name" /></>,
      <>fixtures = provider.<Fn c="find_events" />(team=<St c='"Arsenal"' />)</>,
      <>&nbsp;</>,
      <><Kw c="for" /> e <Kw c="in" /> fixtures:</>,
      <>{"    "}print(e.<Fn c="summary" />())</>,
    ],
    renderOutput: (data) => <FindEventsOutput data={data as EventRow[]} />,
  },
];

// ── Icons ───────────────────────────────────────────────────────────────────
function IconPlay() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── DemoCard ────────────────────────────────────────────────────────────────
function DataBadge({ live }: { live: boolean }) {
  return live ? (
    <span className="flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      Live
    </span>
  ) : (
    <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Mock
    </span>
  );
}

function DemoCard({ demo }: { demo: Demo }) {
  const [state, setState] = useState<DemoState>("idle");
  const [result, setResult] = useState<unknown>(null);
  const [isLive, setIsLive] = useState<boolean | null>(null);

  const run = useCallback(async () => {
    setState("loading");
    try {
      const qs = new URLSearchParams({ action: demo.action, ...demo.params });
      const res = await fetch(`/api/demo?${qs}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "API error");
      setResult(json.data);
      setIsLive(json.live ?? false);
      setState("done");
    } catch {
      setState("error");
    }
  }, [demo]);

  return (
    <div className="flex flex-col border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-stone-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-stone-900">{demo.title}</h3>
            <p className="text-stone-500 text-sm mt-0.5 leading-relaxed">{demo.description}</p>
          </div>
          <span className="shrink-0 text-xs font-mono bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg whitespace-nowrap">
            {demo.badge}
          </span>
        </div>
      </div>

      {/* Code panel */}
      <div className="bg-stone-950 px-5 py-4 text-xs font-mono leading-[1.65] overflow-x-auto">
        <div className="flex items-center gap-1.5 mb-3 opacity-40">
          <span className="w-2.5 h-2.5 rounded-full bg-stone-600" />
          <span className="w-2.5 h-2.5 rounded-full bg-stone-600" />
          <span className="w-2.5 h-2.5 rounded-full bg-stone-600" />
          <span className="ml-2 text-stone-500 text-[11px]">python</span>
        </div>
        {demo.codeLines.map((line, i) => (
          <div key={i} className="text-stone-300 min-h-[1rem]">
            {line}
          </div>
        ))}
      </div>

      {/* Run button + output */}
      <div className="px-5 py-4 flex-1 flex flex-col gap-3">
        <button
          onClick={run}
          disabled={state === "loading"}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-150 ${
            state === "loading"
              ? "bg-stone-100 text-stone-400 cursor-not-allowed"
              : "bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white shadow-sm hover:shadow-md"
          }`}
        >
          {state === "loading" ? <><IconSpinner /> Running…</> :
           state === "done"    ? <><IconRefresh /> Run again</> :
                                 <><IconPlay /> Run</>}
        </button>

        {state === "done" && result !== null && (
          <div className="bg-stone-50 rounded-xl border border-stone-100 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
              <span className="text-xs text-stone-400">Output</span>
              {isLive !== null && <DataBadge live={isLive} />}
            </div>
            <div className="p-3 overflow-auto max-h-72">
              {demo.renderOutput(result)}
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="bg-red-50 rounded-xl p-3 border border-red-100 text-xs text-red-600">
            Something went wrong — please try again.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────
export default function DemoPlayground() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {DEMOS.map((demo) => (
        <DemoCard key={demo.id} demo={demo} />
      ))}
    </div>
  );
}
