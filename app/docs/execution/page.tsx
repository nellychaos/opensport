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
          An Executor accepts a <code>BetIntent</code> and returns a <code>Position</code>.
          Swap <code>Simulator</code> for a live exchange without changing your agent code.
        </p>
      </div>

      <h2>Overview</h2>

      <table>
        <thead>
          <tr>
            <th>Executor</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>Simulator</code></td>
            <td>Paper trading: tracks P&amp;L in memory. No API key, no network.</td>
          </tr>
          <tr>
            <td><code>ExchangeExecutor</code></td>
            <td>Abstract skeleton for live exchange connectors. Subclass and implement three API methods.</td>
          </tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      <h2>Core models</h2>

      <h3>BetIntent</h3>
      <p>
        Created by an agent and passed to an executor. Expresses what the agent <em>wants</em> to do
        but does not commit any funds.
      </p>

      <table>
        <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>event_id</code></td><td>str</td><td>Event ID as returned by a provider.</td></tr>
          <tr><td><code>market_type</code></td><td>str</td><td>Market slug, e.g. <code>"winner"</code>, <code>"totals"</code>.</td></tr>
          <tr><td><code>outcome_label</code></td><td>str</td><td>Outcome label, e.g. <code>"Home"</code>, <code>"Over"</code>.</td></tr>
          <tr><td><code>side</code></td><td>Side</td><td><code>Side.BACK</code> (traditional bet) or <code>Side.LAY</code> (exchange).</td></tr>
          <tr><td><code>stake</code></td><td>float</td><td>Amount to wager in the account&apos;s base currency.</td></tr>
          <tr><td><code>min_odds</code></td><td>float</td><td>Refuse execution if offered odds fall below this value.</td></tr>
          <tr><td><code>max_odds</code></td><td>float?</td><td>Optional ceiling (useful for exchange limit orders).</td></tr>
          <tr><td><code>line</code></td><td>float?</td><td>Handicap or total line when relevant.</td></tr>
          <tr><td><code>notes</code></td><td>str?</td><td>Agent&apos;s reasoning, preserved for logging and explainability.</td></tr>
        </tbody>
      </table>

      <h3>Position</h3>
      <p>
        Created by an executor after accepting a <code>BetIntent</code>. Records the actual odds taken
        and is updated to <code>WON</code>, <code>LOST</code>, or <code>VOID</code> on settlement.
      </p>

      <table>
        <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>id</code></td><td>str</td><td>Auto-generated 8-character UUID prefix.</td></tr>
          <tr><td><code>event_id</code></td><td>str</td><td>Event the bet was placed on.</td></tr>
          <tr><td><code>market_type</code></td><td>str</td><td>Market slug.</td></tr>
          <tr><td><code>outcome_label</code></td><td>str</td><td>Outcome backed or laid.</td></tr>
          <tr><td><code>side</code></td><td>Side</td><td><code>BACK</code> or <code>LAY</code>.</td></tr>
          <tr><td><code>stake</code></td><td>float</td><td>Amount wagered.</td></tr>
          <tr><td><code>odds_taken</code></td><td>float</td><td>Actual decimal odds at execution.</td></tr>
          <tr><td><code>placed_at</code></td><td>datetime</td><td>UTC timestamp of placement.</td></tr>
          <tr><td><code>status</code></td><td>PositionStatus</td><td><code>PENDING</code>, <code>WON</code>, <code>LOST</code>, <code>VOID</code>, <code>CASHOUT</code>.</td></tr>
          <tr><td><code>settlement_value</code></td><td>float?</td><td>Net P&amp;L after settlement (positive = profit, negative = loss).</td></tr>
          <tr><td><code>settled_at</code></td><td>datetime?</td><td>UTC timestamp of settlement.</td></tr>
          <tr><td><code>notes</code></td><td>str?</td><td>Forwarded from BetIntent.</td></tr>
        </tbody>
      </table>

      <p>Computed properties on <code>Position</code>:</p>

      <table>
        <thead><tr><th>Property</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>potential_profit</code></td><td><code>stake × (odds_taken - 1)</code></td></tr>
          <tr><td><code>potential_return</code></td><td><code>stake × odds_taken</code></td></tr>
          <tr><td><code>is_open()</code></td><td><code>True</code> when status is <code>PENDING</code></td></tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      <h2>Simulator</h2>
      <p>
        Paper trading engine. Fills every <code>BetIntent</code> at <code>min_odds</code>
        (conservative fill — no slippage improvement). All state is in memory.
      </p>

      <pre><code>{`from opensport.execution.simulator import Simulator

sim = Simulator(bankroll=1_000.0, commission_rate=0.05, verbose=True)`}</code></pre>

      <table>
        <thead><tr><th>Parameter</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>bankroll</code></td><td><code>1000.0</code></td><td>Starting balance.</td></tr>
          <tr><td><code>commission_rate</code></td><td><code>0.0</code></td><td>Commission on net profit (0.0–1.0). E.g. <code>0.05</code> = 5% Betfair-style.</td></tr>
          <tr><td><code>verbose</code></td><td><code>True</code></td><td>Log each action at INFO level.</td></tr>
        </tbody>
      </table>

      <h3>Methods</h3>

      <table>
        <thead><tr><th>Method</th><th>Returns</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>place(intent)</code></td><td>Position</td><td>Fill the intent. Debits stake from balance. Raises <code>InsufficientFundsError</code> or <code>OddsMovedError</code>.</td></tr>
          <tr><td><code>cancel(position_id)</code></td><td>bool</td><td>Cancel an open position. Refunds stake. Returns <code>False</code> if already settled.</td></tr>
          <tr><td><code>get_position(position_id)</code></td><td>Position</td><td>Look up a position by ID.</td></tr>
          <tr><td><code>get_balance()</code></td><td>float</td><td>Current balance.</td></tr>
          <tr><td><code>get_all_positions()</code></td><td>list[Position]</td><td>All positions (open and settled).</td></tr>
          <tr><td><code>get_open_positions()</code></td><td>list[Position]</td><td>Only positions with <code>PENDING</code> status.</td></tr>
          <tr><td><code>settle_position(id, won)</code></td><td>Position</td><td>Settle an individual position. Credits balance if won.</td></tr>
          <tr><td><code>settle_event(event_id, results)</code></td><td>list[Position]</td><td>Bulk-settle all open positions on an event.</td></tr>
          <tr><td><code>total_exposure()</code></td><td>float</td><td>Sum of stakes across all open positions.</td></tr>
          <tr><td><code>realized_pnl()</code></td><td>float</td><td>Net profit/loss across all settled positions.</td></tr>
          <tr><td><code>summary()</code></td><td>dict</td><td>Stats dict: balance, P&amp;L, ROI, win rate, exposure.</td></tr>
          <tr><td><code>print_summary()</code></td><td>None</td><td>Print a formatted summary to stdout.</td></tr>
        </tbody>
      </table>

      <h3>Settlement examples</h3>

      <pre><code>{`# Settle one position
sim.settle_position(pos.id, won=True)

# Bulk-settle an entire event
sim.settle_event("mock_soccer_000", {
    "Home": True,
    "Draw": False,
    "Away": False,
})

# Cancel an open position (refunds stake)
sim.cancel(pos.id)`}</code></pre>

      {/* ------------------------------------------------------------------ */}
      <h2>ExchangeExecutor</h2>
      <p>
        Abstract skeleton for live exchange connectors. Provides logging, risk guards, and
        position tracking. Subclasses only need to implement three API methods.
      </p>

      <pre><code>{`from opensport.execution.exchange import ExchangeExecutor
from opensport.core.position import BetIntent, Position

class MyExchangeExecutor(ExchangeExecutor):
    name = "my_exchange"

    def _api_place_bet(self, intent: BetIntent) -> Position:
        # call your exchange's order placement API
        # map the response to a Position and return it
        ...

    def _api_cancel_order(self, position_id: str) -> bool:
        # call your exchange's cancellation API
        # return True if cancelled, False if already matched
        ...

    def _api_get_balance(self) -> float:
        # call your exchange's balance endpoint
        ...`}</code></pre>

      <table>
        <thead><tr><th>Parameter</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>api_key</code></td><td>env var</td><td>Exchange API key. Falls back to <code>OPENSPORT_EXCHANGE_API_KEY</code>.</td></tr>
          <tr><td><code>max_single_stake</code></td><td><code>100.0</code></td><td>Hard cap on any single bet stake.</td></tr>
          <tr><td><code>max_total_exposure</code></td><td><code>1000.0</code></td><td>Abort if aggregate open stakes would exceed this amount.</td></tr>
          <tr><td><code>dry_run</code></td><td><code>True</code></td><td>Log intended actions without calling the exchange API. Set to <code>False</code> only when ready for live execution.</td></tr>
        </tbody>
      </table>

      <p>
        The <code>dry_run</code> default is <code>True</code> intentionally. You must explicitly
        set <code>dry_run=False</code> to place real bets.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>BaseExecutor interface</h2>
      <p>
        Implement <code>BaseExecutor</code> directly if you need full control without the
        <code>ExchangeExecutor</code> plumbing.
      </p>

      <pre><code>{`from opensport.execution.base import BaseExecutor
from opensport.core.position import BetIntent, Position

class BaseExecutor(ABC):
    name: str = "base"

    def place(intent: BetIntent) -> Position: ...
    def cancel(position_id: str) -> bool: ...
    def get_position(position_id: str) -> Position: ...
    def get_balance() -> float: ...

    # Optional helpers with default implementations:
    def get_all_positions() -> list[Position]: ...
    def get_open_positions() -> list[Position]: ...
    def total_exposure() -> float: ...
    def realized_pnl() -> float: ...`}</code></pre>

      {/* ------------------------------------------------------------------ */}
      <h2>Exceptions</h2>

      <table>
        <thead><tr><th>Exception</th><th>When raised</th></tr></thead>
        <tbody>
          <tr><td><code>ExecutionError</code></td><td>Base class for all execution failures.</td></tr>
          <tr><td><code>InsufficientFundsError</code></td><td>Stake exceeds available balance.</td></tr>
          <tr><td><code>OddsMovedError</code></td><td>Available odds dropped below <code>intent.min_odds</code>.</td></tr>
          <tr><td><code>PositionNotFoundError</code></td><td>Position ID does not exist in the executor.</td></tr>
        </tbody>
      </table>

      <pre><code>{`from opensport.execution.base import InsufficientFundsError, OddsMovedError

try:
    pos = sim.place(intent)
except InsufficientFundsError:
    print("Not enough balance")
except OddsMovedError:
    print("Odds dropped — intent rejected")`}</code></pre>

      <p>
        See the <Link href="/docs/agents">Agents reference</Link> for how agents wire together
        providers and executors, and the <Link href="/docs/architecture">Architecture guide</Link>{" "}
        for the full system overview.
      </p>
    </>
  );
}
