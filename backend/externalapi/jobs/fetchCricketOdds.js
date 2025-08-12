const logger = require('../utils/logger');
const { get: httpGet } = require('../utils/apiFetcher');
const redis = require('../utils/redisClient');
const db = require('../utils/pgClient');

const ODDS_URL = process.env.CRICKET_ODDS_FEED || 'https://marketsarket.qnsports.live/cricketodds';
const REDIS_KEY = 'cricket:odds';
const TTL_SECONDS = 10; // 10 seconds

function normalizeOdd(raw) {
  const external_match_id = String(
    raw.external_match_id || raw.match_id || raw.matchId || raw.eventId || raw.id || ''
  );
  const market_name = String(raw.market_name || raw.market || raw.marketName || raw.type || 'default');
  const odds = raw.odds || raw.prices || raw.rates || raw; // fallback
  const updated_at = new Date();

  return { external_match_id, market_name, odds, updated_at, raw };
}

async function ensureTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS cricket_odds (
      id SERIAL PRIMARY KEY,
      external_match_id TEXT NOT NULL,
      market_name TEXT NOT NULL,
      odds JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      raw JSONB,
      UNIQUE (external_match_id, market_name)
    );
    CREATE INDEX IF NOT EXISTS idx_cricket_odds_match_market ON cricket_odds(external_match_id, market_name);
  `;
  await db.query(sql);
}

function deduplicate(oddsList) {
  const map = new Map();
  for (const o of oddsList) {
    const key = `${o.external_match_id}|${o.market_name}`;
    map.set(key, o); // last write wins
  }
  return Array.from(map.values());
}

async function upsertOdds(rows) {
  if (!rows || rows.length === 0) return 0;

  const placeholders = [];
  const values = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    values.push(r.external_match_id, r.market_name, JSON.stringify(r.odds), r.updated_at, JSON.stringify(r.raw));
    const base = i * 5;
    placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
  }

  const sql = `
    INSERT INTO cricket_odds (external_match_id, market_name, odds, updated_at, raw)
    VALUES ${placeholders.join(', ')}
    ON CONFLICT (external_match_id, market_name)
    DO UPDATE SET
      odds = EXCLUDED.odds,
      updated_at = EXCLUDED.updated_at,
      raw = EXCLUDED.raw;
  `;

  await db.query(sql, values);
  return rows.length;
}

async function fetchCricketOdds() {
  logger.info('Fetching cricket odds (cron job start)');
  try {
    const { data } = await httpGet(ODDS_URL, { timeout: 10000, retries: 2 });
    const list = Array.isArray(data) ? data : (data?.data || data?.odds || []);

    const normalized = [];
    for (const raw of list) {
      try {
        const item = normalizeOdd(raw);
        if (item.external_match_id) normalized.push(item);
      } catch (e) {
        // skip bad record
      }
    }

    const deduped = deduplicate(normalized);

    // Cache in Redis
    await redis.set(REDIS_KEY, deduped, TTL_SECONDS);

    // Ensure table and upsert
    await ensureTable();
    const count = await upsertOdds(deduped);

    logger.info(`Cricket odds done: fetched=${normalized.length}, deduped=${deduped.length}, upserted=${count}`);
    return { fetched: normalized.length, deduped: deduped.length, upserted: count };
  } catch (error) {
    logger.error('Cricket odds job failed:', error);
    throw error;
  }
}

module.exports = {
  fetchCricketOdds
};