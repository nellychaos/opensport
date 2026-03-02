import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Architecture" };

export default function ArchitecturePage() {
  return (
    <>
      <div className="mb-8">
        <span className="text-xs font-semibold text-amber-600 uppercase tracking-widest">Concepts</span>
        <h1 className="text-3xl font-bold text-stone-900 mt-2 mb-3">Architecture</h1>
        <p className="text-stone-500 text-lg leading-relaxed">
          Opensport is structured as four independent layers. Each is an abstract base class — swap any component without touching the others.
        </p>
      </div>

      <h2>Overview</h2>
      <p>
        The data flow is linear and unidirectional: a <strong>Provider</strong> fetches raw data, the <strong>Agent</strong> evaluates it and emits a <code>BetIntent</code>, and the <strong>Executor</strong> converts that intent into a <code>Position</code>.
        All layers communicate through the <strong>Core models</strong> — pure data classes with no I/O.
      </p>

      <pre><code>{`Agent (strategy)
  │ BetIntent
  ▼
Executor (Simulator / Exchange)
  │ Position
  ▼
Provider (Events + Odds)
  │
  ▼
Core models (Event · OddsSnapshot · Position · ...)`}</code></pre>

      <h2>Layer 1 — Core models</h2>
      <p>
        Located in <code>python/opensport/core/</code> and <code>typescript/src/core/</code>.
        These are immutable data classes with no I/O. All layers depend on them.
      </p>

      <table>
        <thead><tr><th>Model</th><th>Purpose</th></tr></thead>
        <tbody>
          <tr><td>Event</td><td>A sporting event — sport, competition, teams, venue, start time, status, scores</td></tr>
          <tr><td>Team / Venue</td><td>Participants and location metadata</td></tr>
          <tr><td>Market</td><td>Market type metadata — type slug, handicap line, valid outcomes, status</td></tr>
          <tr><td>OutcomeOdds</td><td>A single price for a single outcome from a single bookmaker</td></tr>
          <tr><td>MarketOdds</td><td>All outcome prices for one market — includes overround and best-odds helpers</td></tr>
          <tr><td>OddsSnapshot</td><td>All markets for one event at one point in time</td></tr>
          <tr><td>BetIntent</td><td>What an agent wants to do — not yet placed</td></tr>
          <tr><td>Position</td><td>A placed and (eventually) settled bet — includes P&amp;L</td></tr>
        </tbody>
      </table>

      <h3>Odds format</h3>
      <p>
        Opensport stores all odds in <strong>decimal format</strong> internally. Conversion helpers are provided for American (moneyline) and fractional formats.
        Implied probability is always <code>1 / decimal_odds</code>.
      </p>

      <h2>Layer 2 — Providers</h2>
      <p>
        A Provider fetches events and odds from a data source and normalises them into the core models.
        Implement <code>BaseProvider</code> to connect any feed.
      </p>

      <pre><code>{`class BaseProvider(ABC):
    def get_events(sport=None, competition=None, status=None) -> list[Event]: ...
    def get_odds(event_id: str) -> OddsSnapshot: ...
    # Optional:
    def get_markets(event_id: str) -> list[Market]: ...
    def get_live_score(event_id: str) -> dict: ...
    async def stream_odds(event_id: str, interval_seconds=5.0): ...`}</code></pre>

      <table>
        <thead><tr><th>Provider</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>MockProvider</td><td>Fully in-memory, reproducible via seed, no API key needed</td></tr>
        </tbody>
      </table>

      <h3>Building a real provider</h3>
      <p>
        Subclass <code>BaseProvider</code>, implement <code>get_events()</code> and <code>get_odds()</code>, and map your data source's native response objects into the core models. See the <Link href="/docs/quickstart">Quickstart</Link> for a full example using The Odds API.
      </p>

      <h2>Layer 3 — Execution</h2>
      <p>
        An Executor accepts a <code>BetIntent</code> and returns a <code>Position</code>.
        The same agent code runs against the Simulator (paper trading) or a live exchange — just swap the executor.
      </p>

      <pre><code>{`class BaseExecutor(ABC):
    def place(intent: BetIntent) -> Position: ...
    def cancel(position_id: str) -> bool: ...
    def get_position(position_id: str) -> Position: ...
    def get_balance() -> float: ...`}</code></pre>

      <table>
        <thead><tr><th>Executor</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>Simulator</td><td>Paper trading — tracks P&amp;L in memory, supports commission, full settlement helpers</td></tr>
          <tr><td>ExchangeExecutor</td><td>Abstract skeleton with risk guards and dry-run mode for live exchange connectors</td></tr>
        </tbody>
      </table>

      <h3>Risk guards in ExchangeExecutor</h3>
      <ul>
        <li><code>max_single_stake</code> — hard cap on any single bet</li>
        <li><code>max_total_exposure</code> — abort if aggregate open stakes exceed limit</li>
        <li><code>dry_run=True</code> — log intended actions without calling the exchange API</li>
      </ul>

      <h2>Layer 4 — Agents</h2>
      <p>
        An Agent orchestrates the evaluate → place loop. Subclass <code>BaseAgent</code> and implement <code>evaluate()</code>.
        The base class handles fetching, stake clamping, open-position limits, and error recovery.
      </p>

      <pre><code>{`class BaseAgent(ABC):
    def evaluate(event: Event, snapshot: OddsSnapshot) -> BetIntent | None: ...
    def run(sport=None, limit=None) -> list[Position]: ...`}</code></pre>

      <table>
        <thead><tr><th>AgentConfig param</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>bankroll</td><td>1000</td><td>Current balance — used for Kelly sizing</td></tr>
          <tr><td>max_stake_pct</td><td>0.05</td><td>Max 5% of bankroll per bet (safety clamp)</td></tr>
          <tr><td>min_edge_pct</td><td>0.03</td><td>Minimum positive edge required to act</td></tr>
          <tr><td>max_open_positions</td><td>10</td><td>Stop placing when this many positions are open</td></tr>
          <tr><td>sports_filter</td><td>[]</td><td>Empty = all sports; otherwise restrict to listed slugs</td></tr>
          <tr><td>dry_run</td><td>False</td><td>Evaluate but do not call executor.place()</td></tr>
        </tbody>
      </table>

      <h3>Built-in agents</h3>
      <table>
        <thead><tr><th>Agent</th><th>Strategy</th></tr></thead>
        <tbody>
          <tr><td>ValueAgent</td><td>Removes vig from market odds to find fair price, bets where edge &gt; threshold using fractional Kelly sizing</td></tr>
        </tbody>
      </table>

      <h2>End-to-end data flow</h2>
      <pre><code>{`1. provider.get_events(sport="soccer")
      → [Event(Arsenal vs Chelsea, scheduled), ...]

2. provider.get_odds("mock_soccer_000")
      → OddsSnapshot(
          markets=[
            MarketOdds("winner",  [Home@2.10, Draw@3.40, Away@4.20]),
            MarketOdds("totals",  [Over2.5@1.85, Under2.5@1.95]),
            MarketOdds("btts",    [Yes@1.80, No@2.05]),
          ]
        )

3. agent.evaluate(event, snapshot)
      → BetIntent(BACK "Home" @ ≥2.10, stake=47.50)

4. executor.place(intent)
      → Position(id="a3f9b2c1", status=PENDING, oddsTaken=2.10, stake=47.50)

5. (after match) executor.settle_position(pos.id, won=True)
      → Position(status=WON, settlement_value=+52.50)`}</code></pre>

      <h2>Testing strategy</h2>
      <p>
        Every layer can be tested in isolation using <code>MockProvider</code> (deterministic via seed) and <code>Simulator</code> (in-memory, zero I/O).
        No API keys or network access are required for the full test suite.
      </p>

      <pre><code>{`provider = MockProvider(seed=42)   # deterministic
sim      = Simulator(bankroll=1000, verbose=False)
agent    = MyAgent(provider=provider, execution=sim)
positions = agent.run(limit=5)
assert sim.get_balance() >= 0`}</code></pre>
    </>
  );
}
