const logger = require('../utils/logger');
const { get: httpGet } = require('../utils/apiFetcher');
const redis = require('../utils/redisClient');
const db = require('../utils/pgClient');
const { publish } = require('../../shared/redisPubSub');

const SCORECARD_URL = process.env.CRICKET_SCORECARD_FEED || 'http://172.104.206.227:3000/t10score';
const REDIS_KEY = 'cricket:scorecards';
const TTL_SECONDS = 60;

function normalizeScorecard(raw) {
  const external_match_id = String(
    raw.external_match_id || raw.match_id || raw.matchId || raw.eventId || raw.id || ''
  );
  const current_score = String(raw.current_score || raw.score || raw.runs || '');
  const overs = String(raw.overs || raw.over || '');
  const wickets = String(raw.wickets || raw.wkts || '');
  const inning = String(raw.inning || raw.innings || '1');
  const status = String(raw.status || 'live');
  const updated_at = new Date();

  return { external_match_id, current_score, overs, wickets, inning, status, raw, updated_at };
}

async function ensureTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS cricket_scorecards (
      id SERIAL PRIMARY KEY,
      external_match_id TEXT NOT NULL,
      current_score TEXT,
      overs TEXT,
      wickets TEXT,
      inning TEXT,
      status TEXT,
      raw JSONB,
      updated_at TIMESTAMPTZ NOT NULL,
      UNIQUE (external_match_id, inning)
    );
    CREATE INDEX IF NOT EXISTS idx_cricket_scorecards_match_inning ON cricket_scorecards(external_match_id, inning);
  `;
  await db.query(sql);
}

function deduplicate(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = `${r.external_match_id}|${r.inning}`;
    map.set(key, r);
  }
  return Array.from(map.values());
}

async function upsertScorecards(rows) {
  if (!rows || rows.length === 0) return 0;

  const placeholders = [];
  const values = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    values.push(
      r.external_match_id,
      r.current_score,
      r.overs,
      r.wickets,
      r.inning,
      r.status,
      JSON.stringify(r.raw),
      r.updated_at
    );
    const base = i * 8;
    placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`);
  }

  const sql = `
    INSERT INTO cricket_scorecards (
      external_match_id, current_score, overs, wickets, inning, status, raw, updated_at
    ) VALUES ${placeholders.join(', ')}
    ON CONFLICT (external_match_id, inning) DO UPDATE SET
      current_score = EXCLUDED.current_score,
      overs = EXCLUDED.overs,
      wickets = EXCLUDED.wickets,
      status = EXCLUDED.status,
      raw = EXCLUDED.raw,
      updated_at = EXCLUDED.updated_at;
  `;

  await db.query(sql, values);
  return rows.length;
}

async function fetchCricketScorecards() {
  logger.info('Fetching cricket scorecards (cron job start)');
  try {
    const { data } = await httpGet(SCORECARD_URL, { timeout: 10000, retries: 2 });
    const list = Array.isArray(data) ? data : (data?.data || data?.scorecards || []);

    const normalized = [];
    for (const raw of list) {
      try {
        const item = normalizeScorecard(raw);
        if (item.external_match_id) normalized.push(item);
      } catch (e) {
        // skip bad
      }
    }

    const deduped = deduplicate(normalized);

    await redis.set(REDIS_KEY, deduped, TTL_SECONDS);
    await publish('cricket:scorecards:updated', { ts: Date.now(), count: deduped.length });

    await ensureTable();
    const count = await upsertScorecards(deduped);

    logger.info(`Cricket scorecards done: fetched=${normalized.length}, deduped=${deduped.length}, upserted=${count}`);
    return { fetched: normalized.length, deduped: deduped.length, upserted: count };
  } catch (error) {
    logger.error('Cricket scorecards job failed:', error);
    throw error;
  }
}

module.exports = {
  fetchCricketScorecards
};