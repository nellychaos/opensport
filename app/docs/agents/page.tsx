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
          An Agent orchestrates the evaluate → place loop. Subclass <code>BaseAgent</code>,
          implement <code>evaluate()</code>, and the framework handles fetching, position limits,
          stake sizing, and error recovery.
        </p>
      </div>

      <h2>BaseAgent interface</h2>
      <p>
        Subclass <code>BaseAgent</code> and implement one method: <code>evaluate()</code>.
        Return a <code>BetIntent</code> to place a bet, or <code>None</code> to pass on the event.
      </p>

      <pre><code>{`# python/opensport/agents/base.py
from abc import ABC, abstractmethod
from opensport.core.event import Event
from opensport.core.odds import OddsSnapshot
from opensport.core.position import BetIntent, Position
from opensport.providers.base import BaseProvider
from opensport.execution.base import BaseExecutor

class BaseAgent(ABC):

    def __init__(
        self,
        provider: BaseProvider,
        execution: BaseExecutor,
        config: AgentConfig | None = None,
    ): ...

    @abstractmethod
    def evaluate(
        self,
        event: Event,
        snapshot: OddsSnapshot,
    ) -> BetIntent | None:
        """Return a BetIntent to place, or None to skip this event."""
        ...

    def run(
        self,
        sport: str | None = None,
        limit: int | None = None,
    ) -> list[Position]:
        """Fetch events, evaluate each, place qualifying bets. Returns all positions placed."""
        ...`}</code></pre>

      <pre><code>{`// typescript/src/agents/base.ts
export abstract class BaseAgent {
  constructor(
    protected provider: IProvider,
    protected execution: IExecutor,
    protected config: AgentConfig,
  ) {}

  abstract evaluate(
    event: Event,
    snapshot: OddsSnapshot,
  ): Promise<BetIntent | null>;

  async run(params?: { sport?: string; limit?: number }): Promise<Position[]>;
}`}</code></pre>

      <h2>AgentConfig</h2>
      <p>
        Pass an <code>AgentConfig</code> to control risk limits, filters, and dry-run behaviour.
        All fields have sensible defaults — you only need to override what you care about.
      </p>

      <table>
        <thead><tr><th>Parameter</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>bankroll</td><td>float</td><td>1000.0</td><td>Current balance used as the basis for Kelly stake sizing.</td></tr>
          <tr><td>max_stake_pct</td><td>float</td><td>0.05</td><td>Maximum stake as a fraction of bankroll (e.g. <code>0.05</code> = 5%). Acts as a hard clamp after Kelly sizing.</td></tr>
          <tr><td>min_edge_pct</td><td>float</td><td>0.03</td><td>Minimum positive edge required to emit a <code>BetIntent</code>. Edge below this threshold results in <code>None</code>.</td></tr>
          <tr><td>max_open_positions</td><td>int</td><td>10</td><td>Stop placing bets when this many positions are currently open.</td></tr>
          <tr><td>sports_filter</td><td>list[str]</td><td>[]</td><td>Restrict evaluation to these sport slugs. Empty list = evaluate all sports.</td></tr>
          <tr><td>dry_run</td><td>bool</td><td>False</td><td>Evaluate and log, but do not call <code>executor.place()</code>. Useful for monitoring without risk.</td></tr>
        </tbody>
      </table>

      <pre><code>{`from opensport.agents.base import AgentConfig

config = AgentConfig(
    bankroll=5_000.0,
    max_stake_pct=0.03,    # max 3% per bet
    min_edge_pct=0.05,     # only act on 5%+ edge
    max_open_positions=5,
    sports_filter=["soccer", "tennis"],
    dry_run=False,
)`}</code></pre>

      <h2>ValueAgent</h2>
      <p>
        <code>ValueAgent</code> is the built-in reference agent. It finds fair prices by removing
        the bookmaker&apos;s vig (overround), then bets where the market offers positive expected value
        above the configured threshold.
      </p>

      <h3>Strategy</h3>
      <ol className="list-decimal list-inside space-y-1 mb-4 text-stone-600">
        <li>Fetch all winner-market odds from the snapshot.</li>
        <li>Normalise each implied probability to sum to 1.0 (removing vig).</li>
        <li>Compute fair decimal odds: <code>fair = 1 / fair_prob</code>.</li>
        <li>Compute edge: <code>edge = (market_odds / fair_odds) − 1</code>.</li>
        <li>If edge &gt; <code>min_edge_pct</code>, size stake using fractional Kelly.</li>
        <li>Return a <code>BetIntent</code> for the best-value outcome; otherwise <code>None</code>.</li>
      </ol>

      <pre><code>{`# python/opensport/agents/example.py
from opensport.agents.base import BaseAgent, AgentConfig
from opensport.core.event import Event
from opensport.core.odds import OddsSnapshot
from opensport.core.position import BetIntent, Side

class ValueAgent(BaseAgent):

    def evaluate(self, event: Event, snapshot: OddsSnapshot) -> BetIntent | None:
        winner = snapshot.get_market("winner")
        if not winner:
            return None

        # Remove vig: normalise implied probabilities to 1.0
        raw_probs = [1 / o.decimal_odds for o in winner.outcomes]
        overround = sum(raw_probs)
        fair_probs = [p / overround for p in raw_probs]

        best_intent = None
        best_edge = 0.0

        for outcome, fair_prob in zip(winner.outcomes, fair_probs):
            fair_odds = 1 / fair_prob
            edge = (outcome.decimal_odds / fair_odds) - 1.0

            if edge > self.config.min_edge_pct and edge > best_edge:
                stake = self._kelly_stake(
                    odds=outcome.decimal_odds,
                    fair_prob=fair_prob,
                )
                best_intent = BetIntent(
                    event_id=event.id,
                    market_type="winner",
                    outcome_label=outcome.label,
                    side=Side.BACK,
                    stake=stake,
                    min_odds=outcome.decimal_odds,
                    notes=f"edge={edge:.1%} fair={fair_odds:.3f}",
                )
                best_edge = edge

        return best_intent

    def _kelly_stake(self, odds: float, fair_prob: float) -> float:
        """Fractional Kelly: size = (edge / (odds − 1)) × bankroll × fraction."""
        edge = (odds * fair_prob) - 1
        full_kelly = edge / (odds - 1)
        fraction = 0.25   # quarter-Kelly for variance reduction
        raw = full_kelly * fraction * self.config.bankroll
        max_stake = self.config.bankroll * self.config.max_stake_pct
        return min(raw, max_stake)`}</code></pre>

      <h3>Running ValueAgent</h3>
      <pre><code>{`from opensport.providers.mock import MockProvider
from opensport.execution.simulator import Simulator
from opensport.agents.example import ValueAgent
from opensport.agents.base import AgentConfig

provider = MockProvider(seed=42)
sim      = Simulator(bankroll=1_000.0, commission=0.05)
config   = AgentConfig(min_edge_pct=0.02, max_stake_pct=0.05)
agent    = ValueAgent(provider=provider, execution=sim, config=config)

positions = agent.run()
sim.print_summary()`}</code></pre>

      <h2>Building a custom agent</h2>
      <p>
        Any strategy that can be expressed as a function of <code>(Event, OddsSnapshot) → BetIntent | None</code>
        can be implemented as an opensport agent. Here is a minimal template:
      </p>

      <pre><code>{`from opensport.agents.base import BaseAgent, AgentConfig
from opensport.core.event import Event
from opensport.core.odds import OddsSnapshot
from opensport.core.position import BetIntent, Side

class MyAgent(BaseAgent):
    """
    Example: back the home team whenever their odds exceed a fixed threshold.
    """

    THRESHOLD_ODDS = 2.50

    def evaluate(self, event: Event, snapshot: OddsSnapshot) -> BetIntent | None:
        winner = snapshot.get_market("winner")
        if not winner:
            return None

        home = next((o for o in winner.outcomes if o.label == "Home"), None)
        if home is None or home.decimal_odds < self.THRESHOLD_ODDS:
            return None

        stake = self.config.bankroll * self.config.max_stake_pct

        return BetIntent(
            event_id=event.id,
            market_type="winner",
            outcome_label="Home",
            side=Side.BACK,
            stake=stake,
            min_odds=self.THRESHOLD_ODDS,
            notes=f"Odds {home.decimal_odds:.2f} above threshold {self.THRESHOLD_ODDS}",
        )`}</code></pre>

      <pre><code>{`# Plug in your agent exactly as you would ValueAgent
from opensport.providers.mock import MockProvider
from opensport.execution.simulator import Simulator
from opensport.agents.base import AgentConfig

provider = MockProvider()
sim      = Simulator(bankroll=1_000.0)
config   = AgentConfig(sports_filter=["soccer"])
agent    = MyAgent(provider=provider, execution=sim, config=config)

positions = agent.run(limit=20)
sim.print_summary()`}</code></pre>

      <h2>Using agents with LLMs</h2>
      <p>
        The <code>BaseAgent</code> interface is designed to be called by an LLM orchestrator.
        <code>evaluate()</code> and <code>run()</code> accept and return structured Python objects,
        making them straightforward to wrap as tools in any agent framework (LangChain, LlamaIndex,
        Claude tool use, etc.).
      </p>

      <pre><code>{`# Example: expose opensport as a tool in a Claude agent
import anthropic
import json
from opensport.providers.mock import MockProvider
from opensport.execution.simulator import Simulator
from opensport.agents.example import ValueAgent

provider = MockProvider(seed=42)
sim      = Simulator(bankroll=1_000.0)
agent    = ValueAgent(provider=provider, execution=sim)

tools = [
    {
        "name": "run_agent",
        "description": "Run the opensport ValueAgent and return placed positions.",
        "input_schema": {
            "type": "object",
            "properties": {
                "sport": {"type": "string", "description": "Sport slug to filter (optional)"},
                "limit": {"type": "integer", "description": "Max events to evaluate"},
            },
        },
    },
    {
        "name": "get_balance",
        "description": "Return the current simulator balance.",
        "input_schema": {"type": "object", "properties": {}},
    },
]

def handle_tool(name: str, inputs: dict) -> str:
    if name == "run_agent":
        positions = agent.run(**inputs)
        return json.dumps([p.to_dict() for p in positions])
    if name == "get_balance":
        return str(sim.get_balance())
    return "unknown tool"`}</code></pre>

      <p>
        See the <Link href="/docs/quickstart">Quickstart</Link> for end-to-end runnable examples,
        or the <Link href="/docs/execution">Execution reference</Link> to understand how
        <code>BetIntent</code> objects are processed once your agent emits them.
      </p>
    </>
  );
}
