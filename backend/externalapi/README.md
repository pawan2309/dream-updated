# External API Integration System

A high-performance, modular API integration system for sports betting backend using Node.js, Redis, PostgreSQL, BullMQ, and node-cron.

## 🏗️ Architecture

```
externalapi/
├── index.js              # Main application server
├── package.json          # Dependencies and scripts
├── cron/                 # Scheduled job management
│   └── cronScheduler.js  # node-cron scheduler
├── queues/               # BullMQ queue management
│   └── queue.js          # Queue configuration
├── workers/              # BullMQ job processors
│   ├── cricketWorker.js  # Cricket data processing
│   ├── casinoWorker.js   # Casino data processing
│   ├── oddsWorker.js     # Odds data processing
│   └── scorecardWorker.js # Scorecard data processing
├── utils/                # Shared utilities
│   ├── logger.js         # Winston logging
│   ├── redis.js          # Redis connection & cache
│   ├── database.js       # PostgreSQL connection
│   └── apiFetcher.js     # HTTP request utility
├── services/             # API integrations (to be implemented)
├── sockets/              # Socket.IO handlers (to be implemented)
└── routes/               # HTTP routes (to be implemented)
```

## 🚀 Features

- **Scheduled Data Fetching**: Uses node-cron to fetch data at configurable intervals
- **Queue Management**: BullMQ for reliable job processing with retries and concurrency
- **Redis Caching**: Fast access to live data (odds, scores, fancy)
- **PostgreSQL Storage**: Persistent storage for match data and historical records
- **Real-time Updates**: Socket.IO for pushing data to client panels
- **Error Handling**: Comprehensive error handling and logging
- **Health Monitoring**: Built-in health checks and status endpoints

## 📋 Prerequisites

- Node.js 16+
- Redis 6+
- PostgreSQL 12+
- npm or yarn

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Create a `.env` file based on `.env.example`:
   ```bash
   # Server Configuration
   NODE_ENV=development
   EXTERNAL_API_PORT=4001
   FRONTEND_URL=http://localhost:3000

   # Redis Configuration
   REDIS_URL=redis://localhost:6379
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0

   # PostgreSQL Configuration
   PG_URL=postgresql://username:password@localhost:5432/betting
   DATABASE_URL=postgresql://username:password@localhost:5432/betting

   # External API URLs
   CRICKET_FIXTURES_URL=https://marketsarket.qnsports.live/cricketmatches
   CRICKET_ODDS_URL=https://data.shamexch.xyz/getbm
   CASINO_DATA_URL=http://159.65.20.25:3000/getdata
   CASINO_RESULTS_URL=http://159.65.20.25:3000/getresult
   CASINO_DETAIL_URL=http://159.65.20.25:3000/getdetailresult
   ```

3. **Database Setup:**
   Create the required PostgreSQL tables (see Database Schema section)

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Health Check
```bash
curl http://localhost:4001/health
```

## 📊 Scheduled Jobs

The system runs the following scheduled jobs:

| Job Type | Schedule | Description |
|----------|----------|-------------|
| Cricket Fixtures | Every 5 minutes | Fetch upcoming matches |
| Cricket Odds | Every 30 seconds | Fetch live odds for active matches |
| Cricket Scorecards | Every 1 minute | Fetch live score updates |
| Casino Data | Every 10 seconds | Fetch active casino games |
| Casino Results | Every 30 seconds | Fetch casino game results |
| Odds Data | Every 15 seconds | Fetch general odds data |
| Scorecard Data | Every 2 minutes | Fetch detailed scorecards |
| Health Check | Every 5 minutes | System health monitoring |

## 🔄 Queue System

### Queue Types
- **cricket-data-queue**: Cricket fixtures, odds, and scorecards
- **casino-data-queue**: Casino games and results
- **odds-data-queue**: General odds processing
- **scorecard-data-queue**: Scorecard processing

### Job Processing
- **Concurrency**: Configurable per queue (5-10 workers)
- **Retries**: 3 attempts with exponential backoff
- **Job Cleanup**: Automatic cleanup of completed/failed jobs

## 💾 Data Storage

### Redis Cache
- **Live Data**: Odds, scores, active games (TTL: 15s - 5min)
- **Statistics**: Game stats, odds analysis (TTL: 1 hour)
- **Health Status**: System health information (TTL: 5 min)

### PostgreSQL Tables
- **cricket_fixtures**: Match information
- **cricket_odds**: Historical odds data
- **cricket_scorecards**: Match scorecards
- **casino_games**: Active casino games
- **casino_results**: Game results
- **odds_history**: Historical odds
- **scorecards_history**: Historical scorecards
- **system_health_logs**: Health monitoring

## 🔌 API Endpoints

### Health & Status
- `GET /health` - Application health check
- `GET /api/status/queues` - Queue status
- `GET /api/status/cron` - Cron job status
- `GET /api/status/redis` - Redis connection status
- `GET /api/status/database` - Database connection status

## 📡 Socket.IO Events

The system will emit the following events (to be implemented):

### Cricket Events
- `cricket:fixtures:update` - New fixtures available
- `cricket:odds:update` - Live odds updates
- `cricket:scorecard:update` - Live score updates

### Casino Events
- `casino:game:update` - Active game updates
- `casino:result:update` - New game results
- `casino:stats:update` - Statistics updates

## 🔧 Configuration

### Cron Schedules
Modify schedules in `cron/cronScheduler.js`:

```javascript
// Example: Change cricket fixtures to every 10 minutes
this.scheduleTask('cricket-fixtures', '*/10 * * * *', async () => {
    // Job logic
});
```

### Queue Configuration
Modify queue settings in `queues/queue.js`:

```javascript
const queueConfigs = {
    cricket: {
        name: 'cricket-data-queue',
        concurrency: 5,  // Number of workers
        processor: cricketJobProcessor
    }
};
```

### Redis TTL Settings
Modify cache TTL in worker files:

```javascript
// Example: Change odds cache to 1 minute
await redis.set(cacheKey, odd, 60); // 60 seconds
```

## 🐛 Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server is running
   - Verify connection string in `.env`

2. **PostgreSQL Connection Failed**
   - Check PostgreSQL server is running
   - Verify database credentials in `.env`

3. **Queue Jobs Not Processing**
   - Check Redis connection
   - Verify worker processes are running
   - Check job logs for errors

4. **Cron Jobs Not Running**
   - Verify cron scheduler is initialized
   - Check cron schedule format
   - Review application logs

### Logging

The system uses Winston for logging with the following levels:
- `error`: Application errors
- `warn`: Warning messages
- `info`: General information
- `debug`: Detailed debugging (development only)

Logs are written to:
- Console (development)
- `logs/error.log` (errors only)
- `logs/combined.log` (all logs)

## 🔄 Adding New Data Sources

### 1. Create API Service
Add new service in `services/` directory:

```javascript
// services/newApiService.js
const apiFetcher = require('../utils/apiFetcher');

async function fetchNewData() {
    const response = await apiFetcher.get('https://api.example.com/data');
    return response.data;
}

module.exports = { fetchNewData };
```

### 2. Add Cron Job
Add scheduled job in `cron/cronScheduler.js`:

```javascript
// Schedule new data fetching
this.scheduleTask('new-data', '*/5 * * * *', async () => {
    const data = await fetchNewData();
    await addJob('new-queue', 'process-new-data', { data });
});
```

### 3. Create Worker
Add worker in `workers/` directory:

```javascript
// workers/newWorker.js
async function newWorker(job) {
    const { name, data } = job;
    
    switch (name) {
        case 'process-new-data':
            return await processNewData(data);
    }
}

module.exports = newWorker;
```

### 4. Update Queue Configuration
Add queue in `queues/queue.js`:

```javascript
const queueConfigs = {
    newQueue: {
        name: 'new-data-queue',
        concurrency: 3,
        processor: require('../workers/newWorker')
    }
};
```

## 📈 Monitoring

### Queue Monitoring
```bash
curl http://localhost:4001/api/status/queues
```

### Cron Job Monitoring
```bash
curl http://localhost:4001/api/status/cron
```

### Redis Monitoring
```bash
curl http://localhost:4001/api/status/redis
```

## 🔒 Security

- **CORS**: Configured for frontend origin
- **Helmet**: Security headers enabled
- **Input Validation**: All inputs validated
- **Rate Limiting**: Implemented in API fetcher
- **Error Handling**: No sensitive data in error responses

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the logs for error details 