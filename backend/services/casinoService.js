const { Pool } = require('pg');
const config = require('../config');

class CasinoService {
  constructor() {
    this.pool = new Pool({
      connectionString: config.pgUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      maxUses: 7500,
      ssl: false // Disable SSL for local development
    });
  }

  // Get all casinos from database
  async getAllCasinos() {
    try {
      const client = await this.pool.connect();
      try {
        const result = await client.query(`
          SELECT id, event_id, name, short_name, bet_status, min_stake, max_stake, 
                 data_url, result_url, stream_id, last_updated
          FROM casino_tables 
          ORDER BY last_updated DESC
        `);
        return result.rows;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching casinos from DB:', error);
      throw error;
    }
  }

  // Get casino by streaming ID
  async getCasinoByStreamId(streamId) {
    try {
      const client = await this.pool.connect();
      try {
        const result = await client.query(`
          SELECT id, event_id, name, short_name, bet_status, min_stake, max_stake, 
                 data_url, result_url, stream_id, last_updated
          FROM casino_tables 
          WHERE stream_id = $1
        `, [parseInt(streamId)]);
        return result.rows[0] || null;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching casino by stream ID:', error);
      throw error;
    }
  }

  // Create or update casino in database
  async upsertCasino(casinoData) {
    try {
      const { streamingId, name, shortName, betStatus, minStake, maxStake, dataUrl, resultUrl } = casinoData;
      
      // Convert external API status to casino bet status
      // 'yes' or 'ON' means betting is allowed (OPEN)
      // 'no' or 'OFF' means betting is restricted (CLOSED)
      const casinoBetStatus = (betStatus === 'yes' || betStatus === 'ON') ? 'OPEN' : 'CLOSED';
      
      const client = await this.pool.connect();
      try {
        // First try to update existing record
        const updateResult = await client.query(`
          UPDATE casino_tables 
          SET name = $1, short_name = $2, bet_status = $3, min_stake = $4, max_stake = $5, 
              data_url = $6, result_url = $7, last_updated = NOW()
          WHERE stream_id = $8
          RETURNING *
        `, [name, shortName, casinoBetStatus, parseFloat(minStake) || 0, parseFloat(maxStake) || 0, 
             dataUrl, resultUrl, parseInt(streamingId)]);
        
        if (updateResult.rows.length > 0) {
          return updateResult.rows[0];
        }
        
        // If no update, insert new record
        const insertResult = await client.query(`
          INSERT INTO casino_tables (event_id, name, short_name, bet_status, min_stake, max_stake, 
                                   data_url, result_url, stream_id, last_updated)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          RETURNING *
        `, [parseInt(streamingId), name, shortName, casinoBetStatus, parseFloat(minStake) || 0, 
             parseFloat(maxStake) || 0, dataUrl, resultUrl, parseInt(streamingId)]);
        
        return insertResult.rows[0];
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error upserting casino:', error);
      throw error;
    }
  }

  // Sync casinos from external API to database
  async syncCasinosFromExternalAPI(externalCasinos) {
    try {
      const results = [];
      
      for (const casino of externalCasinos) {
        try {
          const result = await this.upsertCasino(casino);
          results.push(result);
        } catch (error) {
          console.error(`Error syncing casino ${casino.name}:`, error);
          results.push({ error: error.message, casino });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error syncing casinos:', error);
      throw error;
    }
  }

  // Get casino count
  async getCasinoCount() {
    try {
      const client = await this.pool.connect();
      try {
        const result = await client.query('SELECT COUNT(*) FROM casino_tables');
        return parseInt(result.rows[0].count);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error getting casino count:', error);
      throw error;
    }
  }

  // Ensure casino table exists
  async ensureTable() {
    try {
      const client = await this.pool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS casino_tables (
            id SERIAL PRIMARY KEY,
            event_id BIGINT NOT NULL,
            name VARCHAR(50) NOT NULL,
            short_name VARCHAR(20) NOT NULL,
            bet_status VARCHAR(10) DEFAULT 'OPEN',
            min_stake DECIMAL(10,2) DEFAULT 0,
            max_stake DECIMAL(10,2) DEFAULT 0,
            data_url TEXT,
            result_url TEXT,
            stream_id INTEGER,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // Create indexes for performance
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_casino_tables_stream_id ON casino_tables(stream_id)
        `);
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_casino_tables_bet_status ON casino_tables(bet_status)
        `);
        
        console.log('✅ Casino table and indexes created/verified');
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error ensuring casino table:', error);
      throw error;
    }
  }
}

module.exports = new CasinoService();
