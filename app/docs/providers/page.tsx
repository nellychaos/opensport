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
          A Provider fetches events and odds from any data source and normalises them into
          opensport core models. Swap providers without touching your agent or executor code.
        </p>
      </div>

      <h2>BaseProvider interface</h2>
      <p>
        All providers implement <code>BaseProvider</code> (Python) or <code>IProvider</code> (TypeScript).
        Only <code>get_events()</code> and <code>get_odds()</code> are required — the rest are optional extensions.
      </p>

      <pre><code>{`# python/opensport/providers/base.py
from abc import ABC, abstractmethod
from opensport.core.event import Event
from opensport.core.odds import OddsSnapshot, Market

class BaseProvider(ABC):
    name: str = "base"

    @abstractmethod
    def get_events(
        self,
        sport: str | None = None,
        competition: str | None = None,
        status: str | None = None,   # "scheduled" | "live" | "finished"
    ) -> list[Event]: ...

    @abstractmethod
    def get_odds(self, event_id: str) -> OddsSnapshot: ...

    # Optional — return default impl raises NotImplementedError
    def get_markets(self, event_id: str) -> list[Market]: ...
    def get_live_score(self, event_id: str) -> dict: ...
    async def stream_odds(
        self,
        event_id: str,
        interval_seconds: float = 5.0,
    ): ...`}</code></pre>

      <pre><code>{`// typescript/src/providers/base.ts
export interface IProvider {
  readonly name: string;
  getEvents(params?: {
    sport?: string;
    competition?: string;
    status?: "scheduled" | "live" | "finished";
  }): Promise<Event[]>;
  getOdds(eventId: string): Promise<OddsSnapshot>;
  getMarkets?(eventId: string): Promise<Market[]>;
  getLiveScore?(eventId: string): Promise<Record<string, unknown>>;
}`}</code></pre>

      <h2>Method reference</h2>

      <h3>get_events()</h3>
      <table>
        <thead><tr><th>Parameter</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>sport</td><td>str | None</td><td>None</td><td>Filter by sport slug (e.g. <code>"soccer"</code>, <code>"nfl"</code>, <code>"tennis"</code>). None returns all sports.</td></tr>
          <tr><td>competition</td><td>str | None</td><td>None</td><td>Filter by competition name or slug (e.g. <code>"premier_league"</code>).</td></tr>
          <tr><td>status</td><td>str | None</td><td>None</td><td>Filter by event status: <code>"scheduled"</code>, <code>"live"</code>, or <code>"finished"</code>.</td></tr>
        </tbody>
      </table>
      <p>Returns <code>list[Event]</code>. Raises <code>ProviderError</code> on upstream failure.</p>

      <h3>get_odds()</h3>
      <table>
        <thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>event_id</td><td>str</td><td>The <code>Event.id</code> returned by <code>get_events()</code>.</td></tr>
        </tbody>
      </table>
      <p>
        Returns <code>OddsSnapshot</code> — all available markets for that event at the current moment.
        All odds are normalised to <strong>decimal format</strong> regardless of what the upstream source uses.
      </p>

      <h3>stream_odds() (async)</h3>
      <p>
        Optional. Yields a new <code>OddsSnapshot</code> on every poll interval.
        Useful for live-trading agents that need to react to line movement.
      </p>
      <pre><code>{`async for snap in provider.stream_odds("match_123", interval_seconds=2.0):
    agent.on_tick(snap)`}</code></pre>

      <h2>Supported sports</h2>
      <table>
        <thead><tr><th>Sport slug</th><th>Sport</th></tr></thead>
        <tbody>
          <tr><td>soccer</td><td>Association football</td></tr>
          <tr><td>nfl</td><td>American football (NFL)</td></tr>
          <tr><td>nba</td><td>Basketball (NBA)</td></tr>
          <tr><td>nhl</td><td>Ice hockey (NHL)</td></tr>
          <tr><td>tennis</td><td>Tennis</td></tr>
          <tr><td>cricket</td><td>Cricket</td></tr>
          <tr><td>mma</td><td>Mixed martial arts</td></tr>
          <tr><td>horse_racing</td><td>Horse racing</td></tr>
          <tr><td>rugby_union</td><td>Rugby union</td></tr>
        </tbody>
      </table>

      <h2>Supported market types</h2>
      <table>
        <thead><tr><th>Market type slug</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>winner</td><td>Match winner (1X2 or head-to-head)</td></tr>
          <tr><td>spread</td><td>Point spread / handicap</td></tr>
          <tr><td>asian_handicap</td><td>Asian handicap with split lines</td></tr>
          <tr><td>totals</td><td>Over/under total goals or points</td></tr>
          <tr><td>btts</td><td>Both teams to score (soccer)</td></tr>
          <tr><td>correct_score</td><td>Exact final score</td></tr>
          <tr><td>player_props</td><td>Individual player performance markets</td></tr>
          <tr><td>race_markets</td><td>Win, place, each-way (horse racing)</td></tr>
        </tbody>
      </table>

      <h2>MockProvider</h2>
      <p>
        <code>MockProvider</code> is the built-in test provider. It generates realistic events and
        odds entirely in memory — no API key, no network, fully reproducible via seed.
        Use it for development, unit tests, and CI.
      </p>

      <pre><code>{`from opensport.providers.mock import MockProvider

# Default — random but consistent within a session
provider = MockProvider()

# Seeded — identical output on every run, across machines
provider = MockProvider(seed=42)

events = provider.get_events(sport="soccer")   # returns ~10 fixture events
snap   = provider.get_odds(events[0].id)        # OddsSnapshot with 3+ markets`}</code></pre>

      <table>
        <thead><tr><th>Constructor param</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>seed</td><td>int | None</td><td>None</td><td>Random seed for reproducible data. None = random each time.</td></tr>
          <tr><td>sports</td><td>list[str]</td><td>(all)</td><td>Restrict which sports appear in mock events.</td></tr>
          <tr><td>events_per_sport</td><td>int</td><td>3</td><td>Number of fixture events generated per sport.</td></tr>
          <tr><td>bookmakers</td><td>int</td><td>5</td><td>Number of simulated bookmaker price sets per market.</td></tr>
          <tr><td>overround</td><td>float</td><td>1.06</td><td>Applied margin — prices will imply ~6% book over 100%.</td></tr>
        </tbody>
      </table>

      <h2>Building a custom provider</h2>
      <p>
        Subclass <code>BaseProvider</code>, implement <code>get_events()</code> and <code>get_odds()</code>,
        and map your data source into the core models. Your agent code is unchanged.
      </p>

      <pre><code>{`# Example: wrapping The Odds API
from opensport.providers.base import BaseProvider
from opensport.core.event import Event, Team
from opensport.core.odds import OddsSnapshot, MarketOdds, OutcomeOdds
from opensport.core.models import Market, MarketType
import httpx

class TheOddsApiProvider(BaseProvider):
    name = "the_odds_api"

    def __init__(self, api_key: str):
        self._client = httpx.Client(
            base_url="https://api.the-odds-api.com/v4",
            params={"apiKey": api_key},
        )

    def get_events(self, sport=None, **_) -> list[Event]:
        resp = self._client.get(f"/sports/{sport or 'soccer'}/events")
        resp.raise_for_status()
        return [self._parse_event(e) for e in resp.json()]

    def get_odds(self, event_id: str) -> OddsSnapshot:
        resp = self._client.get(
            "/sports/odds",
            params={"eventIds": event_id, "oddsFormat": "decimal"},
        )
        resp.raise_for_status()
        return self._parse_snapshot(resp.json()[0])

    def _parse_event(self, raw: dict) -> Event:
        return Event(
            id=raw["id"],
            sport=raw["sport_key"],
            competition=raw.get("sport_title", ""),
            home=Team(name=raw["home_team"]),
            away=Team(name=raw["away_team"]),
            starts_at=raw["commence_time"],
            status="scheduled",
        )

    def _parse_snapshot(self, raw: dict) -> OddsSnapshot:
        markets = []
        for bm in raw.get("bookmakers", []):
            for mkt in bm.get("markets", []):
                outcomes = [
                    OutcomeOdds(label=o["name"], decimal_odds=o["price"])
                    for o in mkt["outcomes"]
                ]
                markets.append(MarketOdds(
                    market=Market(type=mkt["key"]),
                    outcomes=outcomes,
                    bookmaker=bm["key"],
                ))
        return OddsSnapshot(event_id=raw["id"], markets=markets)`}</code></pre>

      <p>
        See the <Link href="/docs/quickstart">Quickstart</Link> for a working end-to-end example,
        or the <Link href="/docs/architecture">Architecture guide</Link> for how providers fit into the full stack.
      </p>
    </>
  );
}
