import { NextRequest, NextResponse } from "next/server";

// ── Matchweek 30 fixtures (14–16 Mar 2026) ──────────────────────────────────
// Kick-off times are stored as [dayOffset from Saturday, hour, minute] in GMT.

const FIXTURES = [
  { id: "pl_001", home: "Burnley",            away: "Bournemouth",   competition: "Premier League", ko: [0, 15,  0] },
  { id: "pl_002", home: "Sunderland",         away: "Brighton",      competition: "Premier League", ko: [0, 15,  0] },
  { id: "pl_003", home: "Chelsea",            away: "Newcastle",     competition: "Premier League", ko: [0, 17, 30] },
  { id: "pl_004", home: "Arsenal",            away: "Everton",       competition: "Premier League", ko: [0, 17, 30] },
  { id: "pl_005", home: "West Ham",           away: "Man City",      competition: "Premier League", ko: [0, 20,  0] },
  { id: "pl_006", home: "Crystal Palace",     away: "Leeds United",  competition: "Premier League", ko: [1, 14,  0] },
  { id: "pl_007", home: "Manchester United",  away: "Aston Villa",   competition: "Premier League", ko: [1, 14,  0] },
  { id: "pl_008", home: "Nottingham Forest",  away: "Fulham",        competition: "Premier League", ko: [1, 14,  0] },
  { id: "pl_009", home: "Liverpool",          away: "Tottenham",     competition: "Premier League", ko: [1, 16, 30] },
  { id: "pl_010", home: "Brentford",          away: "Wolves",        competition: "Premier League", ko: [2, 20,  0] },
];

// ── Date helpers ────────────────────────────────────────────────────────────

/** Returns the next upcoming Saturday (or the Saturday after, if today is Saturday). */
function nextSaturday(): Date {
  const now = new Date();
  const daysUntilSat = ((6 - now.getDay()) + 7) % 7 || 7;
  const sat = new Date(now);
  sat.setDate(now.getDate() + daysUntilSat);
  sat.setHours(0, 0, 0, 0);
  return sat;
}

function kickoffDate(sat: Date, offsetDays: number, hour: number, min: number): Date {
  const d = new Date(sat);
  d.setDate(sat.getDate() + offsetDays);
  d.setUTCHours(hour, min, 0, 0);
  return d;
}

function fmtTime(d: Date): string {
  return d.toISOString().slice(0, 16).replace("T", " ") + " GMT";
}

// ── Action handlers ─────────────────────────────────────────────────────────

function handleEvents() {
  const sat = nextSaturday();
  return FIXTURES.map((f) => {
    const [day, h, m] = f.ko;
    const kickoff = kickoffDate(sat, day, h, m);
    return {
      id:          f.id,
      sport:       "soccer",
      competition: f.competition,
      name:        `${f.home} vs ${f.away}`,
      start_time:  fmtTime(kickoff),
      status:      "scheduled",
      home_team:   f.home,
      away_team:   f.away,
      summary:     `${f.home} vs ${f.away} | ${f.competition} | ${fmtTime(kickoff)} | SCHEDULED`,
    };
  });
}

function handleOdds(eventId: string) {
  // Default to the Liverpool vs Tottenham marquee game
  const event = FIXTURES.find((f) => f.id === eventId) ?? FIXTURES[8];

  // Odds calibrated per match-up; fall back to generic spread for non-featured events
  const oddsMap: Record<string, { home: number; draw: number; away: number }[]> = {
    pl_009: [  // Liverpool vs Tottenham
      { home: 1.60, draw: 4.20, away: 5.00 },  // Cloudbet
      { home: 1.57, draw: 4.30, away: 5.20 },  // Stake
      { home: 1.62, draw: 4.10, away: 4.90 },  // Polymarket
    ],
    pl_004: [  // Arsenal vs Everton
      { home: 1.35, draw: 5.00, away: 8.50 },
      { home: 1.33, draw: 5.20, away: 8.80 },
      { home: 1.36, draw: 4.90, away: 8.40 },
    ],
    pl_005: [  // West Ham vs Man City
      { home: 2.60, draw: 3.30, away: 2.70 },
      { home: 2.55, draw: 3.40, away: 2.75 },
      { home: 2.65, draw: 3.25, away: 2.68 },
    ],
    pl_007: [  // Man Utd vs Aston Villa
      { home: 2.20, draw: 3.40, away: 3.20 },
      { home: 2.15, draw: 3.50, away: 3.30 },
      { home: 2.25, draw: 3.35, away: 3.15 },
    ],
  };

  const rows = oddsMap[event.id] ?? [
    { home: 2.10, draw: 3.40, away: 3.60 },
    { home: 2.05, draw: 3.45, away: 3.70 },
    { home: 2.15, draw: 3.35, away: 3.55 },
  ];

  const bookmakers = ["Cloudbet", "Stake", "Polymarket"];
  const outcomes = bookmakers.flatMap((bm, i) => [
    { bookmaker: bm, label: "Home", decimal_odds: rows[i].home, is_available: true },
    { bookmaker: bm, label: "Draw", decimal_odds: rows[i].draw, is_available: true },
    { bookmaker: bm, label: "Away", decimal_odds: rows[i].away, is_available: true },
  ]);

  // Compute best per label
  const labels = ["Home", "Draw", "Away"] as const;
  const best: Record<string, { odds: number; bookmaker: string }> = {};
  for (const label of labels) {
    const candidates = outcomes.filter((o) => o.label === label);
    const top = candidates.reduce((a, b) => (b.decimal_odds > a.decimal_odds ? b : a));
    best[label] = { odds: top.decimal_odds, bookmaker: top.bookmaker };
  }

  return {
    event_id: event.id,
    match:    `${event.home} vs ${event.away}`,
    markets:  [{ market_type: "winner", outcomes, best }],
  };
}

function handleValueBets() {
  const sat = nextSaturday();

  function ko(fixture: typeof FIXTURES[0]): string {
    const [day, h, m] = fixture.ko;
    return fmtTime(kickoffDate(sat, day, h, m));
  }

  // edge_pct = (fair_prob × decimal_odds - 1) × 100  — all verified below
  const raw = [
    {
      event_id:      "pl_005",
      event_summary: `West Ham vs Man City | Premier League | ${ko(FIXTURES[4])} | SCHEDULED`,
      market_type:   "winner",
      outcome_label: "Away",            // Man City Away — mkt overestimates City's slump
      decimal_odds:  3.20,
      fair_prob:     0.370,             // 3.20 × 0.370 − 1 = 18.4%
      edge_pct:      18.4,
      bookmaker:     "Cloudbet",
    },
    {
      event_id:      "pl_009",
      event_summary: `Liverpool vs Tottenham | Premier League | ${ko(FIXTURES[8])} | SCHEDULED`,
      market_type:   "winner",
      outcome_label: "Away",            // Spurs Away — inflated due to Liverpool hype
      decimal_odds:  4.50,
      fair_prob:     0.260,             // 4.50 × 0.260 − 1 = 17.0%
      edge_pct:      17.0,
      bookmaker:     "Stake",
    },
    {
      event_id:      "pl_007",
      event_summary: `Manchester United vs Aston Villa | Premier League | ${ko(FIXTURES[6])} | SCHEDULED`,
      market_type:   "winner",
      outcome_label: "Away",            // Villa Away undervalued at Old Trafford
      decimal_odds:  2.90,
      fair_prob:     0.380,             // 2.90 × 0.380 − 1 = 10.2%
      edge_pct:      10.2,
      bookmaker:     "Polymarket",
    },
    {
      event_id:      "pl_003",
      event_summary: `Chelsea vs Newcastle | Premier League | ${ko(FIXTURES[2])} | SCHEDULED`,
      market_type:   "winner",
      outcome_label: "Draw",            // Draw value — tight derby history
      decimal_odds:  3.70,
      fair_prob:     0.295,             // 3.70 × 0.295 − 1 = 9.2%
      edge_pct:      9.2,
      bookmaker:     "Cloudbet",
    },
  ];

  // Already sorted desc by edge_pct
  return raw;
}

function handleFindEvents(team: string) {
  const sat = nextSaturday();
  const q = team.toLowerCase();

  return FIXTURES
    .filter((f) => f.home.toLowerCase().includes(q) || f.away.toLowerCase().includes(q))
    .map((f) => {
      const [day, h, m] = f.ko;
      const kickoff = kickoffDate(sat, day, h, m);
      return {
        id:          f.id,
        sport:       "soccer",
        competition: f.competition,
        name:        `${f.home} vs ${f.away}`,
        start_time:  fmtTime(kickoff),
        status:      "scheduled",
        home_team:   f.home,
        away_team:   f.away,
        summary:     `${f.home} vs ${f.away} | ${f.competition} | ${fmtTime(kickoff)} | SCHEDULED`,
      };
    });
}

// ── Route handler ───────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(req: NextRequest) {
  const p       = req.nextUrl.searchParams;
  const action  = p.get("action")   ?? "events";
  const eventId = p.get("event_id") ?? "pl_009";
  const team    = p.get("team")     ?? "Arsenal";

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
