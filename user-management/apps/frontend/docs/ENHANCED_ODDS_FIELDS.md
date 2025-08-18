# Enhanced Odds Fields Documentation

## Overview

The betting system now includes enhanced odds data storage to provide a complete audit trail of odds information when bets are placed. This allows for better tracking, analysis, and settlement accuracy.

## New Fields Added to Bet Table

### 1. `marketType` (String)
- **Purpose**: Identifies the type of betting market
- **Values**: 
  - `match_winner` - Traditional match outcome betting
  - `cricketcasino` - Session/in-play betting (over/under, runs, etc.)
  - `tied_match` - Draw/tie betting markets
  - `custom` - Other market types

### 2. `oddsSnapshot` (JSONB)
- **Purpose**: Complete snapshot of odds data when bet was placed
- **Structure**:
```json
{
  "market": {
    "id": "market_id",
    "name": "Market Name",
    "type": "market_type",
    "minStake": 100,
    "maxStake": 500000,
    "status": "active"
  },
  "selection": {
    "id": "selection_id",
    "name": "Selection Name",
    "odds": 2.5,
    "stake": 1000,
    "type": "back",
    "tier": 1
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "matchId": "match_id"
}
```

### 3. `oddsTier` (Integer)
- **Purpose**: Which tier of odds the user received
- **Values**: 
  - `1` - Best odds (first tier)
  - `2` - Second best odds
  - `3` - Third best odds
  - etc.

### 4. `availableStake` (Float)
- **Purpose**: Available stake at that odds level when bet was placed
- **Use Case**: Track liquidity and market depth

## Database Migration

### Option 1: Using Prisma Migrate (Recommended)
```bash
cd user-management/apps/frontend
npx prisma migrate dev --name add_enhanced_odds_fields
```

### Option 2: Manual Migration
```bash
cd user-management/apps/frontend
node scripts/run-migration.js
```

### Option 3: Direct SQL
```sql
-- Add new columns
ALTER TABLE "Bet" ADD COLUMN "marketType" TEXT;
ALTER TABLE "Bet" ADD COLUMN "oddsSnapshot" JSONB;
ALTER TABLE "Bet" ADD COLUMN "oddsTier" INTEGER;
ALTER TABLE "Bet" ADD COLUMN "availableStake" DOUBLE PRECISION;

-- Add indexes
CREATE INDEX "Bet_marketType_idx" ON "Bet"("marketType");
CREATE INDEX "Bet_oddsTier_idx" ON "Bet"("oddsTier");
```

## Usage Examples

### 1. Placing a Bet with Enhanced Odds Data

```typescript
import { useBetPlacement } from '../lib/hooks/useBetPlacement';

const { placeBet } = useBetPlacement();

// Place bet with current odds data
const success = await placeBet(
  betData,
  stake,
  currentOddsData // Pass current odds for snapshot
);
```

### 2. Querying Bets by Market Type

```typescript
// Get all match winner bets
const matchWinnerBets = await prisma.bet.findMany({
  where: {
    marketType: 'match_winner'
  }
});

// Get all session odds bets
const sessionBets = await prisma.bet.findMany({
  where: {
    marketType: 'cricketcasino'
  }
});
```

### 3. Analyzing Odds Movement

```typescript
// Get bets with odds snapshots for analysis
const betsWithSnapshots = await prisma.bet.findMany({
  where: {
    oddsSnapshot: { not: null }
  },
  select: {
    id: true,
    odds: true,
    oddsSnapshot: true,
    createdAt: true
  }
});
```

## Benefits

1. **Complete Audit Trail**: Know exactly what odds were available when bet was placed
2. **Market Type Tracking**: Distinguish between different types of betting markets
3. **Odds Tier Analysis**: Understand which tier of odds users typically get
4. **Historical Analysis**: Track odds movements over time
5. **Settlement Accuracy**: Use stored odds data for accurate bet settlement
6. **Compliance**: Meet regulatory requirements for odds transparency

## API Changes

### Bet Placement Request
```json
{
  "marketId": "market_123",
  "selectionId": "selection_456",
  "selectionName": "Team A",
  "odds": 2.5,
  "stake": 100,
  "type": "back",
  "marketName": "Match Odds",
  "matchId": "match_789",
  "marketType": "match_winner",
  "oddsSnapshot": { /* complete odds data */ },
  "oddsTier": 1,
  "availableStake": 1000
}
```

### Bet Response
```json
{
  "success": true,
  "data": {
    "betId": "bet_123",
    "bet": {
      "id": "bet_123",
      "marketType": "match_winner",
      "oddsSnapshot": { /* stored snapshot */ },
      "oddsTier": 1,
      "availableStake": 1000,
      // ... other fields
    }
  }
}
```

## Indexes Added

- `Bet_marketType_idx` - For filtering bets by market type
- `Bet_oddsTier_idx` - For analyzing odds tier distribution

## Notes

- All new fields are optional (`nullable`) to maintain backward compatibility
- Existing bets will have `null` values for these fields
- The `oddsSnapshot` field stores the complete state of odds when bet was placed
- Use these fields for reporting, analysis, and compliance purposes
