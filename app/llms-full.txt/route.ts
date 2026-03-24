import { NextResponse } from "next/server";

const FULL_DOCS = `# Opensport — Full Documentation

Source: https://opensport.dev
Version: see https://github.com/opensport/opensport
License: MIT

---

## Overview

Opensport is an open-source framework for sports data, odds, and agent execution.
It is structured as four independent layers — Core models, Providers, Execution, Agents.
Each layer is an abstract base class. Swap any implementation without touching the others.

Supported sports: soccer, nfl, nba, nhl, mlb, tennis, cricket, mma, horse_racing, rugby_union

Supported market types: winner, spread, asian_handicap, totals, btts, correct_score, player_props, race_markets

All odds are stored and returned in decimal format internally.

---

## Core models

Located in python/opensport/core/ and typescript/src/core/

| Model         | Description                                                                 |
|---------------|-----------------------------------------------------------------------------|
| Event         | A sporting event — sport, competition, teams, venue, start time, status     |
| Team          | Participant metadata                                                         |
| Venue         | Location metadata                                                            |
| Market        | Market type — slug, handicap line, valid outcomes, status                   |
| OutcomeOdds   | Single price for a single outcome from a single bookmaker (decimal format)  |
| MarketOdds    | All outcome prices for one market — includes overround and best-odds helpers|
| OddsSnapshot  | All markets for one event at one point in time                              |
| BetIntent     | What an agent wants to do — not yet placed                                  |
| Position      | A placed and (eventually) settled bet — includes P&L. Has optional sport field for grouped analytics. |
| Portfolio     | Thread-safe P&L aggregation across positions. Methods: pnl_by_sport(), pnl_by_bookmaker(), to_json(). |

---

## Providers

BaseProvider interface (Python):

  class BaseProvider(ABC):
      name: str = "base"
      event_id_prefix: str = ""
      capabilities: ProviderCapabilities  # describes features without instantiating
      def get_events(self, sport=None, competition=None, status=None) -> list[Event]: ...
      def get_odds(self, event_id: str) -> OddsSnapshot: ...
      # Optional:
      def get_markets(self, event_id: str) -> list[Market]: ...
      def get_live_score(self, event_id: str) -> dict: ...
      def get_historical_odds(self, event_id, from_dt, to_dt, max_snapshots=10) -> list[OddsSnapshot]: ...
      def get_past_events(self, sport=None, competition=None, from_dt=None, to_dt=None) -> list[Event]: ...
      async def stream_odds(self, event_id: str, interval_seconds=5.0): ...

IProvider interface (TypeScript):

  interface IProvider {
    readonly name: string;
    getEvents(params?: { sport?: string; competition?: string; status?: string }): Promise<Event[]>;
    getOdds(eventId: string): Promise<OddsSnapshot>;
    getMarkets?(eventId: string): Promise<Market[]>;
    getLiveScore?(eventId: string): Promise<Record<string, unknown>>;
  }

get_events() parameters:
  - sport: str | None — filter by sport slug. None = all sports.
  - competition: str | None — filter by competition slug.
  - status: str | None — "scheduled" | "live" | "finished"
  Returns: list[Event]. Raises ProviderError on upstream failure.

get_odds() parameters:
  - event_id: str — the Event.id returned by get_events()
  Returns: OddsSnapshot with all markets in decimal odds format.

get_historical_odds() — returns a time-series of OddsSnapshot objects for past events.
  Only available on providers with capabilities.supports_historical = True.

stream_odds() — async generator, yields OddsSnapshot on each poll interval.

Built-in providers:

| Provider              | Coverage                                | API key              | Install                  |
|-----------------------|-----------------------------------------|----------------------|--------------------------|
| MockProvider          | In-memory, deterministic, no network    | None                 | pip install opensport     |
| PremierLeagueProvider | English Premier League fixtures + odds  | 2 × free keys        | opensport[http]           |
| MasseyRatingsProvider | NFL, NBA, MLB, NHL, NCAAF, NCAAB        | None                 | opensport[massey]         |
| StakeProvider         | 20+ sports + esports                    | Required             | opensport[http]           |
| CloudbetProvider      | 20+ sports (free affiliate key)         | Required (free)      | opensport[http]           |
| PolymarketProvider    | 10+ sports (prediction market prices)   | None                 | opensport[http]           |
| NBAProvider           | NBA schedules, scores, live + odds      | None (odds optional) | opensport[nba]            |
| KalshiProvider        | CFTC binary markets, US sports          | Required, KYC        | opensport[http]           |
| OpenLigaDBProvider    | German Bundesliga + European leagues    | None                 | opensport[http]           |
| BallDontLieProvider   | NBA, NFL, MLB (box scores + schedules)  | Required (free)      | opensport[http]           |
| ApiFootballProvider   | 800+ football leagues worldwide         | Required             | opensport[http]           |
| SportRadarProvider    | 80+ sports, professional-grade data     | Required             | opensport[http]           |

MockProvider (built-in test provider):
  - No API key or network required
  - Fully in-memory, reproducible via seed
  - from opensport.providers.mock import MockProvider
  - MockProvider(seed=42, sports=["soccer"], events_per_sport=3, bookmakers=5, overround=1.06)

NBAProvider (official NBA data, no API key needed for schedules/scores):
  - Wraps nba_api (MIT, stats.nba.com + cdn.nba.com). Zero config for game data.
  - Optional: set ODDS_API_KEY for bookmaker odds via The Odds API (basketball_nba sport key)
  - Activate: NBA_PROVIDER_ENABLED=1
  - Install: pip install 'opensport[nba]'
  - event_id_prefix: "nba-" (e.g. "nba-0022500890")
  - Supports: get_events(), get_odds(), get_live_score(), get_past_events()
  - capabilities: supports_live_scores=True, supports_historical=True, provides_odds=True

  from opensport.providers.nba import NBAProvider

  # Schedules and scores — no key needed
  provider = NBAProvider()
  events = provider.get_events()                    # today's games
  live   = provider.get_live_score(events[0].id)   # {"home": 102, "away": 98, "period": 4, ...}

  # Odds — requires ODDS_API_KEY
  provider = NBAProvider(odds_api_key="your-key")
  snapshot = provider.get_odds(events[0].id)
  print(snapshot.market("winner").best_odds("Home"))

  # Auto-activate via environment variables:
  #   NBA_PROVIDER_ENABLED=1
  #   ODDS_API_KEY=...   (optional — only needed for get_odds())

KalshiProvider (CFTC-regulated binary markets):
  - US residents only. KYC required.
  - Sports: NBA, NFL, MLB, NHL, Soccer
  - event_id_prefix: "kal-"
  - Activate: set KALSHI_API_KEY env var

Building a custom provider:
  Subclass BaseProvider, implement get_events() and get_odds(), map upstream responses to core models.
  See https://opensport.dev/docs/providers for a full TheOddsApi example.

ProviderRegistry and MultiProvider:
  Registry tracks enabled/disabled providers; MultiProvider exposes all through one BaseProvider interface.

  from opensport.providers import ProviderRegistry, MultiProvider

  registry = ProviderRegistry.from_env()
  # Auto-activates providers from env vars:
  #   FOOTBALL_DATA_API_KEY + ODDS_API_KEY  → PremierLeagueProvider
  #   MASSEY_SPORTS=nfl,nba                 → MasseyRatingsProvider
  #   STAKE_API_KEY                          → StakeProvider
  #   CLOUDBET_API_KEY                       → CloudbetProvider
  #   POLYMARKET_ENABLED=1                   → PolymarketProvider
  #   NBA_PROVIDER_ENABLED=1                 → NBAProvider
  #   KALSHI_API_KEY                         → KalshiProvider
  #   OPENLIGADB_ENABLED=1                   → OpenLigaDBProvider
  #   BALLDONTLIE_API_KEY                    → BallDontLieProvider
  #   API_FOOTBALL_KEY                       → ApiFootballProvider
  #   SPORTRADAR_API_KEY                     → SportRadarProvider

  provider = MultiProvider(registry)
  events   = provider.get_events(sport="basketball")

ProviderCapabilities (evaluate providers without instantiating):
  caps = NBAProvider.capabilities
  caps.provides_odds          # True
  caps.supports_live_scores   # True
  caps.supports_historical    # True
  caps.pricing_model          # PricingModel.FREEMIUM
  caps.supported_sports       # ("basketball",)

  registry.filter(free_only=True, provides_odds=True, sport="basketball")
  registry.select_best(sport="nba", requires_odds=True)

---

## Execution

BaseExecutor interface (Python):

  class BaseExecutor(ABC):
      def place(self, intent: BetIntent) -> Position: ...
      def cancel(self, position_id: str) -> bool: ...
      def get_position(self, position_id: str) -> Position: ...
      def get_balance(self) -> float: ...

BetIntent fields:
  - event_id: str (required)
  - market_type: str (required) — e.g. "winner", "totals"
  - outcome_label: str (required) — e.g. "Home", "Over 2.5"
  - side: Side (required) — Side.BACK or Side.LAY
  - stake: float (required) — amount to risk
  - min_odds: float (required) — minimum acceptable decimal odds
  - notes: str (optional) — free-text label for logging

Position fields:
  - id: str — UUID
  - intent: BetIntent
  - odds_taken: float
  - status: PositionStatus — PENDING | WON | LOST | VOID
  - placed_at: datetime
  - settled_at: datetime | None
  - settlement_value: float | None — net P&L after commission
  - sport: str | None — optional sport slug for grouped analytics

Simulator (paper trading):
  - from opensport.execution.simulator import Simulator
  - Simulator(bankroll=1000.0, commission=0.0, verbose=False)
  - Methods: place(intent), cancel(id), settle_position(id, won), get_balance(),
             get_positions(), get_open_positions(), print_summary(), reset()
  - No network, no API key, instant settlement

ExchangeExecutor (live exchange):
  - Abstract base — subclass and implement three methods:
    _api_place_bet(intent) -> dict
    _api_cancel_order(position_id) -> bool
    _api_get_balance() -> float
  - Constructor params: max_single_stake, max_total_exposure, dry_run, min_odds_buffer
  - Risk guards fire before _api_place_bet(), raise RiskError if triggered
  - dry_run=True logs intents without calling the exchange

Portfolio (P&L aggregation):
  - from opensport.core.portfolio import Portfolio
  - Thread-safe. Persists to JSON. Groups P&L by sport or bookmaker.
  - portfolio = Portfolio()
  - portfolio.add(position)
  - portfolio.pnl_by_sport()       # {"basketball": 42.5, "soccer": -12.0}
  - portfolio.pnl_by_bookmaker()   # {"draftkings": 30.0, "betway": -0.5}
  - portfolio.to_json("portfolio.json")
  - portfolio2 = Portfolio.from_json("portfolio.json")

Switching executors:
  Agent code is identical. Change one line: Simulator(...) → MyExchangeExecutor(...)

---

## Agents

BaseAgent interface (Python):

  class BaseAgent(ABC):
      def __init__(self, provider, execution, config=None): ...
      def evaluate(self, event: Event, snapshot: OddsSnapshot) -> BetIntent | None: ...
      def run(self, sport=None, limit=None) -> list[Position]: ...

Implement evaluate() — return BetIntent to bet, None to skip. BaseAgent handles:
  fetching events, position limit checks, stake clamping, error recovery.

AgentConfig fields:
  - bankroll: float = 1000.0
  - max_stake_pct: float = 0.05 (5% of bankroll per bet, hard clamp)
  - min_edge_pct: float = 0.03 (minimum edge to emit a BetIntent)
  - max_open_positions: int = 10
  - sports_filter: list[str] = [] (empty = all sports)
  - dry_run: bool = False

ValueAgent (built-in):
  Strategy: remove vig from winner market, compute fair prices, bet where edge > threshold using fractional Kelly.
  from opensport.agents.example import ValueAgent
  1. Compute implied probs from decimal odds
  2. Normalise to remove overround
  3. edge = (market_odds / fair_odds) - 1
  4. If edge > min_edge_pct: size with 0.25 * Kelly * bankroll, capped at max_stake_pct
  5. Return BetIntent for best-value outcome; None otherwise

Building a custom agent:
  class MyAgent(BaseAgent):
      def evaluate(self, event, snapshot) -> BetIntent | None:
          # Your strategy here
          return BetIntent(...) or None

  agent = MyAgent(provider=provider, execution=sim, config=config)
  positions = agent.run(sport="basketball", limit=20)

Using agents with LLMs (tool use):
  evaluate() and run() return structured Python objects — straightforward to expose as tools
  in Claude tool use, LangChain, LlamaIndex, or any agent framework.
  See https://opensport.dev/docs/agents for a Claude tool-use integration example.

---

## End-to-end example

  from opensport.providers.mock import MockProvider
  from opensport.execution.simulator import Simulator
  from opensport.agents.example import ValueAgent
  from opensport.agents.base import AgentConfig

  provider = MockProvider(seed=42)
  sim      = Simulator(bankroll=1_000.0, commission=0.05)
  config   = AgentConfig(min_edge_pct=0.02, max_stake_pct=0.05)
  agent    = ValueAgent(provider=provider, execution=sim, config=config)

  positions = agent.run()
  sim.print_summary()

NBA example (no API key required for game data):

  import os
  os.environ["NBA_PROVIDER_ENABLED"] = "1"

  from opensport.providers import ProviderRegistry, MultiProvider
  from opensport.execution.simulator import Simulator
  from opensport.agents.example import ValueAgent

  registry = ProviderRegistry.from_env()   # activates NBAProvider
  provider = MultiProvider(registry)
  sim      = Simulator(bankroll=1_000.0)
  agent    = ValueAgent(provider=provider, execution=sim)

  positions = agent.run(sport="basketball")
  sim.print_summary()

---

## Testing

No API keys or network required for full test suite.
Use MockProvider (seed for determinism) + Simulator (in-memory).

  provider  = MockProvider(seed=42)
  sim       = Simulator(bankroll=1000, verbose=False)
  agent     = MyAgent(provider=provider, execution=sim)
  positions = agent.run(limit=5)
  assert sim.get_balance() >= 0

Python: pytest tests/ -v
TypeScript: npm test
`;

export function GET() {
  return new NextResponse(FULL_DOCS, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
