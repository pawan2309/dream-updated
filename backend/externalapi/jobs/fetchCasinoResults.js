const logger = require('../utils/logger');
const { get: httpGet } = require('../utils/apiFetcher');
const redis = require('../utils/redisClient');
const db = require('../utils/pgClient');
const { publish } = require('../../shared/redisPubSub');

const RESULTS_URL = process.env.CASINO_RESULTS_FEED || 'https://marketsarket.qnsports.live/casinoresult';
const REDIS_RESULTS_KEY = 'casino:results';
const REDIS_CURSOR_KEY = 'cursor:casino:last-time';
const RESULTS_TTL_SECONDS = 60;

function parseTime(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function normalizeResult(raw) {
  const game_id = String(raw.game_id || raw.gameId || raw.game || raw.table || '');
  const result_value = String(raw.result_value || raw.result || raw.winner || raw.outcome || '');
  const timeRaw = raw.time || raw.timestamp || raw.updated_at || raw.date;
  const time = parseTime(timeRaw) || new Date();
  const updated_at = new Date();
  return { game_id, result_value, time, raw, updated_at };
}

async function ensureTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS casino_results (
      id SERIAL PRIMARY KEY,
      game_id TEXT NOT NULL,
      result_value TEXT,
      time TIMESTAMPTZ,
      raw JSONB,
      updated_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (game_id, time)
    );
    CREATE INDEX IF NOT EXISTS idx_casino_results_game_time ON casino_results(game_id, time);
  `;
  await db.query(sql);
}

async function upsertResults(rows) {
  if (!rows || rows.length === 0) return 0;

  const placeholders = [];
  const values = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    values.push(r.game_id, r.result_value, r.time, JSON.stringify(r.raw), r.updated_at);
    const base = i * 5;
    placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
  }

  const sql = `
    INSERT INTO casino_results (game_id, result_value, time, raw, updated_at)
    VALUES ${placeholders.join(', ')}
    ON CONFLICT (game_id, time) DO UPDATE SET
      result_value = EXCLUDED.result_value,
      raw = EXCLUDED.raw,
      updated_at = EXCLUDED.updated_at;
  `;

  await db.query(sql, values);
  return rows.length;
}

async function fetchCasinoResults() {
  logger.info('Fetching casino results (cron job start)');
  try {
    // Load last processed time from Redis cursor
    const lastCursor = await redis.get(REDIS_CURSOR_KEY);
    const lastTime = lastCursor ? parseTime(lastCursor) : null;

    // Fetch from API
    const { data } = await httpGet(RESULTS_URL, { timeout: 8000, retries: 2 });
    const list = Array.isArray(data) ? data : (data?.data || data?.results || []);

    const normalized = [];
    for (const raw of list) {
      try {
        const item = normalizeResult(raw);
        if (!item.game_id) continue;
        if (lastTime && item.time && item.time <= lastTime) continue; // dedupe based on time cursor
        normalized.push(item);
      } catch (e) {
        // skip bad
      }
    }

    // Sort by time asc for stable upsert and cursor update
    normalized.sort((a, b) => a.time - b.time);

    // Cache new results in Redis (snapshot of new items)
    if (normalized.length > 0) {
      await redis.set(REDIS_RESULTS_KEY, normalized, RESULTS_TTL_SECONDS);
    }

    // Ensure table and upsert
    await ensureTable();
    const upserted = await upsertResults(normalized);

    // Advance cursor to latest processed time
    if (normalized.length > 0) {
      const latestTime = normalized[normalized.length - 1].time.toISOString();
      await redis.set(REDIS_CURSOR_KEY, latestTime, 24 * 60 * 60); // keep cursor for a day
    }

    // Publish update for socket sync
    if (normalized.length > 0) {
      await publish('casino:results:updated', { ts: Date.now(), count: normalized.length });
    }

    logger.info(`Casino results done: fetched=${list.length}, new=${normalized.length}, upserted=${upserted}`);
    return { fetched: list.length, new: normalized.length, upserted };
  } catch (error) {
    logger.error('Casino results job failed:', error);
    throw error;
  }
}

module.exports = {
  fetchCasinoResults
};