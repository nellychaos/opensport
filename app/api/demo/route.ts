import { NextRequest, NextResponse } from "next/server";

// ── Env vars ─────────────────────────────────────────────────────────────────
const FBD_KEY  = process.env.FOOTBALL_DATA_API_KEY;  // Football-Data.org
const ODDS_KEY = process.env.ODDS_API_KEY;            // The Odds API

// ── External API types ────────────────────────────────────────────────────────

interface FbdTeam   { id: number; name: string; shortName: string; tla: string }
interface FbdScore  { fullTime: { home: number | null; away: number | null } }
interface FbdMatch  {
  id: number;
  utcDate: string;
  status: string;
  matchday: number;
  homeTeam: FbdTeam;
  awayTeam: FbdTeam;
  score: FbdScore;
}

interface OddsOutcome   { name: string; price: number }
interface OddsMarket    { key: string; outcomes: OddsOutcome[] }
interface OddsBookmaker { key: string; title: string; markets: OddsMarket[] }
interface OddsEvent     {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: OddsBookmaker[];
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function fmtUtc(iso: string): string {
  return iso.slice(0, 16).replace("T", " ") + " UTC";
}

/** Strip vig: normalise implied probs so they sum to 1. */
function removeVig(prices: number[]): number[] {
  const implied = prices.map((p) => 1 / p);
  const total   = implied.reduce((a, b) => a + b, 0);
  return implied.map((p) => p / total);
}

// ── Live API fetchers (cached 5 min) ──────────────────────────────────────────

async function fetchFbdMatches(): Promise<FbdMatch[]> {
  if (!FBD_KEY) return [];
  try {
    const res = await fetch(
      "https://api.football-data.org/v4/competitions/PL/matches?status=SCHEDULED&limit=15",
      { headers: { "X-Auth-Token": FBD_KEY }, next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.matches ?? []) as FbdMatch[];
  } catch { return []; }
}

async function fetchOddsEvents(): Promise<OddsEvent[]> {
  if (!ODDS_KEY) return [];
  try {
    const qs = new URLSearchParams({
      apiKey: ODDS_KEY, regions: "uk", markets: "h2h", oddsFormat: "decimal",
    });
    const res = await fetch(
      `https://api.the-odds-api.com/v4/sports/soccer_epl/odds/?${qs}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    return await res.json() as OddsEvent[];
  } catch { return []; }
}

// ── Live handlers ─────────────────────────────────────────────────────────────

function mapFbdToEvent(m: FbdMatch) {
  return {
    id:          `fbd-${m.id}`,
    sport:       "soccer",
    competition: "Premier League",
    name:        `${m.homeTeam.shortName} vs ${m.awayTeam.shortName}`,
    start_time:  fmtUtc(m.utcDate),
    status:      m.status.toLowerCase(),
    home_team:   m.homeTeam.name,
    away_team:   m.awayTeam.name,
    summary:     `${m.homeTeam.name} vs ${m.awayTeam.name} | Premier League | ${fmtUtc(m.utcDate)} | ${m.status}`,
  };
}

async function liveEvents() {
  const matches = await fetchFbdMatches();
  if (matches.length === 0) return null;
  return matches.slice(0, 10).map(mapFbdToEvent);
}

async function liveOdds() {
  const events = await fetchOddsEvents();
  if (events.length === 0) return null;

  // Pick the soonest upcoming event with ≥ 3 bookmakers
  const now = Date.now();
  const event = events
    .filter((e) => new Date(e.commence_time).getTime() > now && e.bookmakers.length >= 3)
    .sort((a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime())[0];
  if (!event) return null;

  const bms = event.bookmakers.slice(0, 3);
  const outcomes = bms.flatMap((bm) => {
    const market = bm.markets.find((m) => m.key === "h2h");
    if (!market) return [];
    return market.outcomes.map((o) => ({
      bookmaker:    bm.title,
      label:        o.name === event.home_team ? "Home" : o.name === "Draw" ? "Draw" : "Away",
      decimal_odds: o.price,
      is_available: true,
    }));
  });

  const labels = ["Home", "Draw", "Away"] as const;
  const best: Record<string, { odds: number; bookmaker: string }> = {};
  for (const label of labels) {
    const pool = outcomes.filter((o) => o.label === label);
    if (pool.length > 0) {
      const top = pool.reduce((a, b) => (b.decimal_odds > a.decimal_odds ? b : a));
      best[label] = { odds: top.decimal_odds, bookmaker: top.bookmaker };
    }
  }

  return {
    event_id: event.id,
    match:    `${event.home_team} vs ${event.away_team}`,
    markets:  [{ market_type: "winner", outcomes, best }],
  };
}

async function liveValueBets(minEdgePct: number) {
  const events = await fetchOddsEvents();
  if (events.length === 0) return null;

  const now     = Date.now();
  const results: Array<{
    event_id: string; event_summary: string; market_type: string;
    outcome_label: string; decimal_odds: number; fair_prob: number;
    edge_pct: number; bookmaker: string;
  }> = [];

  for (const event of events.filter((e) => new Date(e.commence_time).getTime() > now)) {
    // Collect each bookmaker's h2h prices
    const rows = event.bookmakers
      .map((bm) => {
        const mkt = bm.markets.find((m) => m.key === "h2h");
        if (!mkt || mkt.outcomes.length < 3) return null;
        const home = mkt.outcomes.find((o) => o.name === event.home_team);
        const draw = mkt.outcomes.find((o) => o.name === "Draw");
        const away = mkt.outcomes.find((o) => o.name === event.away_team);
        if (!home || !draw || !away) return null;
        return { bm: bm.title, home: home.price, draw: draw.price, away: away.price };
      })
      .filter(Boolean) as Array<{ bm: string; home: number; draw: number; away: number }>;

    if (rows.length < 2) continue;

    // Consensus fair probability = average devigged implied probs across bookmakers
    let fairHome = 0, fairDraw = 0, fairAway = 0;
    for (const r of rows) {
      const [ph, pd, pa] = removeVig([r.home, r.draw, r.away]);
      fairHome += ph; fairDraw += pd; fairAway += pa;
    }
    fairHome /= rows.length; fairDraw /= rows.length; fairAway /= rows.length;

    // Best available odds across all bookmakers per outcome
    const bestHome = rows.reduce((a, b) => (b.home > a.home ? b : a));
    const bestDraw = rows.reduce((a, b) => (b.draw > a.draw ? b : a));
    const bestAway = rows.reduce((a, b) => (b.away > a.away ? b : a));

    const startTime = fmtUtc(event.commence_time);
    const summary   = `${event.home_team} vs ${event.away_team} | Premier League | ${startTime} | SCHEDULED`;

    for (const [label, fairProb, bestOdds, bmName] of [
      ["Home", fairHome, bestHome.home, bestHome.bm],
      ["Draw", fairDraw, bestDraw.draw, bestDraw.bm],
      ["Away", fairAway, bestAway.away, bestAway.bm],
    ] as [string, number, number, string][]) {
      const edgePct = Math.round((fairProb * bestOdds - 1) * 1000) / 10;
      if (edgePct >= minEdgePct) {
        results.push({
          event_id:      event.id,
          event_summary: summary,
          market_type:   "winner",
          outcome_label: label,
          decimal_odds:  Math.round(bestOdds * 100) / 100,
          fair_prob:     Math.round(fairProb * 10000) / 10000,
          edge_pct:      edgePct,
          bookmaker:     bmName,
        });
      }
    }
  }

  return results.sort((a, b) => b.edge_pct - a.edge_pct).slice(0, 6);
}

async function liveFindEvents(team: string) {
  const matches = await fetchFbdMatches();
  if (matches.length === 0) return null;
  const q = team.toLowerCase();
  return matches
    .filter((m) => {
      const h = `${m.homeTeam.name} ${m.homeTeam.shortName}`.toLowerCase();
      const a = `${m.awayTeam.name} ${m.awayTeam.shortName}`.toLowerCase();
      return h.includes(q) || a.includes(q);
    })
    .slice(0, 5)
    .map(mapFbdToEvent);
}

// ── Mock fallback data (Matchweek 30, 14–16 Mar 2026) ────────────────────────

const MOCK_FIXTURES = [
  { id: "pl_001", home: "Burnley",           away: "Bournemouth",  ko: [0, 15,  0] },
  { id: "pl_002", home: "Sunderland",        away: "Brighton",     ko: [0, 15,  0] },
  { id: "pl_003", home: "Chelsea",           away: "Newcastle",    ko: [0, 17, 30] },
  { id: "pl_004", home: "Arsenal",           away: "Everton",      ko: [0, 17, 30] },
  { id: "pl_005", home: "West Ham",          away: "Man City",     ko: [0, 20,  0] },
  { id: "pl_006", home: "Crystal Palace",    away: "Leeds United", ko: [1, 14,  0] },
  { id: "pl_007", home: "Manchester United", away: "Aston Villa",  ko: [1, 14,  0] },
  { id: "pl_008", home: "Nottingham Forest", away: "Fulham",       ko: [1, 14,  0] },
  { id: "pl_009", home: "Liverpool",         away: "Tottenham",    ko: [1, 16, 30] },
  { id: "pl_010", home: "Brentford",         away: "Wolves",       ko: [2, 20,  0] },
] as const;

function nextSaturday(): Date {
  const now = new Date();
  const d   = ((6 - now.getDay()) + 7) % 7 || 7;
  const sat = new Date(now);
  sat.setDate(now.getDate() + d);
  sat.setUTCHours(0, 0, 0, 0);
  return sat;
}

function mockKickoff(sat: Date, day: number, h: number, m: number): string {
  const d = new Date(sat);
  d.setDate(sat.getDate() + day);
  d.setUTCHours(h, m, 0, 0);
  return fmtUtc(d.toISOString());
}

function getMockEvents() {
  const sat = nextSaturday();
  return MOCK_FIXTURES.map((f) => {
    const [day, h, m] = f.ko;
    const t = mockKickoff(sat, day, h, m);
    return { id: f.id, sport: "soccer", competition: "Premier League",
      name: `${f.home} vs ${f.away}`, start_time: t, status: "scheduled",
      home_team: f.home, away_team: f.away,
      summary: `${f.home} vs ${f.away} | Premier League | ${t} | SCHEDULED` };
  });
}

function getMockOdds() {
  const f = MOCK_FIXTURES[8]; // Liverpool vs Tottenham
  const bms = [
    { name: "Cloudbet",   home: 1.60, draw: 4.20, away: 5.00 },
    { name: "Stake",      home: 1.57, draw: 4.30, away: 5.20 },
    { name: "Polymarket", home: 1.62, draw: 4.10, away: 4.90 },
  ];
  const outcomes = bms.flatMap((b) => [
    { bookmaker: b.name, label: "Home", decimal_odds: b.home, is_available: true },
    { bookmaker: b.name, label: "Draw", decimal_odds: b.draw, is_available: true },
    { bookmaker: b.name, label: "Away", decimal_odds: b.away, is_available: true },
  ]);
  return {
    event_id: "pl_009",
    match:    `${f.home} vs ${f.away}`,
    markets:  [{ market_type: "winner", outcomes,
      best: { Home: { odds: 1.62, bookmaker: "Polymarket" },
              Draw: { odds: 4.30, bookmaker: "Stake" },
              Away: { odds: 5.20, bookmaker: "Stake" } } }],
  };
}

function getMockValueBets() {
  const sat = nextSaturday();
  const ko  = (i: number) => { const [d,h,m] = MOCK_FIXTURES[i].ko; return mockKickoff(sat,d,h,m); };
  return [
    { event_id: "pl_005", market_type: "winner", outcome_label: "Away",
      decimal_odds: 3.20, fair_prob: 0.3700, edge_pct: 18.4, bookmaker: "Cloudbet",
      event_summary: `West Ham vs Man City | Premier League | ${ko(4)} | SCHEDULED` },
    { event_id: "pl_009", market_type: "winner", outcome_label: "Away",
      decimal_odds: 4.50, fair_prob: 0.2600, edge_pct: 17.0, bookmaker: "Stake",
      event_summary: `Liverpool vs Tottenham | Premier League | ${ko(8)} | SCHEDULED` },
    { event_id: "pl_007", market_type: "winner", outcome_label: "Away",
      decimal_odds: 2.90, fair_prob: 0.3800, edge_pct: 10.2, bookmaker: "Polymarket",
      event_summary: `Manchester United vs Aston Villa | Premier League | ${ko(6)} | SCHEDULED` },
    { event_id: "pl_003", market_type: "winner", outcome_label: "Draw",
      decimal_odds: 3.70, fair_prob: 0.2950, edge_pct: 9.2, bookmaker: "Cloudbet",
      event_summary: `Chelsea vs Newcastle | Premier League | ${ko(2)} | SCHEDULED` },
  ];
}

function getMockFindEvents(team: string) {
  const sat = nextSaturday();
  const q   = team.toLowerCase();
  return MOCK_FIXTURES
    .filter((f) => f.home.toLowerCase().includes(q) || f.away.toLowerCase().includes(q))
    .map((f) => {
      const [d,h,m] = f.ko;
      const t = mockKickoff(sat, d, h, m);
      return { id: f.id, sport: "soccer", competition: "Premier League",
        name: `${f.home} vs ${f.away}`, start_time: t, status: "scheduled",
        home_team: f.home, away_team: f.away,
        summary: `${f.home} vs ${f.away} | Premier League | ${t} | SCHEDULED` };
    });
}

// ── Route handler ─────────────────────────────────────────────────────────────

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export async function GET(req: NextRequest) {
  const p      = req.nextUrl.searchParams;
  const action = p.get("action")   ?? "events";
  const team   = p.get("team")     ?? "Arsenal";

  // Small artificial delay so the "Running…" state is visible
  await sleep(300);

  switch (action) {
    case "events": {
      const live = await liveEvents();
      return NextResponse.json({ ok: true, live: live !== null, data: live ?? getMockEvents() });
    }
    case "odds": {
      const live = await liveOdds();
      return NextResponse.json({ ok: true, live: live !== null, data: live ?? getMockOdds() });
    }
    case "value_bets": {
      const live = await liveValueBets(2);
      return NextResponse.json({ ok: true, live: live !== null, data: live ?? getMockValueBets() });
    }
    case "find_events": {
      const live = await liveFindEvents(team);
      return NextResponse.json({ ok: true, live: live !== null, data: live ?? getMockFindEvents(team) });
    }
    default:
      return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  }
}
