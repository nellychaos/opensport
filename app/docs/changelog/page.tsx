import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Version history for the Opensport SDK.",
};

interface Release {
  version: string;
  date: string;
  tag: "major" | "minor" | "patch";
  changes: {
    type: "added" | "changed" | "fixed" | "removed";
    items: string[];
  }[];
}

const RELEASES: Release[] = [
  {
    version: "0.4.0",
    date: "2026-03-12",
    tag: "minor",
    changes: [
      {
        type: "added",
        items: [
          "**TTLCache** and **`@ttl_cache`** decorator in `opensport.utils` — thread-safe in-memory caching with per-entry time-to-live.",
          "Caching applied to `PremierLeagueProvider.get_events()` (300 s) and `get_odds()` (120 s) to protect free-tier rate limits.",
          "**`stream_odds()`** on `MockProvider` — async generator that yields fresh `OddsSnapshot` objects with jittered prices, simulating a live price feed without network calls.",
          "Live score demo card on the Demo page — `get_live_score()` shown in the interactive playground.",
          "**Daily value-bet digest** scheduled skill — creates a Notion page each morning with that day's top +EV opportunities.",
        ],
      },
      {
        type: "changed",
        items: [
          "Demo API route now returns a `live: boolean` field so the playground can distinguish real vs. mock data.",
        ],
      },
    ],
  },
  {
    version: "0.3.0",
    date: "2026-03-08",
    tag: "minor",
    changes: [
      {
        type: "added",
        items: [
          "Interactive **Demo** page at `/demo` — run live code snippets against real Premier League data with no API key required.",
          "API route at `/api/demo` backing the playground — gracefully falls back to curated mock data when keys are absent.",
          "**Live / Mock badge** in demo output to indicate the data source at a glance.",
          "Real Matchweek 30 fixture data (14–16 March 2026) with correct GMT kick-off times baked into mock fallback.",
          "Demo page linked from the main navigation and footer.",
        ],
      },
      {
        type: "changed",
        items: [
          "GitHub links updated throughout to `github.com/nellychaos/opensport`.",
        ],
      },
    ],
  },
  {
    version: "0.2.0",
    date: "2026-03-01",
    tag: "minor",
    changes: [
      {
        type: "added",
        items: [
          "**`PremierLeagueProvider`** — production-ready Premier League connector combining Football-Data.org (fixtures/scores) and The Odds API (bookmaker prices).",
          "`FootballDataClient` and `OddsApiClient` HTTP clients with full error handling and `RateLimitError` propagation.",
          "Mapper utilities: `fbd_match_to_event`, `odds_to_snapshot`, `find_odds_event`, `normalize_team`.",
          "`PremierLeagueProvider.verify()` classmethod — validates both API keys cheaply before running an agent.",
          "47 offline unit tests covering all mappers, clients (with httpx mocks), and provider edge-cases.",
          "**`ProviderRegistry.from_env()`** — auto-discovers providers from environment variables (`FOOTBALL_DATA_API_KEY`, `ODDS_API_KEY`).",
          "MCP server (`opensport serve`) — exposes `get_events`, `get_odds`, and `find_events` as MCP tools consumable by Claude, Cursor, and other AI clients.",
        ],
      },
      {
        type: "changed",
        items: [
          "`BaseProvider.get_live_score()` default implementation now returns `{}` instead of raising `NotImplementedError`.",
        ],
      },
    ],
  },
  {
    version: "0.1.0",
    date: "2026-02-20",
    tag: "major",
    changes: [
      {
        type: "added",
        items: [
          "**Core data models** — `Event`, `Team`, `Venue`, `OddsSnapshot`, `MarketOdds`, `OutcomeOdds`, `MarketType`.",
          "**`BaseProvider`** abstract class — standard interface (`get_events`, `get_odds`, `get_markets`, `get_live_score`, `stream_odds`, `find_events`) for all data providers.",
          "**`MockProvider`** — fully in-memory provider generating realistic events and odds across soccer, NFL, NBA, and tennis. No API keys required.",
          "**`MultiProvider`** + **`ProviderRegistry`** — fan-out `get_events()` across providers; route `get_odds()` by `event_id_prefix`.",
          "**`get_value_bets()`** utility — strips vig, computes consensus fair probabilities, surfaces positive-EV outcomes.",
          "`format_odds_table()` and `pnl_report()` display helpers.",
          "Python 3.11+, zero hard dependencies; optional `httpx` via `pip install 'opensport[http]'`.",
          "Comprehensive test suite with 100% offline coverage of core models.",
        ],
      },
    ],
  },
];

const TYPE_LABELS: Record<string, { label: string; cls: string }> = {
  added:   { label: "Added",   cls: "bg-green-50 text-green-700 border-green-200" },
  changed: { label: "Changed", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  fixed:   { label: "Fixed",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
  removed: { label: "Removed", cls: "bg-red-50 text-red-700 border-red-200" },
};

const TAG_CLS: Record<string, string> = {
  major: "bg-stone-900 text-white",
  minor: "bg-amber-500 text-white",
  patch: "bg-stone-100 text-stone-600",
};

function ReleaseSection({ release }: { release: Release }) {
  return (
    <div className="relative pl-8 pb-12 last:pb-0">
      {/* Timeline spine */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-stone-200 last:bg-transparent" />
      {/* Timeline dot */}
      <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />

      {/* Header */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <h2 className="text-xl font-bold text-stone-900">v{release.version}</h2>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TAG_CLS[release.tag]}`}>
          {release.tag}
        </span>
        <span className="text-sm text-stone-400 font-mono">{release.date}</span>
      </div>

      {/* Change groups */}
      <div className="space-y-4">
        {release.changes.map(({ type, items }) => {
          const { label, cls } = TYPE_LABELS[type];
          return (
            <div key={type}>
              <span className={`inline-block text-xs font-semibold border px-2 py-0.5 rounded-full mb-2 ${cls}`}>
                {label}
              </span>
              <ul className="space-y-1.5">
                {items.map((item, i) => (
                  <li key={i} className="text-sm text-stone-600 leading-relaxed flex gap-2">
                    <span className="text-stone-300 mt-[3px] shrink-0">–</span>
                    <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/`(.*?)`/g, "<code class=\"text-[12px] bg-stone-100 px-1 py-0.5 rounded font-mono\">$1</code>") }} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ChangelogPage() {
  return (
    <div>
      <div className="mb-10">
        <span className="text-xs font-semibold text-amber-600 uppercase tracking-widest">
          Release history
        </span>
        <h1 className="text-3xl font-bold text-stone-900 mt-2 mb-3">Changelog</h1>
        <p className="text-stone-500 leading-relaxed">
          All notable changes to the Opensport SDK and documentation site.
          Follows <a href="https://semver.org" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">semantic versioning</a>.
        </p>
      </div>

      <div className="mt-8">
        {RELEASES.map((r) => (
          <ReleaseSection key={r.version} release={r} />
        ))}
      </div>
    </div>
  );
}
