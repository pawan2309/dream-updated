require('dotenv').config();
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

// Central sockets registrar
const registerSockets = require('./sockets');

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

            // Initialize Redis connection
            await redisClient.connect();
            logger.info('✅ Redis connected');

            // Initialize BullMQ queues (if not disabled)
            if (!process.env.DISABLE_QUEUES) {
                this.queues = await initializeQueues();
                logger.info('✅ BullMQ queues initialized');
            } else {
                logger.info('⏭️ BullMQ queues disabled by environment variable');
            }

            // Initialize Cron scheduler (if not disabled)
            if (!process.env.DISABLE_CRON) {
                await initializeCron();
                logger.info('✅ Cron scheduler initialized');
            } else {
                logger.info('⏭️ Cron scheduler disabled by environment variable');
            }

            // Setup middleware
            this.setupMiddleware();

            // Setup routes
            this.setupRoutes();

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
            next();
        });

        // Metrics
        this.app.use(metricsRouter);
    }

    setupRoutes() {
        this.app.get('/health', (req, res) => {
            res.status(200).json({ status: 'OK', timestamp: new Date().toISOString(), service: 'external-api' });
        });

        this.app.use(healthRoute);
        this.app.use(cricketSnapshotRoute);

        // Public auth routes (must be before jwtAuth())
        this.app.use('/auth', require('../auth/authRoutes'));

        // Public casino routes (no auth required)
        this.app.use('/api/casino', require('./routes/casino'));

        // Protected routes
        this.app.use(jwtAuth());
        this.app.use(previewRoute);
        this.app.use(refreshRoutes);
        this.app.use(adminRawRoutes);

        this.app.use('/api/status', statusRoutes);

        this.app.use('*', (req, res) => {
            res.status(404).json({ error: 'Route not found', path: req.originalUrl });
        });

        this.app.use((error, req, res, next) => {
            logger.error('Unhandled error:', error);
            res.status(500).json({ error: 'Internal server error', message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong' });
        });
    }

    setupSocketHandlers() {
        this.io.queues = this.queues;
        registerSockets(this.io);
    }

    async startServer() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, () => {
                logger.info(`🌐 Server listening on port ${this.port}`);
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

                    await redisClient.disconnect();
                    logger.info('✅ Redis disconnected');

                    await database.disconnect();
                    logger.info('✅ Database disconnected');

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