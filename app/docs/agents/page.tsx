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
          An Agent orchestrates the evaluate-place loop. Subclass <code>BaseAgent</code>,
          implement <code>evaluate()</code>, and the base class handles fetching, stake clamping,
          open-position limits, and error recovery.
        </p>
      </div>

      <h2>Overview</h2>

      <table>
        <thead>
          <tr>
            <th>Class</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>BaseAgent</code></td>
            <td>Abstract base class. Subclass and implement <code>evaluate()</code>.</td>
          </tr>
          <tr>
            <td><code>AgentConfig</code></td>
            <td>Dataclass controlling bankroll, stake sizing, edge threshold, and risk limits.</td>
          </tr>
          <tr>
            <td><code>ValueAgent</code></td>
            <td>Built-in example agent. Bets where offered odds imply positive EV vs the no-vig fair price.</td>
          </tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      <h2>AgentConfig</h2>
      <p>
        Pass an <code>AgentConfig</code> to any agent constructor to control its behaviour.
        All fields have sensible defaults.
      </p>

      <pre><code>{`from opensport.agents.base import AgentConfig

config = AgentConfig(
    bankroll=5_000.0,
    min_edge_pct=0.03,
    max_stake_pct=0.05,
    max_open_positions=10,
    sports_filter=["soccer", "nfl"],
    dry_run=False,
)`}</code></pre>

      <table>
        <thead><tr><th>Parameter</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>bankroll</code></td><td><code>1000.0</code></td><td>Current balance, used for Kelly-based stake sizing.</td></tr>
          <tr><td><code>max_stake_pct</code></td><td><code>0.05</code></td><td>Hard cap: max 5% of bankroll per bet, regardless of Kelly output.</td></tr>
          <tr><td><code>min_edge_pct</code></td><td><code>0.03</code></td><td>Minimum positive edge required before placing (3% = <code>0.03</code>).</td></tr>
          <tr><td><code>max_open_positions</code></td><td><code>10</code></td><td>Stop placing new bets when this many positions are open.</td></tr>
          <tr><td><code>sports_filter</code></td><td><code>[]</code></td><td>Empty list = all sports. Otherwise restrict to the listed slugs.</td></tr>
          <tr><td><code>dry_run</code></td><td><code>False</code></td><td>Evaluate and log but do not call <code>executor.place()</code>.</td></tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      <h2>BaseAgent</h2>

      <pre><code>{`from opensport.agents.base import BaseAgent, AgentConfig
from opensport.core.event import Event
from opensport.core.odds import OddsSnapshot
from opensport.core.position import BetIntent

class MyAgent(BaseAgent):
    def evaluate(self, event: Event, snapshot: OddsSnapshot) -> BetIntent | None:
        # return a BetIntent to place a bet, or None to skip this event
        ...

agent = MyAgent(provider=provider, execution=sim, config=AgentConfig())
positions = agent.run(sport="soccer", limit=20)`}</code></pre>

      <h3>Constructor</h3>
      <table>
        <thead><tr><th>Parameter</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>provider</code></td><td>Any <code>BaseProvider</code> (or <code>MultiProvider</code>).</td></tr>
          <tr><td><code>execution</code></td><td>Any <code>BaseExecutor</code> (<code>Simulator</code> or live exchange).</td></tr>
          <tr><td><code>config</code></td><td><code>AgentConfig</code> instance. Defaults to <code>AgentConfig()</code> if omitted.</td></tr>
        </tbody>
      </table>

      <h3>run()</h3>
      <p>
        Fetches scheduled events, calls <code>evaluate()</code> on each, clamps stakes to{" "}
        <code>max_stake_pct</code>, and calls <code>executor.place()</code>. Returns the list of
        positions placed.
      </p>

      <table>
        <thead><tr><th>Parameter</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>sport</code></td><td><code>None</code></td><td>Sport slug filter. Overrides <code>config.sports_filter</code> for this run.</td></tr>
          <tr><td><code>limit</code></td><td><code>None</code></td><td>Max events to evaluate. Useful in tests and demos.</td></tr>
        </tbody>
      </table>

      <h3>evaluate()</h3>
      <p>
        The one method you must implement. Called once per event. Return a{" "}
        <code>BetIntent</code> to place a bet or <code>None</code> to skip.
      </p>

      <pre><code>{`def evaluate(self, event: Event, snapshot: OddsSnapshot) -> BetIntent | None:
    market = snapshot.market("winner")
    if not market:
        return None
    # Your strategy logic here
    return BetIntent(
        event_id=event.id,
        market_type="winner",
        outcome_label="Home",
        side=Side.BACK,
        stake=50.0,
        min_odds=2.0,
    )`}</code></pre>

      <h3>Helper methods</h3>
      <table>
        <thead><tr><th>Method</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>placed_positions()</code></td><td>Returns all positions placed by this agent instance across all <code>run()</code> calls.</td></tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      <h2>ValueAgent</h2>
      <p>
        The built-in example agent. For each event it evaluates the match-winner market,
        strips the bookmaker&apos;s overround to find fair probabilities, and bets where the
        offered odds imply positive expected value. Stake is sized using fractional Kelly.
      </p>

      <pre><code>{`from opensport.agents.example import ValueAgent

agent = ValueAgent(
    provider=provider,
    execution=sim,
    config=AgentConfig(bankroll=1_000.0, min_edge_pct=0.03),
    market_type="winner",  # which market to evaluate (default: "winner")
    kelly_fraction=0.25,   # quarter-Kelly stake sizing (default: 0.25)
)
positions = agent.run(sport="soccer")`}</code></pre>

      <table>
        <thead><tr><th>Parameter</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>market_type</code></td><td><code>"winner"</code></td><td>Which market slug to look for value in.</td></tr>
          <tr><td><code>kelly_fraction</code></td><td><code>0.25</code></td><td>Kelly multiplier. 0.25 = quarter-Kelly (more conservative).</td></tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      <h2>Strategy helper functions</h2>
      <p>
        Three pure functions are exported from <code>opensport.agents.example</code> for
        use in custom agents.
      </p>

      <h3>remove_vig(market)</h3>
      <p>
        Strips the bookmaker&apos;s overround by proportionally normalising implied probabilities.
        Returns a dict of <code>outcome_label: fair_probability</code>.
      </p>

      <pre><code>{`from opensport.agents.example import remove_vig

snap   = provider.get_odds(event.id)
market = snap.market("winner")
fair   = remove_vig(market)
# {"Home": 0.4762, "Draw": 0.2857, "Away": 0.2381}`}</code></pre>

      <h3>edge(offered_odds, fair_prob)</h3>
      <p>
        Calculates expected value as a fraction: <code>(offered_odds × fair_prob) - 1</code>.
        Positive = value bet, negative = bad value.
      </p>

      <pre><code>{`from opensport.agents.example import edge

e = edge(offered_odds=2.20, fair_prob=0.4762)
# 0.0476  → 4.76% edge`}</code></pre>

      <h3>kelly_stake(bankroll, edge_frac, odds, fraction)</h3>
      <p>
        Fractional Kelly criterion stake sizing.
      </p>

      <pre><code>{`from opensport.agents.example import kelly_stake

stake = kelly_stake(
    bankroll=1_000.0,
    edge_frac=0.0476,   # 4.76% edge
    odds=2.20,
    fraction=0.25,      # quarter-Kelly
)
# 27.50`}</code></pre>

      {/* ------------------------------------------------------------------ */}
      <h2>Building a custom agent</h2>
      <p>
        Subclass <code>BaseAgent</code> and implement <code>evaluate()</code>. Replace{" "}
        <code>remove_vig</code> with your own model to build a real strategy.
      </p>

      <pre><code>{`from opensport.agents.base import BaseAgent, AgentConfig
from opensport.agents.example import remove_vig, edge, kelly_stake
from opensport.core.event import Event
from opensport.core.odds import OddsSnapshot
from opensport.core.position import BetIntent, Side
from opensport.core.market import MarketType

class MyModelAgent(BaseAgent):
    """
    Replace remove_vig with your own probability model.
    """

    def evaluate(self, event: Event, snapshot: OddsSnapshot) -> BetIntent | None:
        market = snapshot.market(MarketType.WINNER)
        if not market:
            return None

        # Swap this for your model's probabilities
        fair_probs = remove_vig(market)

        best = None
        for outcome in market.outcomes:
            if not outcome.is_available:
                continue
            fair_p = fair_probs.get(outcome.label, 0.0)
            e = edge(outcome.decimal_odds, fair_p)
            if e >= self.config.min_edge_pct:
                if best is None or e > best[1]:
                    best = (outcome, e)

        if best is None:
            return None

        chosen, chosen_edge = best
        stake = kelly_stake(
            bankroll=self.config.bankroll,
            edge_frac=chosen_edge,
            odds=chosen.decimal_odds,
            fraction=0.25,
        )
        if stake < 1.0:
            return None

        return BetIntent(
            event_id=event.id,
            market_type=MarketType.WINNER,
            outcome_label=chosen.label,
            side=Side.BACK,
            stake=stake,
            min_odds=chosen.decimal_odds,
        )`}</code></pre>

      <p>
        See the <Link href="/docs/execution">Execution reference</Link> for how positions are
        settled, and the <Link href="/docs/mcp">MCP Server</Link> to expose your agent&apos;s
        data to any LLM host.
      </p>
    </>
  );
}
