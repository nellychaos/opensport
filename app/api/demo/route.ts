import { NextRequest, NextResponse } from "next/server";

// ── Fixtures ────────────────────────────────────────────────────────────────

const FIXTURES = [
  { id: "pl_001", home: "Arsenal",           away: "Chelsea",       competition: "Premier League" },
  { id: "pl_002", home: "Manchester City",   away: "Liverpool",     competition: "Premier League" },
  { id: "pl_003", home: "Manchester United", away: "Tottenham",     competition: "Premier League" },
  { id: "pl_004", home: "Newcastle",         away: "Aston Villa",   competition: "Premier League" },
  { id: "pl_005", home: "Brighton",          away: "Brentford",     competition: "Premier League" },
  { id: "pl_006", home: "West Ham",          away: "Fulham",        competition: "Premier League" },
  { id: "pl_007", home: "Crystal Palace",    away: "Wolves",        competition: "Premier League" },
  { id: "pl_008", home: "Everton",           away: "Bournemouth",   competition: "Premier League" },
];

// ── Date helpers ────────────────────────────────────────────────────────────

/** Returns 8 upcoming kick-off times starting from the next Saturday. */
function getUpcomingDates(): Date[] {
  const now = new Date();
  const daysUntilSat = ((6 - now.getDay()) + 7) % 7 || 7;
  const sat = new Date(now);
  sat.setDate(now.getDate() + daysUntilSat);

  function kick(base: Date, offsetDays: number, hour: number, min: number): Date {
    const d = new Date(base);
    d.setDate(base.getDate() + offsetDays);
    d.setHours(hour, min, 0, 0);
    return d;
  }

  return [
    kick(sat, 0, 12, 30),
    kick(sat, 0, 15,  0),
    kick(sat, 0, 17, 30),
    kick(sat, 1, 14,  0),
    kick(sat, 1, 16, 30),
    kick(sat, 1, 19,  0),
    kick(sat, 2, 20,  0),
    kick(sat, 3, 19, 45),
  ];
}

function fmtTime(d: Date): string {
  return d.toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

// ── Action handlers ─────────────────────────────────────────────────────────

function handleEvents() {
  const dates = getUpcomingDates();
  return FIXTURES.map((f, i) => ({
    id: f.id,
    sport: "soccer",
    competition: f.competition,
    name: `${f.home} vs ${f.away}`,
    start_time: fmtTime(dates[i]),
    status: "scheduled",
    home_team: f.home,
    away_team: f.away,
    summary: `${f.home} vs ${f.away} | ${f.competition} | ${fmtTime(dates[i])} | SCHEDULED`,
  }));
}

function handleOdds(eventId: string) {
  const event = FIXTURES.find((f) => f.id === eventId) ?? FIXTURES[0];

  const bookmakers = [
    { name: "Cloudbet",   home: 2.10, draw: 3.45, away: 3.80 },
    { name: "Stake",      home: 2.05, draw: 3.50, away: 3.75 },
    { name: "Polymarket", home: 2.15, draw: 3.40, away: 3.70 },
  ];

  const outcomes = bookmakers.flatMap((b) => [
    { bookmaker: b.name, label: "Home", decimal_odds: b.home, is_available: true },
    { bookmaker: b.name, label: "Draw", decimal_odds: b.draw, is_available: true },
    { bookmaker: b.name, label: "Away", decimal_odds: b.away, is_available: true },
  ]);

  return {
    event_id: event.id,
    match: `${event.home} vs ${event.away}`,
    markets: [
      {
        market_type: "winner",
        outcomes,
        best: {
          Home: { odds: 2.15, bookmaker: "Polymarket" },
          Draw: { odds: 3.50, bookmaker: "Stake" },
          Away: { odds: 3.80, bookmaker: "Cloudbet" },
        },
      },
    ],
  };
}

function handleValueBets() {
  const dates = getUpcomingDates();

  const raw = [
    {
      event_id:      "pl_002",
      event_summary: `Manchester City vs Liverpool | Premier League | ${fmtTime(dates[1])} | SCHEDULED`,
      market_type:   "winner",
      outcome_label: "Away",
      decimal_odds:  3.90,
      fair_prob:     0.3012,
      edge_pct:      17.5,
      bookmaker:     "Cloudbet",
    },
    {
      event_id:      "pl_001",
      event_summary: `Arsenal vs Chelsea | Premier League | ${fmtTime(dates[0])} | SCHEDULED`,
      market_type:   "winner",
      outcome_label: "Away",
      decimal_odds:  3.80,
      fair_prob:     0.2857,
      edge_pct:      8.6,
      bookmaker:     "Cloudbet",
    },
    {
      event_id:      "pl_006",
      event_summary: `West Ham vs Fulham | Premier League | ${fmtTime(dates[5])} | SCHEDULED`,
      market_type:   "winner",
      outcome_label: "Home",
      decimal_odds:  2.30,
      fair_prob:     0.4651,
      edge_pct:      6.9,
      bookmaker:     "Polymarket",
    },
    {
      event_id:      "pl_004",
      event_summary: `Newcastle vs Aston Villa | Premier League | ${fmtTime(dates[3])} | SCHEDULED`,
      market_type:   "winner",
      outcome_label: "Draw",
      decimal_odds:  3.60,
      fair_prob:     0.2934,
      edge_pct:      5.6,
      bookmaker:     "Stake",
    },
  ];

  return raw.sort((a, b) => b.edge_pct - a.edge_pct);
}

function handleFindEvents(team: string) {
  const dates = getUpcomingDates();
  const q = team.toLowerCase();

  return FIXTURES
    .map((f, i) => ({ ...f, date: dates[i] }))
    .filter((f) => f.home.toLowerCase().includes(q) || f.away.toLowerCase().includes(q))
    .map((f) => ({
      id:          f.id,
      sport:       "soccer",
      competition: f.competition,
      name:        `${f.home} vs ${f.away}`,
      start_time:  fmtTime(f.date),
      status:      "scheduled",
      home_team:   f.home,
      away_team:   f.away,
      summary:     `${f.home} vs ${f.away} | ${f.competition} | ${fmtTime(f.date)} | SCHEDULED`,
    }));
}

// ── Route handler ───────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(req: NextRequest) {
  const p        = req.nextUrl.searchParams;
  const action   = p.get("action")   ?? "events";
  const eventId  = p.get("event_id") ?? "pl_001";
  const team     = p.get("team")     ?? "Arsenal";

  // Simulate realistic API latency
  await sleep(450 + Math.random() * 150);

  switch (action) {
    case "events":
      return NextResponse.json({ ok: true, data: handleEvents() });
    case "odds":
      return NextResponse.json({ ok: true, data: handleOdds(eventId) });
    case "value_bets":
      return NextResponse.json({ ok: true, data: handleValueBets() });
    case "find_events":
      return NextResponse.json({ ok: true, data: handleFindEvents(team) });
    default:
      return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  }
}
