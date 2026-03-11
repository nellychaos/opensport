import type { Metadata } from "next";
import Link from "next/link";

const title = "Providers";
export const metadata: Metadata = { title };

export default function Page() {
  return (
    <>
      <div className="mb-8">
        <span className="text-xs font-semibold text-amber-600 uppercase tracking-widest">Reference</span>
        <h1 className="text-3xl font-bold text-stone-900 mt-2 mb-3">{title}</h1>
        <p className="text-stone-500 text-lg leading-relaxed">
          A Provider fetches events and odds from a data source and normalises them into the core
          models. Opensport ships six built-in providers. Swap any without changing your agent code.
        </p>
      </div>

      <h2>Overview</h2>

      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Coverage</th>
            <th>API key</th>
            <th>Install extra</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>MockProvider</code></td>
            <td>In-memory, deterministic, no network</td>
            <td>None</td>
            <td>None</td>
          </tr>
          <tr>
            <td><code>PremierLeagueProvider</code></td>
            <td>English Premier League (fixtures + odds)</td>
            <td>2 × free</td>
            <td><code>opensport[http]</code></td>
          </tr>
          <tr>
            <td><code>MasseyRatingsProvider</code></td>
            <td>NFL · NBA · MLB · NHL · NCAAF · NCAAB</td>
            <td>None</td>
            <td><code>opensport[massey]</code></td>
          </tr>
          <tr>
            <td><code>StakeProvider</code></td>
            <td>20+ sports + esports</td>
            <td>Required</td>
            <td><code>opensport[http]</code></td>
          </tr>
          <tr>
            <td><code>CloudbetProvider</code></td>
            <td>20+ sports (free affiliate key)</td>
            <td>Required (free)</td>
            <td><code>opensport[http]</code></td>
          </tr>
          <tr>
            <td><code>PolymarketProvider</code></td>
            <td>10+ sports (prediction market prices)</td>
            <td>None</td>
            <td><code>opensport[http]</code></td>
          </tr>
        </tbody>
      </table>

      {/* ProviderRegistry + MultiProvider --------------------------------- */}
      <h2>ProviderRegistry + MultiProvider</h2>
      <p>
        Use <code>ProviderRegistry</code> to track which providers are active, and{" "}
        <code>MultiProvider</code> to expose them all through a single <code>BaseProvider</code>{" "}
        interface, with no agent changes required.
      </p>

      <h3>Auto-discover from environment variables</h3>
      <pre><code>{`from opensport.providers import ProviderRegistry, MultiProvider

registry = ProviderRegistry.from_env()
# Activates providers based on which env vars are set:
#   FOOTBALL_DATA_API_KEY + ODDS_API_KEY  → PremierLeagueProvider
#   MASSEY_SPORTS=nfl,nba (or "all")      → MasseyRatingsProvider
#   STAKE_API_KEY                          → StakeProvider
#   CLOUDBET_API_KEY                       → CloudbetProvider
#   POLYMARKET_ENABLED=1                   → PolymarketProvider

provider = MultiProvider(registry)
events = provider.get_events(sport="soccer")`}</code></pre>

      <h3>Build manually</h3>
      <pre><code>{`from opensport.providers import ProviderRegistry, MultiProvider
from opensport.providers.mock import MockProvider
from opensport.providers.football_data import PremierLeagueProvider
from opensport.providers.massey import MasseyRatingsProvider
from opensport.providers.stake import StakeProvider
from opensport.providers.cloudbet import CloudbetProvider
from opensport.providers.polymarket import PolymarketProvider

registry = (
    ProviderRegistry()
    .register(MockProvider())
    .register(PremierLeagueProvider(fbd_api_key="...", odds_api_key="..."))
    .register(MasseyRatingsProvider(sports=["nfl", "nba"]))
    .register(StakeProvider(api_key="..."))
    .register(CloudbetProvider(api_key="..."))
    .register(PolymarketProvider(min_liquidity=500.0))
)

# Enable / disable at runtime
registry.disable("mock")
registry.enable("mock")

# Inspect state
for row in registry.status():
    print(row["name"], "→", "ON" if row["enabled"] else "OFF")

# Wire into an agent (unchanged interface)
provider = MultiProvider(registry)
agent = ValueAgent(provider=provider, execution=Simulator(bankroll=1000))`}</code></pre>

      <p>
        <code>MultiProvider</code> merges <code>get_events()</code> across all active providers and
        routes <code>get_odds(event_id)</code> to the correct provider via the event ID prefix.
        Provider failures are logged as warnings and skipped. They do not propagate.
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>MockProvider</h2>
      <p>
        Fully in-memory provider with deterministic output controlled by a seed. No API keys, no
        network calls. Use it for unit testing, tutorials, and sandboxing new strategies.
      </p>

      <pre><code>{`pip install opensport    # zero extra dependencies`}</code></pre>

      <pre><code>{`from opensport.providers.mock import MockProvider

provider = MockProvider(seed=42)
events   = provider.get_events()
snap     = provider.get_odds(events[0].id)`}</code></pre>

      <table>
        <thead><tr><th>Parameter</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>seed</code></td><td><code>0</code></td><td>Integer seed for reproducible event and odds generation</td></tr>
          <tr><td><code>sports</code></td><td><em>all</em></td><td>List of sport slugs to generate events for</td></tr>
          <tr><td><code>n_events_per_sport</code></td><td><code>5</code></td><td>Number of events to generate per sport</td></tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      <h2>PremierLeagueProvider</h2>
      <p>
        English Premier League fixtures, scores, and match-winner odds. Combines two free APIs:{" "}
        <a href="https://www.football-data.org" target="_blank" rel="noopener noreferrer">Football-Data.org</a>{" "}
        for fixture data and{" "}
        <a href="https://the-odds-api.com" target="_blank" rel="noopener noreferrer">The Odds API</a>{" "}
        for odds. Both offer generous free tiers.
      </p>

      <pre><code>{`pip install 'opensport[http]'`}</code></pre>

      <pre><code>{`from opensport.providers.football_data import PremierLeagueProvider

provider = PremierLeagueProvider(
    fbd_api_key="your-football-data-key",
    odds_api_key="your-odds-api-key",
)

events = provider.get_events()
snap   = provider.get_odds(events[0].id)

# Auto-activate via environment variables:
#   FOOTBALL_DATA_API_KEY=...
#   ODDS_API_KEY=...`}</code></pre>

      <table>
        <thead><tr><th>Parameter</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>fbd_api_key</code></td><td>Football-Data.org API key (free tier: 10 req/min)</td></tr>
          <tr><td><code>odds_api_key</code></td><td>The Odds API key (free tier: 500 req/month)</td></tr>
          <tr><td><code>timeout</code></td><td>HTTP timeout in seconds (default: <code>10.0</code>)</td></tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      <h2>MasseyRatingsProvider</h2>
      <p>
        Schedules, scores, and model-derived win-probability odds for the major US sports leagues:
        NFL, NBA, MLB, NHL, NCAA Football, and NCAA Basketball. No API key required. Data is
        sourced from{" "}
        <a href="https://masseyratings.com" target="_blank" rel="noopener noreferrer">masseyratings.com</a>.
      </p>

      <pre><code>{`pip install 'opensport[massey]'`}</code></pre>

      <pre><code>{`from opensport.providers.massey import MasseyRatingsProvider

provider = MasseyRatingsProvider(sports=["nfl", "nba", "mlb", "nhl"])

events = provider.get_events(sport="nfl")
snap   = provider.get_odds(events[0].id)

# Auto-activate via environment variable:
#   MASSEY_SPORTS=nfl,nba     (comma-separated slugs)
#   MASSEY_SPORTS=all         (every supported sport)`}</code></pre>

      <table>
        <thead><tr><th>Parameter</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>sports</code></td><td>Required</td><td>List of slugs: <code>nfl</code>, <code>nba</code>, <code>mlb</code>, <code>nhl</code>, <code>ncaaf</code>, <code>ncaab</code></td></tr>
          <tr><td><code>timeout</code></td><td><code>15.0</code></td><td>HTTP timeout in seconds</td></tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      <h2>StakeProvider</h2>
      <p>
        Live bookmaker odds from{" "}
        <a href="https://stake.com" target="_blank" rel="noopener noreferrer">Stake.com</a>{" "}
        across 20+ sports and esports. Requires a Stake API key.
      </p>

      <pre><code>{`pip install 'opensport[http]'`}</code></pre>

      <pre><code>{`from opensport.providers.stake import StakeProvider

provider = StakeProvider(
    api_key="your-stake-api-key",
    sports=["soccer", "basketball"],   # None = all available sports
)

events = provider.get_events(sport="soccer")
snap   = provider.get_odds(events[0].id)

# Auto-activate via environment variables:
#   STAKE_API_KEY=...
#   STAKE_SPORTS=soccer,basketball   (optional)`}</code></pre>

      <table>
        <thead><tr><th>Parameter</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>api_key</code></td><td>Required</td><td>Stake.com API key</td></tr>
          <tr><td><code>sports</code></td><td><code>None</code></td><td>List of sport slugs to fetch. <code>None</code> = all sports.</td></tr>
          <tr><td><code>timeout</code></td><td><code>10.0</code></td><td>HTTP timeout in seconds</td></tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      <h2>CloudbetProvider</h2>
      <p>
        Real bookmaker odds from{" "}
        <a href="https://cloudbet.com" target="_blank" rel="noopener noreferrer">Cloudbet.com</a>{" "}
        across 20+ sports. A free affiliate API key is available. No deposit required.
      </p>

      <pre><code>{`pip install 'opensport[http]'`}</code></pre>

      <pre><code>{`from opensport.providers.cloudbet import CloudbetProvider

provider = CloudbetProvider(
    api_key="your-cloudbet-api-key",
    sports=["soccer", "basketball"],   # None = all available sports
)

events = provider.get_events(sport="soccer")
snap   = provider.get_odds(events[0].id)

# Auto-activate via environment variables:
#   CLOUDBET_API_KEY=...
#   CLOUDBET_SPORTS=soccer,basketball   (optional)`}</code></pre>

      <table>
        <thead><tr><th>Parameter</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>api_key</code></td><td>Required</td><td>Cloudbet API key (free affiliate key available)</td></tr>
          <tr><td><code>sports</code></td><td><code>None</code></td><td>List of sport slugs to fetch. <code>None</code> = all sports.</td></tr>
          <tr><td><code>timeout</code></td><td><code>10.0</code></td><td>HTTP timeout in seconds</td></tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      <h2>PolymarketProvider</h2>
      <p>
        Consensus probabilities from{" "}
        <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer">Polymarket</a>, the
        world&apos;s largest decentralised prediction market.{" "}
        <strong>No API key required.</strong> Prices reflect the crowd&apos;s implied probability
        rather than a bookmaker&apos;s margin-adjusted odds, making them useful as a reference signal
        for detecting value in traditional bookmaker lines.
      </p>

      <pre><code>{`pip install 'opensport[http]'`}</code></pre>

      <pre><code>{`from opensport.providers.polymarket import PolymarketProvider

# No API key required (explicit opt-in only)
provider = PolymarketProvider(
    sports=["basketball", "soccer"],   # None = all supported sports
    min_liquidity=500.0,               # skip thin markets (USDC)
)

events = provider.get_events(sport="basketball")
snap   = provider.get_odds(events[0].id)
winner = snap.market("winner")
if winner:
    for o in winner.outcomes:
        print(f"  {o.label}: {o.decimal_odds:.2f}  ({100/o.decimal_odds:.1f}% implied)")

# Auto-activate via environment variables:
#   POLYMARKET_ENABLED=1
#   POLYMARKET_SPORTS=basketball,soccer   (optional)
#   POLYMARKET_MIN_LIQUIDITY=500          (optional USDC floor)`}</code></pre>

      <table>
        <thead><tr><th>Parameter</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>sports</code></td><td><code>None</code></td><td>List of sport slugs. <code>None</code> = all supported sports.</td></tr>
          <tr><td><code>min_liquidity</code></td><td><code>0.0</code></td><td>Skip markets with less than this USDC liquidity.</td></tr>
          <tr><td><code>timeout</code></td><td><code>10.0</code></td><td>HTTP timeout in seconds.</td></tr>
        </tbody>
      </table>

      <p>
        Prices are probabilities (0–1) converted to decimal odds:{" "}
        <code>decimal_odds = 1 / probability</code>. Because there is no bookmaker margin, both
        outcomes in a binary market sum to approximately 1.0.
      </p>

      <p>
        Supported sport slugs: <code>soccer</code>, <code>basketball</code>,{" "}
        <code>american-football</code>, <code>baseball</code>, <code>ice-hockey</code>,{" "}
        <code>tennis</code>, <code>cricket</code>, <code>mma</code>, <code>boxing</code>. Unknown
        slugs are passed through as Polymarket native tag slugs (e.g. <code>ncaab</code>,{" "}
        <code>primera-a</code>).
      </p>

      {/* ------------------------------------------------------------------ */}
      <h2>Building a custom provider</h2>
      <p>
        Subclass <code>BaseProvider</code>, implement <code>get_events()</code> and{" "}
        <code>get_odds()</code>, and map your data source&apos;s native objects into the core models.
        See the <Link href="/docs/architecture">Architecture guide</Link> for a full skeleton example.
      </p>

      <pre><code>{`from opensport.providers.base import BaseProvider
from opensport.core.event import Event
from opensport.core.odds import OddsSnapshot

class MyProvider(BaseProvider):
    name = "my_provider"           # unique name for registry routing
    event_id_prefix = "myprov-"   # used by MultiProvider to route get_odds()

    def get_events(self, sport=None, competition=None, status=None) -> list[Event]:
        ...  # fetch raw data and return list[Event]

    def get_odds(self, event_id: str) -> OddsSnapshot:
        ...  # fetch and return OddsSnapshot`}</code></pre>
    </>
  );
}
