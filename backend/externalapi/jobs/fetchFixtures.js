const logger = require('../utils/logger');
const { get: httpGet } = require('../utils/apiFetcher');
const redis = require('../utils/redis');
const db = require('../utils/database');
const { publish } = require('../../shared/redisPubSub');

const FIXTURES_URL = process.env.CRICKET_FIXTURES_URL || 'https://marketsarket.qnsports.live/cricketmatches';
const REDIS_KEY = 'cricket:fixtures';
const TTL_SECONDS = 300; // 5 minutes

async function normalizeFixture(raw) {
  // Extract primary and market IDs from API fixture
  const beventId = raw.beventId || raw.eventId || (raw.event && raw.event.id) || raw.id || null;
  const bmarketId = raw.bmarketId || raw.marketId || raw.bettingMarketId || null;
  const baseId = beventId || raw.id || raw.matchId || raw._id;

  if (!baseId) {
    logger.warn('Fixture has no identifiable ID, skipping');
    return null;
  }

  // Debug: show extracted IDs (remove or lower level logging in prod)
  logger.info('NORMALIZE: extracted IDs', { beventId, bmarketId, baseId });

  return {
    id: baseId,                  // keep a stable primary key for UI lists
    beventId: beventId,
    bmarketId: bmarketId,
    match_name: raw.name || raw.matchName || `${raw.team1 || ''} vs ${raw.team2 || ''}`.trim(),
    external_id: String(baseId), // legacy callers may still rely on this field
    team1: raw.team1 || raw.teamA || raw.home || null,
    team2: raw.team2 || raw.teamB || raw.away || null,
    start_time: raw.startTime || raw.start_time || raw.start || raw.startDate || null,
    status: raw.status || 'upcoming',
    raw: raw
  };
}

async function ensureTable() {
  const createSql = `
    CREATE TABLE IF NOT EXISTS cricket_fixtures (
      id SERIAL PRIMARY KEY,
      external_id TEXT UNIQUE,
      match_name TEXT,
      team1 TEXT,
      team2 TEXT,
      start_time TIMESTAMPTZ,
      status TEXT,
      raw JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_cricket_fixtures_external_id ON cricket_fixtures(external_id);
  `;
  await db.query(createSql);
}

async function upsertFixtures(fixtures) {
  if (!fixtures || fixtures.length === 0) return 0;

  const upsertSql = `
    INSERT INTO cricket_fixtures (external_id, match_name, team1, team2, start_time, status, raw, created_at, updated_at)
    VALUES ${fixtures.map((_, i) => `($${i*8+1}, $${i*8+2}, $${i*8+3}, $${i*8+4}, $${i*8+5}, $${i*8+6}, $${i*8+7}, NOW(), NOW())`).join(', ')}
    ON CONFLICT (external_id) DO UPDATE SET
      match_name = EXCLUDED.match_name,
      team1 = EXCLUDED.team1,
      team2 = EXCLUDED.team2,
      start_time = EXCLUDED.start_time,
      status = EXCLUDED.status,
      raw = EXCLUDED.raw,
      updated_at = NOW();
  `;

  const values = fixtures.flatMap(f => [
    f.external_id,
    f.match_name,
    f.team1,
    f.team2,
    f.start_time ? new Date(f.start_time) : null,
    f.status,
    JSON.stringify(f.raw)
  ]);

  await db.query(upsertSql, values);
  return fixtures.length;
}

async function fetchAndStoreFixtures() {
  logger.info('Fetching cricket fixtures...');

  // HTTP fetch
  const { data } = await httpGet(FIXTURES_URL, { timeout: 10000, retries: 2 });
  const list = Array.isArray(data) ? data : (data?.data || data?.matches || []);

  // Log the first raw fixture structure for debugging
  if (list && list.length > 0) {
    logger.info('RAW FIXTURE SAMPLE (before normalization):');
    logger.info(JSON.stringify(list[0], null, 2));
  }

  const normalized = [];
  for (const raw of list) {
    try {
      const f = await normalizeFixture(raw);
      if (f && f.beventId && f.bmarketId) normalized.push(f);
    } catch (e) {
      logger.warn('Skipping bad fixture record');
    }
  }

  // Cache in Redis
  await redis.set(REDIS_KEY, normalized, TTL_SECONDS);
  await publish('cricket:fixtures:updated', { ts: Date.now() });

  // Upsert in PostgreSQL
  await ensureTable();
  const count = await upsertFixtures(normalized);

  logger.info(`Fixtures fetched=${normalized.length}, upserted=${count}`);
  return { fetched: normalized.length, upserted: count };
}

module.exports = {
  fetchAndStoreFixtures
};