const logger = require('../utils/logger');
const { get: httpGet } = require('../utils/apiFetcher');
const redis = require('../utils/redisClient');
const db = require('../utils/pgClient');

const ODDS_URL = process.env.CRICKET_ODDS_FEED || process.env.CRICKET_ODDS_URL || 'https://marketsarket.qnsports.live/odds';
const REDIS_KEY = 'cricket:odds';
const TTL_SECONDS = 30; // 30 seconds

function normalizeOdd(raw) {
  // Attempt to map flexible shapes to a consistent record
  const matchId = String(
    raw.match_id || raw.matchId || raw.eventId || raw.id || raw.mid || ''
  );
  const market = String(raw.market || raw.marketName || raw.type || 'default');
  const odds = raw.odds || raw.prices || raw.rates || raw; // fallback to raw if structure unknown
  const status = raw.status || 'live';

  return { match_id: matchId, market, odds, status };
}

async function ensureTable() {
  const createSql = `
    CREATE TABLE IF NOT EXISTS cricket_odds (
      id SERIAL PRIMARY KEY,
      match_id TEXT NOT NULL,
      market TEXT NOT NULL,
      odds JSONB NOT NULL,
      status TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (match_id, market)
    );
    CREATE INDEX IF NOT EXISTS idx_cricket_odds_match_market ON cricket_odds(match_id, market);
  `;
  await db.query(createSql);
}

async function upsertOdds(oddsList) {
  if (!oddsList || oddsList.length === 0) return 0;

  const values = [];
  const placeholders = [];
  for (let i = 0; i < oddsList.length; i++) {
    const o = oddsList[i];
    // (match_id, market, odds, status)
    values.push(o.match_id, o.market, JSON.stringify(o.odds), o.status || null);
    const base = i * 4;
    placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, NOW(), NOW())`);
  }

  const sql = `
    INSERT INTO cricket_odds (match_id, market, odds, status, created_at, updated_at)
    VALUES ${placeholders.join(', ')}
    ON CONFLICT (match_id, market) DO UPDATE SET
      odds = EXCLUDED.odds,
      status = EXCLUDED.status,
      updated_at = NOW();
  `;

  await db.query(sql, values);
  return oddsList.length;
}

async function fetchAndStoreOdds() {
  logger.info('Fetching cricket odds...');

  const { data } = await httpGet(ODDS_URL, { timeout: 10000, retries: 2 });
  // Accept various shapes: array at root, or {data: []}
  const list = Array.isArray(data) ? data : (data?.data || data?.odds || []);

  const normalized = [];
  for (const raw of list) {
    try {
      const item = normalizeOdd(raw);
      if (item.match_id) normalized.push(item);
    } catch (e) {
      // Skip unparseable record
    }
  }

  // Cache whole set
  await redis.set(REDIS_KEY, normalized, TTL_SECONDS);

  // Persist
  await ensureTable();
  const count = await upsertOdds(normalized);

  logger.info(`Cricket odds fetched=${normalized.length}, upserted=${count}`);
  return { fetched: normalized.length, upserted: count };
}

module.exports = {
  fetchAndStoreOdds
};