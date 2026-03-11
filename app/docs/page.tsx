import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Overview" };

export default function DocsPage() {
  return (
    <>
      <div className="mb-8">
        <span className="text-xs font-semibold text-amber-600 uppercase tracking-widest">Documentation</span>
        <h1 className="text-3xl font-bold text-stone-900 mt-2 mb-3">Opensport</h1>
        <p className="text-stone-500 text-lg leading-relaxed">
          A provider-agnostic, agent-friendly open-source framework for sports data, odds, and position management.
        </p>
      </div>

      <h2>What is Opensport?</h2>
      <p>
        Opensport gives AI agents and developers a complete toolkit for interacting with sports markets.
        It ships in <strong>Python</strong> (for strategy logic and modelling) and <strong>TypeScript</strong> (for API layers and real-time feeds), with the same concepts and structure across both.
      </p>
      <p>
        The framework is built around four clean layers, each an abstract base class you can swap independently:
      </p>
      <ul>
        <li><strong>Core models</strong>: <code>Event</code>, <code>Market</code>, <code>OddsSnapshot</code>, <code>BetIntent</code>, <code>Position</code></li>
        <li><strong>Provider</strong>: fetches events and odds from any data source</li>
        <li><strong>Executor</strong>: places positions, simulated or live</li>
        <li><strong>Agent</strong>: your strategy logic, wired to provider + executor</li>
      </ul>

      <h2>Key capabilities</h2>
      <table>
        <thead>
          <tr><th>Capability</th><th>How</th></tr>
        </thead>
        <tbody>
          <tr><td><code>get_events()</code></td><td>Pull upcoming or live events, filtered by sport, competition, or status</td></tr>
          <tr><td><code>find_events(team=)</code></td><td>Search events by team or player name (case-insensitive substring)</td></tr>
          <tr><td><code>event.summary()</code></td><td>Compact one-line string for any event, ready for LLM context windows</td></tr>
          <tr><td><code>get_odds()</code></td><td>Fetch a full OddsSnapshot: all markets, all outcomes, implied probs</td></tr>
          <tr><td><code>get_value_bets()</code></td><td>Scan all events and return positive-EV outcomes sorted by edge</td></tr>
          <tr><td><code>place(intent)</code></td><td>Execute a BetIntent against the Simulator or a live exchange</td></tr>
          <tr><td><code>settle_event()</code></td><td>Bulk-settle all positions on an event by outcome label</td></tr>
          <tr><td><code>agent.run()</code></td><td>Full evaluate loop: fetch, analyse, place, repeat</td></tr>
        </tbody>
      </table>

      <h2>Supported sports</h2>
      <p>
        Opensport is sport-agnostic. The <code>Event.sport</code> field is a free-form string, so any sport works out of the box.
        Standard slugs used throughout the codebase: <code>soccer</code>, <code>nfl</code>, <code>nba</code>, <code>nhl</code>, <code>tennis</code>, <code>cricket</code>, <code>mma</code>, <code>horse_racing</code>, <code>rugby_union</code>.
      </p>

      <h2>Supported market types</h2>
      <p>
        A comprehensive set of <code>MarketType</code> slugs covers most use cases out of the box, including winner/moneyline, point spread, Asian handicap, totals/over-under, BTTS, correct score, player props (points, rebounds, passing yards, touchdowns), and race markets (win, place, each-way). A <code>CUSTOM</code> slug is available for provider-specific markets.
      </p>

      <h2>Next steps</h2>
      <p>
        The fastest path to your first position is the <Link href="/docs/quickstart">Quickstart guide</Link>. If you want to understand the full system design before diving in, read the <Link href="/docs/architecture">Architecture overview</Link>.
      </p>
    </>
  );
}
