import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Quickstart" };

export default function QuickstartPage() {
  return (
    <>
      <div className="mb-8">
        <span className="text-xs font-semibold text-amber-600 uppercase tracking-widest">Getting started</span>
        <h1 className="text-3xl font-bold text-stone-900 mt-2 mb-3">Quickstart</h1>
        <p className="text-stone-500 text-lg leading-relaxed">
          From zero to your first simulated position in under five minutes.
          No API keys, no account setup, no real money.
        </p>
      </div>

      <h2>Python</h2>

      <h3>1. Install</h3>
      <pre><code>{`cd Opensport/python
pip install -r requirements.txt`}</code></pre>

      <h3>2. Run the example agent</h3>
      <pre><code>{`import logging
logging.basicConfig(level=logging.INFO)

from opensport.providers.mock import MockProvider
from opensport.execution.simulator import Simulator
from opensport.agents.example import ValueAgent
from opensport.agents.base import AgentConfig

provider = MockProvider()
sim      = Simulator(bankroll=1_000.0)
config   = AgentConfig(min_edge_pct=0.02, max_stake_pct=0.05)
agent    = ValueAgent(provider=provider, execution=sim, config=config)

positions = agent.run()
sim.print_summary()`}</code></pre>

      <h3>3. Explore events and odds manually</h3>
      <pre><code>{`from opensport.providers.mock import MockProvider
from opensport.utils.helpers import format_odds_table

provider = MockProvider()

for event in provider.get_events():
    print(event)

soccer = provider.get_events(sport="soccer")
snap   = provider.get_odds(soccer[0].id)
print(format_odds_table(snap))`}</code></pre>

      <h3>4. Place and settle a bet manually</h3>
      <pre><code>{`from opensport.core.position import BetIntent, Side
from opensport.execution.simulator import Simulator

sim = Simulator(bankroll=500.0)

intent = BetIntent(
    event_id="mock_soccer_000",
    market_type="winner",
    outcome_label="Home",
    side=Side.BACK,
    stake=50.0,
    min_odds=2.10,
    notes="Backing the home side",
)

pos = sim.place(intent)
print(f"Balance after placing: {sim.get_balance():.2f}")

sim.settle_position(pos.id, won=True)
print(f"Balance after win: {sim.get_balance():.2f}")
sim.print_summary()`}</code></pre>

      <h3>5. Run the test suite</h3>
      <pre><code>{`pytest tests/ -v`}</code></pre>

      <h2>TypeScript</h2>

      <h3>1. Install</h3>
      <pre><code>{`cd Opensport/typescript
npm install`}</code></pre>

      <h3>2. Run a quick demo</h3>
      <pre><code>{`// demo.ts
import { MockProvider } from "./src/providers/mock.js";
import { Simulator } from "./src/execution/simulator.js";
import { MarketType, getMarket } from "./src/index.js";

const provider = new MockProvider();
const sim = new Simulator(1000, 0, true);

const events = await provider.getEvents({ sport: "soccer" });
const snap   = await provider.getOdds(events[0].id);
const winner = getMarket(snap, MarketType.WINNER);

if (winner) {
  const homeOdds = winner.outcomes.find(o => o.label === "Home");
  if (homeOdds) {
    const pos = await sim.place({
      eventId: events[0].id,
      marketType: MarketType.WINNER,
      outcomeLabel: "Home",
      side: "back",
      stake: 50,
      minOdds: homeOdds.decimalOdds,
    });
    sim.settlePositionById(pos.id, true);
  }
}
sim.printSummary();`}</code></pre>

      <pre><code>{`npx tsx demo.ts`}</code></pre>

      <h3>3. Run tests</h3>
      <pre><code>{`npm test`}</code></pre>

      <h2>Connecting a real provider</h2>
      <p>
        Swap <code>MockProvider</code> for a real data source by implementing <code>BaseProvider</code>.
        Your agent code stays identical.
      </p>
      <pre><code>{`from opensport.providers.base import BaseProvider
from opensport.core.event import Event
from opensport.core.odds import OddsSnapshot
import httpx

class TheOddsApiProvider(BaseProvider):
    name = "the_odds_api"

    def __init__(self, api_key: str):
        self._client = httpx.Client(
            base_url="https://api.the-odds-api.com/v4",
            params={"apiKey": api_key},
        )

    def get_events(self, sport=None, **_) -> list[Event]:
        resp = self._client.get(f"/sports/{sport}/events")
        resp.raise_for_status()
        return [self._parse_event(e) for e in resp.json()]

    def get_odds(self, event_id: str) -> OddsSnapshot:
        resp = self._client.get("/sports/odds", params={"eventIds": event_id})
        resp.raise_for_status()
        return self._parse_snapshot(resp.json()[0])`}</code></pre>

      <h2>Going live</h2>
      <p>
        When you are ready to connect a real exchange, subclass <code>ExchangeExecutor</code> and implement three methods:
        <code>_api_place_bet()</code>, <code>_api_cancel_order()</code>, and <code>_api_get_balance()</code>.
        The executor has built-in risk guards (<code>max_single_stake</code>, <code>max_total_exposure</code>) and a <code>dry_run</code> mode so you can test without executing.
      </p>
      <p>
        Read the <Link href="/docs/architecture">Architecture guide</Link> for a full breakdown of every layer.
      </p>
    </>
  );
}
