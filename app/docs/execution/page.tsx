import type { Metadata } from "next";
import Link from "next/link";

const title = "Execution";
export const metadata: Metadata = { title };

export default function Page() {
  return (
    <>
      <div className="mb-8">
        <span className="text-xs font-semibold text-amber-600 uppercase tracking-widest">Reference</span>
        <h1 className="text-3xl font-bold text-stone-900 mt-2 mb-3">{title}</h1>
        <p className="text-stone-500 text-lg leading-relaxed">
          An Executor accepts a <code>BetIntent</code> from your agent and converts it into a <code>Position</code>.
          Switch between paper trading and live exchange by swapping one line of code.
        </p>
      </div>

      <h2>BaseExecutor interface</h2>
      <p>
        All executors implement <code>BaseExecutor</code> (Python) or <code>IExecutor</code> (TypeScript).
        The interface is intentionally minimal — four methods cover the full lifecycle of a position.
      </p>

      <pre><code>{`# python/opensport/execution/base.py
from abc import ABC, abstractmethod
from opensport.core.position import BetIntent, Position

class BaseExecutor(ABC):

    @abstractmethod
    def place(self, intent: BetIntent) -> Position: ...

    @abstractmethod
    def cancel(self, position_id: str) -> bool: ...

    @abstractmethod
    def get_position(self, position_id: str) -> Position: ...

    @abstractmethod
    def get_balance(self) -> float: ...`}</code></pre>

      <pre><code>{`// typescript/src/execution/base.ts
export interface IExecutor {
  place(intent: BetIntent): Promise<Position>;
  cancel(positionId: string): Promise<boolean>;
  getPosition(positionId: string): Promise<Position>;
  getBalance(): Promise<number>;
}`}</code></pre>

      <h2>BetIntent</h2>
      <p>
        <code>BetIntent</code> is the instruction your agent passes to the executor.
        It expresses what you want to do, not whether it succeeded.
      </p>

      <table>
        <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>event_id</td><td>str</td><td>Yes</td><td>ID of the event to bet on.</td></tr>
          <tr><td>market_type</td><td>str</td><td>Yes</td><td>Market slug (e.g. <code>"winner"</code>, <code>"totals"</code>).</td></tr>
          <tr><td>outcome_label</td><td>str</td><td>Yes</td><td>Outcome within the market (e.g. <code>"Home"</code>, <code>"Over 2.5"</code>).</td></tr>
          <tr><td>side</td><td>Side</td><td>Yes</td><td><code>Side.BACK</code> (for a win) or <code>Side.LAY</code> (against, exchange only).</td></tr>
          <tr><td>stake</td><td>float</td><td>Yes</td><td>Amount to risk in base currency units.</td></tr>
          <tr><td>min_odds</td><td>float</td><td>Yes</td><td>Minimum acceptable decimal odds. Executor rejects if market has moved through this price.</td></tr>
          <tr><td>notes</td><td>str</td><td>No</td><td>Free-text label attached to the position record for debugging and logs.</td></tr>
        </tbody>
      </table>

      <pre><code>{`from opensport.core.position import BetIntent, Side

intent = BetIntent(
    event_id="mock_soccer_000",
    market_type="winner",
    outcome_label="Home",
    side=Side.BACK,
    stake=50.0,
    min_odds=2.10,
    notes="ValueAgent edge: +4.2%",
)`}</code></pre>

      <h2>Position</h2>
      <p>
        A <code>Position</code> is the record returned by <code>place()</code> and updated by <code>settle_position()</code>.
      </p>

      <table>
        <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>id</td><td>str</td><td>Unique position identifier (UUID).</td></tr>
          <tr><td>intent</td><td>BetIntent</td><td>The original intent that created this position.</td></tr>
          <tr><td>odds_taken</td><td>float</td><td>Decimal odds at which the bet was matched.</td></tr>
          <tr><td>status</td><td>PositionStatus</td><td><code>PENDING</code> → <code>WON</code> / <code>LOST</code> / <code>VOID</code>.</td></tr>
          <tr><td>placed_at</td><td>datetime</td><td>Timestamp when <code>place()</code> was called.</td></tr>
          <tr><td>settled_at</td><td>datetime | None</td><td>Timestamp of settlement, or None if still open.</td></tr>
          <tr><td>settlement_value</td><td>float | None</td><td>Net P&L after commission. Positive = profit, negative = loss.</td></tr>
        </tbody>
      </table>

      <h2>Simulator</h2>
      <p>
        <code>Simulator</code> is the built-in paper trading executor.
        All state is held in memory — no network calls, no API keys, instant settlement.
        Use it for backtesting, agent development, and unit tests.
      </p>

      <pre><code>{`from opensport.execution.simulator import Simulator

sim = Simulator(bankroll=1_000.0, commission=0.05, verbose=True)

# Place a bet
pos = sim.place(intent)
print(sim.get_balance())   # 950.0 — stake deducted

# Settle it
sim.settle_position(pos.id, won=True)
print(sim.get_balance())   # 1055.0 — (stake × odds) − commission credited

# Summary
sim.print_summary()`}</code></pre>

      <table>
        <thead><tr><th>Constructor param</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>bankroll</td><td>float</td><td>1000.0</td><td>Starting balance in base currency units.</td></tr>
          <tr><td>commission</td><td>float</td><td>0.0</td><td>Commission rate applied to winning positions (e.g. <code>0.05</code> = 5%).</td></tr>
          <tr><td>verbose</td><td>bool</td><td>False</td><td>Log each place/settle/cancel action to stdout.</td></tr>
        </tbody>
      </table>

      <h3>Simulator methods</h3>
      <table>
        <thead><tr><th>Method</th><th>Returns</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>place(intent)</td><td>Position</td><td>Validates min_odds, deducts stake, returns a PENDING position.</td></tr>
          <tr><td>cancel(position_id)</td><td>bool</td><td>Voids an open position and refunds the stake. Returns False if already settled.</td></tr>
          <tr><td>settle_position(id, won)</td><td>Position</td><td>Marks position WON or LOST and credits/debits balance accordingly.</td></tr>
          <tr><td>settle_position_by_id(id, won)</td><td>Position</td><td>Alias for TypeScript naming consistency.</td></tr>
          <tr><td>get_position(id)</td><td>Position</td><td>Retrieve a position record by ID.</td></tr>
          <tr><td>get_balance()</td><td>float</td><td>Current available balance (bankroll − open stakes + settled credits).</td></tr>
          <tr><td>get_positions()</td><td>list[Position]</td><td>All positions — open and settled.</td></tr>
          <tr><td>get_open_positions()</td><td>list[Position]</td><td>Only PENDING positions.</td></tr>
          <tr><td>print_summary()</td><td>None</td><td>Prints a formatted P&L table to stdout.</td></tr>
          <tr><td>reset()</td><td>None</td><td>Clear all positions and restore original bankroll. Useful in test teardown.</td></tr>
        </tbody>
      </table>

      <h2>ExchangeExecutor</h2>
      <p>
        <code>ExchangeExecutor</code> is an abstract base for connecting a live exchange or bookmaker API.
        Subclass it and implement three private methods — the executor handles risk guards,
        balance tracking, dry-run mode, and logging automatically.
      </p>

      <pre><code>{`from opensport.execution.exchange import ExchangeExecutor
from opensport.core.position import BetIntent, Position

class BetfairExecutor(ExchangeExecutor):
    name = "betfair"

    def __init__(self, api_client, **kwargs):
        super().__init__(**kwargs)
        self._api = api_client

    def _api_place_bet(self, intent: BetIntent) -> dict:
        """Call exchange API and return raw order response."""
        return self._api.betting.place_orders(
            market_id=intent.event_id,
            instructions=[{
                "selectionId": intent.outcome_label,
                "side": "BACK",
                "orderType": "LIMIT",
                "limitOrder": {"size": intent.stake, "price": intent.min_odds},
            }]
        )

    def _api_cancel_order(self, position_id: str) -> bool:
        """Cancel an open order. Return True on success."""
        result = self._api.betting.cancel_orders(bet_ids=[position_id])
        return len(result.get("instructionReports", [])) > 0

    def _api_get_balance(self) -> float:
        """Return current available balance from the exchange."""
        funds = self._api.account.get_account_funds()
        return funds["availableToBetBalance"]`}</code></pre>

      <pre><code>{`executor = BetfairExecutor(
    api_client=betfair_client,
    max_single_stake=200.0,
    max_total_exposure=1_000.0,
    dry_run=True,         # logs but never calls _api_place_bet
)`}</code></pre>

      <h3>Risk guards</h3>
      <p>
        Risk guards run <em>before</em> <code>_api_place_bet()</code> is called.
        A <code>RiskError</code> is raised if any guard fires — the position is never created.
      </p>

      <table>
        <thead><tr><th>Parameter</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>max_single_stake</td><td>float | None</td><td>None</td><td>Hard cap on any single bet stake. Intent is rejected if stake exceeds this.</td></tr>
          <tr><td>max_total_exposure</td><td>float | None</td><td>None</td><td>Abort if sum of all open stakes exceeds this limit.</td></tr>
          <tr><td>dry_run</td><td>bool</td><td>False</td><td>Run full validation and log the intent, but never call the exchange API.</td></tr>
          <tr><td>min_odds_buffer</td><td>float</td><td>0.0</td><td>Additional buffer subtracted from intent.min_odds before matching. Provides slippage protection.</td></tr>
        </tbody>
      </table>

      <h2>Switching between Simulator and Exchange</h2>
      <p>
        Because both executors share the <code>BaseExecutor</code> interface, switching is a
        single-line change in your setup code — agent logic is untouched.
      </p>

      <pre><code>{`# Development / testing
from opensport.execution.simulator import Simulator
executor = Simulator(bankroll=10_000.0)

# Production
from my_integrations import BetfairExecutor
executor = BetfairExecutor(api_client=client, max_single_stake=500.0)

# Agent code is identical either way
agent = ValueAgent(provider=provider, execution=executor, config=config)
positions = agent.run()`}</code></pre>

      <p>
        Read the <Link href="/docs/architecture">Architecture guide</Link> for how the execution layer
        fits into the full stack, or the <Link href="/docs/agents">Agents reference</Link> to see how
        agents construct and pass <code>BetIntent</code> objects.
      </p>
    </>
  );
}
