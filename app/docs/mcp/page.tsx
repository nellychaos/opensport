import type { Metadata } from "next";
import Link from "next/link";

const title = "MCP Server";
export const metadata: Metadata = { title };

export default function Page() {
  return (
    <>
      <div className="mb-8">
        <span className="text-xs font-semibold text-amber-600 uppercase tracking-widest">Reference</span>
        <h1 className="text-3xl font-bold text-stone-900 mt-2 mb-3">{title}</h1>
        <p className="text-stone-500 text-lg leading-relaxed">
          Expose any configured Opensport provider as an MCP (Model Context Protocol) server.
          Any MCP-compatible host can then call six tools to query events, read odds, and find value bets.
        </p>
      </div>

      <h2>Overview</h2>
      <p>
        The MCP server ships as an optional extra. It runs over stdio and is configured entirely
        via environment variables using the same <code>ProviderRegistry.from_env()</code> mechanism
        as the Python SDK. No additional configuration is required.
      </p>

      <table>
        <thead>
          <tr>
            <th>Tool</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>list_providers</code></td>
            <td>List configured providers and their enabled/disabled status.</td>
          </tr>
          <tr>
            <td><code>get_events</code></td>
            <td>List upcoming events. Filter by sport, competition, or status.</td>
          </tr>
          <tr>
            <td><code>find_events</code></td>
            <td>Search for events by team or player name (substring match).</td>
          </tr>
          <tr>
            <td><code>get_odds</code></td>
            <td>Fetch current odds for a specific event ID.</td>
          </tr>
          <tr>
            <td><code>get_value_bets</code></td>
            <td>Scan all upcoming events and return positive-EV outcomes sorted by edge.</td>
          </tr>
          <tr>
            <td><code>get_live_score</code></td>
            <td>Get the current in-play score for a live event.</td>
          </tr>
        </tbody>
      </table>

      <h2>Installation</h2>

      <pre><code>{`pip install 'opensport[mcp]'`}</code></pre>

      <p>
        This installs the <code>mcp</code> package alongside Opensport and registers the{" "}
        <code>opensport-mcp</code> command.
      </p>

      <h2>Running the server</h2>

      <pre><code>{`# Set whichever provider env vars you need (see Providers reference)
export MASSEY_SPORTS=nfl,nba
export CLOUDBET_API_KEY=your-key

# Start the stdio MCP server
opensport-mcp

# Or run as a Python module
python -m opensport.mcp_server`}</code></pre>

      <p>
        With no env vars set, <code>MockProvider</code> is always available, so the server starts
        and responds to all six tools immediately, with no API keys and no network access.
      </p>

      <h2>Claude Desktop configuration</h2>
      <p>
        Add the server to <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>:
      </p>

      <pre><code>{`{
  "mcpServers": {
    "opensport": {
      "command": "opensport-mcp",
      "env": {
        "MASSEY_SPORTS": "nfl,nba,mlb",
        "CLOUDBET_API_KEY": "your-cloudbet-key",
        "POLYMARKET_ENABLED": "1"
      }
    }
  }
}`}</code></pre>

      <p>
        Restart Claude Desktop after saving. The six Opensport tools will appear in the tools panel.
      </p>

      <h2>Tool reference</h2>

      <h3>list_providers</h3>
      <p>Returns the name and enabled status of every registered provider.</p>
      <pre><code>{`# No parameters required
# Example response:
{
  "providers": [
    { "name": "mock",    "enabled": true  },
    { "name": "massey",  "enabled": true  },
    { "name": "cloudbet","enabled": false }
  ]
}`}</code></pre>

      <h3>get_events</h3>
      <table>
        <thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>sport</code></td><td>string</td><td>Sport slug, e.g. <code>soccer</code>, <code>nfl</code>. Omit for all sports.</td></tr>
          <tr><td><code>competition</code></td><td>string</td><td>Competition name filter, e.g. <code>Premier League</code>.</td></tr>
          <tr><td><code>status</code></td><td>string</td><td><code>scheduled</code>, <code>live</code>, or <code>completed</code>.</td></tr>
          <tr><td><code>limit</code></td><td>integer</td><td>Max events to return (default: 20).</td></tr>
        </tbody>
      </table>

      <pre><code>{`# Example response:
{
  "count": 3,
  "total": 12,
  "events": [
    {
      "id": "mock_soccer_000",
      "summary": "Arsenal vs Chelsea | Premier League | 2024-03-15 20:00 UTC | SCHEDULED",
      "sport": "soccer",
      "competition": "Premier League",
      "start_time": "2024-03-15T20:00:00",
      "status": "scheduled"
    }
  ]
}`}</code></pre>

      <h3>find_events</h3>
      <table>
        <thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>team</code> (required)</td><td>string</td><td>Team or player name fragment, e.g. <code>Arsenal</code>, <code>Lakers</code>.</td></tr>
          <tr><td><code>sport</code></td><td>string</td><td>Restrict to a sport slug.</td></tr>
          <tr><td><code>limit</code></td><td>integer</td><td>Max events to return (default: 10).</td></tr>
        </tbody>
      </table>

      <h3>get_odds</h3>
      <table>
        <thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>event_id</code> (required)</td><td>string</td><td>Event ID from <code>get_events</code> or <code>find_events</code>.</td></tr>
        </tbody>
      </table>

      <pre><code>{`# Example response:
{
  "event_id": "mock_soccer_000",
  "fetched_at": "2024-03-15T19:55:00",
  "markets": [
    {
      "market_type": "winner",
      "overround": 1.048,
      "margin_pct": 4.8,
      "outcomes": [
        { "label": "Home",  "decimal_odds": 2.10, "implied_prob": 0.476, "bookmaker": "mock", "is_available": true },
        { "label": "Draw",  "decimal_odds": 3.40, "implied_prob": 0.294, "bookmaker": "mock", "is_available": true },
        { "label": "Away",  "decimal_odds": 4.20, "implied_prob": 0.238, "bookmaker": "mock", "is_available": true }
      ]
    }
  ]
}`}</code></pre>

      <h3>get_value_bets</h3>
      <table>
        <thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>sport</code></td><td>string</td><td>Restrict scan to a sport slug. Omit for all sports.</td></tr>
          <tr><td><code>min_edge_pct</code></td><td>number</td><td>Minimum edge as a percentage (default: 3.0 = 3%).</td></tr>
          <tr><td><code>market_type</code></td><td>string</td><td>Market to scan (default: <code>winner</code>).</td></tr>
          <tr><td><code>limit</code></td><td>integer</td><td>Max results (default: 10).</td></tr>
        </tbody>
      </table>

      <pre><code>{`# Example response:
{
  "count": 2,
  "total": 2,
  "value_bets": [
    {
      "event_id": "mock_soccer_002",
      "event_summary": "Liverpool vs Man United | Premier League | 2024-03-16 15:00 UTC | SCHEDULED",
      "sport": "soccer",
      "competition": "Premier League",
      "start_time": "2024-03-16T15:00:00",
      "market_type": "winner",
      "outcome_label": "Home",
      "decimal_odds": 2.20,
      "bookmaker": "mock",
      "fair_prob": 0.4762,
      "implied_prob": 0.4545,
      "edge_pct": 4.76
    }
  ]
}`}</code></pre>

      <h3>get_live_score</h3>
      <table>
        <thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>event_id</code> (required)</td><td>string</td><td>Event ID of a live (in-play) event.</td></tr>
        </tbody>
      </table>

      <p>
        Returns a provider-specific score dict. Providers that do not support live scores
        return an empty object. See the <Link href="/docs/providers">Providers reference</Link>{" "}
        for per-provider live score support.
      </p>

      <h2>Utility functions</h2>
      <p>
        The same logic used by the MCP server is available directly from Python without running
        a server process.
      </p>

      <h3>Event.summary()</h3>
      <p>
        Returns a compact one-line string for any <code>Event</code>, suitable for pasting
        into an LLM context window.
      </p>

      <pre><code>{`from opensport.providers.mock import MockProvider

provider = MockProvider(seed=42)
events = provider.get_events(sport="soccer")
print(events[0].summary())
# Arsenal vs Chelsea | Premier League | 2024-03-15 20:00 UTC | SCHEDULED`}</code></pre>

      <h3>BaseProvider.find_events()</h3>
      <p>
        Every provider inherits <code>find_events()</code>, which performs a case-insensitive
        substring search across all participant names.
      </p>

      <pre><code>{`events = provider.find_events(team="arsenal", sport="soccer")
for e in events:
    print(e.summary())`}</code></pre>

      <h3>get_value_bets()</h3>
      <p>
        Scans all upcoming events from a provider (or <code>MultiProvider</code>) and returns
        outcomes where the offered odds imply positive expected value vs the no-vig fair price.
      </p>

      <pre><code>{`from opensport.utils import get_value_bets
from opensport.providers.mock import MockProvider

bets = get_value_bets(MockProvider(seed=42), sport="soccer", min_edge_pct=0.02)
for b in bets:
    print(f"{b['event_summary']}")
    print(f"  {b['outcome_label']} @ {b['decimal_odds']:.2f}  edge={b['edge_pct']:.1f}%")`}</code></pre>
    </>
  );
}
