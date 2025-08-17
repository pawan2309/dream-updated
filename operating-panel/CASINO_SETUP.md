# Casino Database Setup Guide

## Overview
This system now stores casino data in a PostgreSQL database instead of fetching from external APIs every time. This provides:
- **Faster page loads** - No more loading messages on refresh
- **Persistent data** - Casino information is stored permanently
- **Dynamic updates** - New casino games are automatically added when they appear in external APIs

## Database Setup

### 1. Create the Casino Table
Run the SQL migration in your PostgreSQL database:

```sql
-- Run this in your PostgreSQL database
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
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_casino_tables_stream_id ON casino_tables(stream_id);
CREATE INDEX IF NOT EXISTS idx_casino_tables_bet_status ON casino_tables(bet_status);
```

### 2. Update Prisma Schema
The Prisma schema has been updated with the new `CasinoTable` model.

### 3. Generate Prisma Client
```bash
cd operating-panel/apps/frontend
npx prisma generate
```

## How It Works

### Initial Load
1. **First visit**: Fetches data from external APIs and stores in database
2. **Subsequent visits**: Loads data instantly from database (no loading message)

### Data Refresh
- **Manual refresh**: Click the "Refresh" button to fetch fresh data from external APIs
- **Automatic sync**: External API data is synced to database when refresh is requested

### Dynamic Updates
- **New casino games**: Automatically detected and added to database
- **Status changes**: Bet status updates are synced from external APIs
- **Stake changes**: Min/max stakes are updated from external sources

## API Endpoints

### GET /api/casino
- **Default**: Returns data from database
- **With refresh**: `?refresh=true` fetches fresh data from external APIs and syncs to DB
- **With status filter**: `?status=yes` filters by bet status

### Response Format
```json
{
  "success": true,
  "message": "Casino data retrieved successfully",
  "data": [...],
  "source": "database" | "external-api-synced",
  "lastUpdated": "timestamp"
}
```

## Frontend Changes

### Casino List Page
- **No loading message** on page refresh
- **Instant data display** from database
- **Refresh button** for manual updates
- **Last updated timestamp** display

### View Details Page
- **Casino configuration** form
- **Database-driven data** instead of external API calls
- **Real-time updates** when external data changes

## Benefits

1. **Performance**: Page loads instantly after first visit
2. **Reliability**: Data available even if external APIs are down
3. **Scalability**: Database can handle many more casino games
4. **User Experience**: No more waiting for external API responses
5. **Data Persistence**: Casino configurations are saved permanently

## Troubleshooting

### If data doesn't load:
1. Check database connection
2. Verify casino_tables table exists
3. Click refresh button to force external API sync
4. Check backend logs for errors

### If new casinos don't appear:
1. Click refresh button to sync from external APIs
2. Check external API endpoints are accessible
3. Verify backend casino service is running

## Database Schema

| Field | Type | Description |
|-------|------|-------------|
| id | SERIAL | Primary key |
| event_id | BIGINT | External event identifier |
| name | VARCHAR(50) | Casino game name |
| short_name | VARCHAR(20) | Short identifier |
| bet_status | VARCHAR(10) | **OPEN** = Betting allowed, **CLOSED** = Betting restricted |
| min_stake | DECIMAL(10,2) | Minimum bet amount |
| max_stake | DECIMAL(10,2) | Maximum bet amount |
| data_url | TEXT | External data API URL |
| result_url | TEXT | External result API URL |
| stream_id | INTEGER | Streaming identifier |
| last_updated | TIMESTAMP | Last sync timestamp |

## Important Note on Bet Status

**Casino Bet Status** (`OPEN`/`CLOSED`) is **NOT** the same as **Cricket Bet Status** (`PENDING`/`WON`/`LOST`):

- **Casino Bet Status**: Controls whether users can place bets on casino games
  - `OPEN`: Users can place bets on this casino game
  - `CLOSED`: Betting is restricted on this casino game

- **Cricket Bet Status**: Tracks individual bet outcomes
  - `PENDING`: Bet is active and waiting for result
  - `WON`: Bet was successful
  - `LOST`: Bet was unsuccessful
