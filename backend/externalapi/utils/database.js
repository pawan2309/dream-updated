const { Pool } = require('pg');
const logger = require('./logger');

class DatabaseManager {
    constructor() {
        this.pool = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            const connectionString = process.env.PG_URL || process.env.DATABASE_URL || 
                'postgresql://localhost:5432/betting';

            this.pool = new Pool({
                connectionString,
                max: 20, // Maximum number of clients in the pool
                idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
                connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
                maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
            });

            // Setup event listeners
            this.setupEventListeners();

            // Test the connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();

            this.isConnected = true;
            logger.info('✅ PostgreSQL connected successfully');
            return this.pool;

        } catch (error) {
            logger.error('❌ Failed to connect to PostgreSQL:', error);
            throw error;
        }
    }

    setupEventListeners() {
        this.pool.on('connect', (client) => {
            logger.debug('🔌 New PostgreSQL client connected');
        });

        this.pool.on('error', (err, client) => {
            logger.error('❌ PostgreSQL pool error:', err);
            this.isConnected = false;
        });

        this.pool.on('acquire', (client) => {
            logger.debug('📥 PostgreSQL client acquired from pool');
        });

        this.pool.on('release', (client) => {
            logger.debug('📤 PostgreSQL client released to pool');
        });
    }

    async disconnect() {
        try {
            if (this.pool) {
                await this.pool.end();
                this.isConnected = false;
                logger.info('✅ PostgreSQL disconnected');
            }
        } catch (error) {
            logger.error('❌ Error disconnecting PostgreSQL:', error);
            throw error;
        }
    }

    async query(text, params = []) {
        try {
            if (!this.isConnected) {
                throw new Error('Database not connected');
            }

            const start = Date.now();
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;

            logger.debug(`📊 Query executed in ${duration}ms: ${text.substring(0, 100)}...`);
            return result;

        } catch (error) {
            logger.error(`❌ Query failed: ${text.substring(0, 100)}...`, error);
            throw error;
        }
    }

    async getClient() {
        try {
            if (!this.isConnected) {
                throw new Error('Database not connected');
            }

            return await this.pool.connect();
        } catch (error) {
            logger.error('❌ Failed to get database client:', error);
            throw error;
        }
    }

    // Transaction helper
    async transaction(callback) {
        const client = await this.getClient();
        
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Utility methods for common operations
    async findOne(table, conditions = {}, columns = ['*']) {
        try {
            const whereClause = Object.keys(conditions).length > 0 
                ? 'WHERE ' + Object.keys(conditions).map(key => `${key} = $${Object.keys(conditions).indexOf(key) + 1}`).join(' AND ')
                : '';
            
            const query = `SELECT ${columns.join(', ')} FROM ${table} ${whereClause} LIMIT 1`;
            const values = Object.values(conditions);
            
            const result = await this.query(query, values);
            return result.rows[0] || null;

        } catch (error) {
            logger.error(`❌ findOne failed for table ${table}:`, error);
            throw error;
        }
    }

    async findMany(table, conditions = {}, columns = ['*'], orderBy = null, limit = null) {
        try {
            const whereClause = Object.keys(conditions).length > 0 
                ? 'WHERE ' + Object.keys(conditions).map(key => `${key} = $${Object.keys(conditions).indexOf(key) + 1}`).join(' AND ')
                : '';
            
            let query = `SELECT ${columns.join(', ')} FROM ${table} ${whereClause}`;
            
            if (orderBy) {
                query += ` ORDER BY ${orderBy}`;
            }
            
            if (limit) {
                query += ` LIMIT ${limit}`;
            }
            
            const values = Object.values(conditions);
            const result = await this.query(query, values);
            return result.rows;

        } catch (error) {
            logger.error(`❌ findMany failed for table ${table}:`, error);
            throw error;
        }
    }

    async insert(table, data) {
        try {
            const columns = Object.keys(data);
            const values = Object.values(data);
            const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
            
            const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
            const result = await this.query(query, values);
            
            return result.rows[0];

        } catch (error) {
            logger.error(`❌ insert failed for table ${table}:`, error);
            throw error;
        }
    }

    async update(table, data, conditions) {
        try {
            const setClause = Object.keys(data).map(key => `${key} = $${Object.keys(data).indexOf(key) + 1}`).join(', ');
            const whereClause = Object.keys(conditions).map(key => `${key} = $${Object.keys(data).length + Object.keys(conditions).indexOf(key) + 1}`).join(' AND ');
            
            const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`;
            const values = [...Object.values(data), ...Object.values(conditions)];
            
            const result = await this.query(query, values);
            return result.rows;

        } catch (error) {
            logger.error(`❌ update failed for table ${table}:`, error);
            throw error;
        }
    }

    async delete(table, conditions) {
        try {
            const whereClause = Object.keys(conditions).map(key => `${key} = $${Object.keys(conditions).indexOf(key) + 1}`).join(' AND ');
            const query = `DELETE FROM ${table} WHERE ${whereClause} RETURNING *`;
            const values = Object.values(conditions);
            
            const result = await this.query(query, values);
            return result.rows;

        } catch (error) {
            logger.error(`❌ delete failed for table ${table}:`, error);
            throw error;
        }
    }

    async count(table, conditions = {}) {
        try {
            const whereClause = Object.keys(conditions).length > 0 
                ? 'WHERE ' + Object.keys(conditions).map(key => `${key} = $${Object.keys(conditions).indexOf(key) + 1}`).join(' AND ')
                : '';
            
            const query = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;
            const values = Object.values(conditions);
            
            const result = await this.query(query, values);
            return parseInt(result.rows[0].count);

        } catch (error) {
            logger.error(`❌ count failed for table ${table}:`, error);
            throw error;
        }
    }

    // Health check
    async ping() {
        try {
            if (!this.isConnected) {
                return false;
            }

            const result = await this.query('SELECT NOW()');
            return result.rows.length > 0;
        } catch (error) {
            logger.error('❌ Database ping failed:', error);
            return false;
        }
    }

    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            totalCount: this.pool ? this.pool.totalCount : 0,
            idleCount: this.pool ? this.pool.idleCount : 0,
            waitingCount: this.pool ? this.pool.waitingCount : 0
        };
    }
}

// Create singleton instance
const databaseManager = new DatabaseManager();

// Export functions
async function connect() {
    return await databaseManager.connect();
}

async function disconnect() {
    return await databaseManager.disconnect();
}

async function query(text, params) {
    return await databaseManager.query(text, params);
}

async function getClient() {
    return await databaseManager.getClient();
}

async function transaction(callback) {
    return await databaseManager.transaction(callback);
}

async function findOne(table, conditions, columns) {
    return await databaseManager.findOne(table, conditions, columns);
}

async function findMany(table, conditions, columns, orderBy, limit) {
    return await databaseManager.findMany(table, conditions, columns, orderBy, limit);
}

async function insert(table, data) {
    return await databaseManager.insert(table, data);
}

async function update(table, data, conditions) {
    return await databaseManager.update(table, data, conditions);
}

async function deleteRows(table, conditions) {
    return await databaseManager.delete(table, conditions);
}

async function count(table, conditions) {
    return await databaseManager.count(table, conditions);
}

async function ping() {
    return await databaseManager.ping();
}

function getConnectionStatus() {
    return databaseManager.getConnectionStatus();
}

module.exports = {
    connect,
    disconnect,
    query,
    getClient,
    transaction,
    findOne,
    findMany,
    insert,
    update,
    delete: deleteRows,
    deleteRows,
    count,
    ping,
    getConnectionStatus,
    pool: databaseManager.pool
}; 