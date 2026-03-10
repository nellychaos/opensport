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

Supported sports: soccer, nfl, nba, nhl, tennis, cricket, mma, horse_racing, rugby_union

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
| Position      | A placed and (eventually) settled bet — includes P&L                        |

---

## Providers

BaseProvider interface (Python):

  class BaseProvider(ABC):
      name: str = "base"
      def get_events(self, sport=None, competition=None, status=None) -> list[Event]: ...
      def get_odds(self, event_id: str) -> OddsSnapshot: ...
      # Optional:
      def get_markets(self, event_id: str) -> list[Market]: ...
      def get_live_score(self, event_id: str) -> dict: ...
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

stream_odds() — async generator, yields OddsSnapshot on each poll interval.

MockProvider (built-in test provider):
  - No API key or network required
  - Fully in-memory, reproducible via seed
  - from opensport.providers.mock import MockProvider
  - MockProvider(seed=42, sports=["soccer"], events_per_sport=3, bookmakers=5, overround=1.06)

Building a custom provider:
  Subclass BaseProvider, implement get_events() and get_odds(), map upstream responses to core models.
  See https://opensport.dev/docs/providers for a full TheOddsApi example.

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
  positions = agent.run(sport="soccer", limit=20)

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
