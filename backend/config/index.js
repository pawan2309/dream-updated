const number = (v, d) => (v != null && !isNaN(Number(v)) ? Number(v) : d);
const bool = (v, d) => {
  if (v == null) return d;
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase();
  if (['1', 'true', 'yes', 'y'].includes(s)) return true;
  if (['0', 'false', 'no', 'n'].includes(s)) return false;
  return d;
};

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: number(process.env.EXTERNAL_API_PORT, 4001),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: number(process.env.REDIS_PORT, 6379),
  redisPassword: process.env.REDIS_PASSWORD,
  redisDb: number(process.env.REDIS_DB, 0),

  // Postgres
  pgUrl: process.env.PG_URL || process.env.DATABASE_URL || 'postgresql://localhost:5432/betting',

  // JWT
  jwtSecret: process.env.JWT_SECRET || '',

  // TTLs
  ttl: {
    cricketFixtures: number(process.env.CRICKET_FIXTURE_TTL, 300),
    cricketScorecard: number(process.env.CRICKET_SCORECARD_TTL, 60),
    cricketOdds: number(process.env.CRICKET_ODDS_TTL, 30),
    casinoResult: number(process.env.CASINO_RESULT_TTL, 60)
  },

  // External API URLs
  api: {
    cricketFixtures: process.env.CRICKET_FIXTURES_URL || 'https://marketsarket.qnsports.live/cricketmatches',
    cricketOddsFeed: process.env.CRICKET_ODDS_FEED || process.env.CRICKET_ODDS_URL || 'https://marketsarket.qnsports.live/odds',
    cricketScorecardDetailed: process.env.CRICKET_DETAILED_SCORECARD_URL || 'https://data.shamexch.xyz/getscorecard?eventId=',
    cricketBM: process.env.CRICKET_BM_URL || 'https://data.shamexch.xyz/getbm?eventId=',
    casinoResults: process.env.CASINO_RESULTS_FEED || 'https://marketsarket.qnsports.live/casinoresult'
  },

  // Rate limit
  rateLimit: {
    refreshWindowMs: number(process.env.REFRESH_RATE_WINDOW_MS, 60_000),
    refreshMax: number(process.env.REFRESH_RATE_MAX, 30)
  }
};

module.exports = config;