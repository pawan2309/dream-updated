require('dotenv').config({ path: __dirname + '/.env' });
console.log('🔍 [ENV] JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES' : 'NO');
console.log('🔍 [ENV] JWT_SECRET value:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'NOT SET');
console.log('🔍 [ENV] .env file path:', __dirname + '/.env');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Import utilities
const logger = require('./utils/logger');
const redisClient = require('./utils/redis');
const database = require('./utils/database');
const config = require('../config');
const jwtAuth = require('../shared/middleware/jwtAuth');

// Import queue and scheduler
const { initializeQueues } = require('./queues/queue');
const { initialize: initializeCron } = require('./cron/cronScheduler');

// Import routes
const statusRoutes = require('./routes/status');
const healthRoute = require('./routes/health');
const cricketSnapshotRoute = require('./routes/cricketSnapshot');
const previewRoute = require('./routes/preview');
const refreshRoutes = require('./routes/refreshRoutes');
const adminRawRoutes = require('./routes/adminRaw');
const { router: metricsRouter } = require('./routes/metrics');
const fixturesApiRoutes = require('./routes/fixturesApi');

// Central sockets registrar
const registerSockets = require('./sockets');
const autoMatchSync = require('./services/autoMatchSync');

class ExternalApiServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: config.frontendUrl,
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });
        
        this.port = config.port;
        this.queues = null;
    }

    async initialize() {
        try {
            logger.info('🚀 Initializing External API Server...');

            // Initialize database connection
            await database.connect();
            logger.info('✅ Database connected');

            // Initialize Redis connection FIRST
            await redisClient.connect();
            logger.info('✅ Redis connected');

            // ------------------------------------------------------------------
            // Start background cache refresh for cricket fixtures
            // ------------------------------------------------------------------
            try {
                const { startCricketFixturesCache } = require('./services/cricketFixturesCache');
                await startCricketFixturesCache();
                logger.info('✅ Cricket fixtures cache service initialised');
            } catch (cacheError) {
                logger.error('❌ Failed to initialise cricket fixtures cache service:', cacheError);
            }

            // Setup middleware
            this.setupMiddleware();

            // Setup routes AFTER Redis is connected
            this.setupRoutes();

            // Initialize BullMQ queues (if not disabled)
            if (process.env.DISABLE_BULLMQ !== 'true') {
                try {
                    const fixturesQueue = require('./queues/fixturesQueue');
                    const fixturesQueueInstance = new fixturesQueue();
                    
                    // Initialize fixtures queue
                    await fixturesQueueInstance.initialize();
                    
                    // Schedule recurring jobs
                    await fixturesQueueInstance.scheduleRecurringJobs();
                    
                    // Store reference for cleanup
                    this.app.locals.fixturesQueue = fixturesQueueInstance;
                    
                    logger.info('✅ Fixtures queue initialized');
                } catch (error) {
                    logger.error('❌ Failed to initialize fixtures queue:', error.message);
                }
            }

            // Start auto-match sync service
            try {
                autoMatchSync.start();
                logger.info('✅ Auto-match sync service started');
            } catch (syncError) {
                logger.error('❌ Failed to start auto-match sync service:', syncError);
            }

            // Initialize Cron scheduler (if not disabled)
            if (!process.env.DISABLE_CRON) {
                await initializeCron();
                logger.info('✅ Cron scheduler initialized');
            } else {
                logger.info('⏭️ Cron scheduler disabled by environment variable');
            }

            // Setup socket handlers (if not disabled)
            if (!process.env.DISABLE_SOCKETS) {
                this.setupSocketHandlers();
            } else {
                logger.info('⏭️ Socket handlers disabled by environment variable');
            }

            // Start the server
            await this.startServer();

            // Setup graceful shutdown
            this.setupGracefulShutdown();

            logger.info(`🎯 External API Server running on port ${this.port}`);

        } catch (error) {
            logger.error('❌ Failed to initialize External API Server:', error);
            process.exit(1);
        }
    }

    setupMiddleware() {
        this.app.use(helmet());
        // Allow multiple dev origins and subdomains locally
        const staticAllowed = new Set([config.frontendUrl].filter(Boolean));
        const allowedOriginPatterns = [
            /^http:\/\/localhost:\d+$/,                           // plain localhost ports
            /^https?:\/\/[a-z0-9-]+\.localhost(?::\d+)?$/,      // subdomain.localhost
            /^https?:\/\/[a-z0-9-]+\.batxgames\.site(?::\d+)?$/ // role.batxgames.site
        ];
        this.app.use(cors({
            origin: (origin, callback) => {
                if (!origin) return callback(null, true); // non-browser or same-origin
                if (staticAllowed.has(origin)) return callback(null, true);
                if (allowedOriginPatterns.some((re) => re.test(origin))) return callback(null, true);
                return callback(null, false);
            },
            credentials: true
        }));
        this.app.use(compression());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        this.app.use((req, res, next) => {
            logger.info(`${req.method} ${req.path} - ${req.ip}`);
            logger.info(`🔍 Request URL: ${req.originalUrl}`);
            logger.info(`🔍 Request path: ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        this.app.get('/health', (req, res) => {
            res.status(200).json({ status: 'OK', timestamp: new Date().toISOString(), service: 'external-api' });
        });

        // Public health routes (no auth required)
        this.app.use('/health', healthRoute);
        
        // Public provider routes (no auth required) - MUST BE FIRST
        this.app.use('/provider', require('./routes/publicProvider'));

        // Public cricket routes (no auth required)
        this.app.use('/cricket', cricketSnapshotRoute);

        // Public auth routes (must be before jwtAuth())
        this.app.use('/auth', require('../auth/authRoutes'));
        
        // Public POC auth routes (no auth required)
        this.app.use('/public-auth', require('./routes/publicAuth'));

        // Public casino routes (no auth required)
        this.app.use('/api/casino', require('./routes/casino'));

        // Public odds API routes (no auth required)
        this.app.use('/api/odds', require('./routes/odds'));

        // Debug routes for troubleshooting (PUBLIC - no auth required)
        this.app.use('/debug', require('./routes/debug'));

        // Protected routes
        this.app.use(jwtAuth());
        this.app.use(previewRoute);
        this.app.use(refreshRoutes);
        this.app.use(adminRawRoutes);

        // Protected bets routes (require authentication)
        this.app.use('/api/bets', require('./routes/bets'));

        // Protected matches routes (require authentication)
        this.app.use('/api/matches', require('./routes/matches'));

        // Protected bet settlement routes (require authentication)
        this.app.use('/api/bet-settlement', require('./routes/betSettlement'));

        // Protected client ledger routes (require authentication)
        this.app.use('/api/client-ledger', require('./routes/clientLedger'));

        // Protected market management routes (require authentication)
        this.app.use('/api/market', require('./routes/marketManagement'));

        // Add fixtures API routes
        this.app.use('/api/fixtures', fixturesApiRoutes);

        // Metrics endpoint (protected)
        this.app.use('/metrics', metricsRouter);

        this.app.use('/api/status', statusRoutes);

        this.app.use((error, req, res, next) => {
            logger.error('Unhandled error:', error);
            res.status(500).json({ error: 'Internal server error', message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong' });
        });

        // Catch-all route for unmatched paths (must be last)
        this.app.use('*', (req, res) => {
            logger.info(`404 - Route not found: ${req.originalUrl}`);
            res.status(404).json({ error: 'Route not found', path: req.originalUrl });
        });
    }

    setupSocketHandlers() {
        this.io.queues = this.queues;
        registerSockets(this.io);
    }

    async startServer() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, '0.0.0.0', () => {
                logger.info(`🌐 Server listening on 0.0.0.0:${this.port}`);
                resolve();
            });

            this.server.on('error', (error) => {
                logger.error('Server error:', error);
                reject(error);
            });
        });
    }

    setupGracefulShutdown() {
        const gracefulShutdown = async (signal) => {
            logger.info(`🛑 Received ${signal}. Starting graceful shutdown...`);

            this.server.close(async () => {
                logger.info('🔌 HTTP server closed');

                try {
                    if (this.queues) {
                        await Promise.all([
                            this.queues.cricketQueue?.close?.(),
                            this.queues.casinoQueue?.close?.()
                        ]);
                        logger.info('✅ BullMQ queues closed');
                    }

                    const { stopAllTasks } = require('./cron/cronScheduler');
                    stopAllTasks();
                    logger.info('✅ Cron tasks stopped');

                    // Stop auto-match sync service
                    try {
                        autoMatchSync.stop();
                        logger.info('✅ Auto-match sync service stopped');
                    } catch (syncError) {
                        logger.error('❌ Error stopping auto-match sync service:', syncError);
                    }

                    await redisClient.disconnect();
                    logger.info('✅ Redis disconnected');

                    await database.disconnect();
                    logger.info('✅ Database disconnected');

                    // Close fixtures queue
                    if (this.app.locals.fixturesQueue) {
                        try {
                            await this.app.locals.fixturesQueue.close();
                            logger.info('✅ Fixtures queue closed');
                        } catch (error) {
                            logger.error('❌ Error closing fixtures queue:', error.message);
                        }
                    }

                    logger.info('🎯 Graceful shutdown completed');
                    process.exit(0);
                } catch (error) {
                    logger.error('❌ Error during shutdown:', error);
                    process.exit(1);
                }
            });
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('uncaughtException', (error) => {
            logger.error('❌ Uncaught Exception:', error);
            gracefulShutdown('uncaughtException');
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('unhandledRejection');
        });
    }
}

if (require.main === module) {
    const server = new ExternalApiServer();
    server.initialize().catch((error) => {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    });
}

module.exports = ExternalApiServer; 