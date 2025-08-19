const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/betting_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Migration SQL
const migrationSQL = `
-- Migration: Add bet settlement fields for client ledger
-- This migration adds all the missing fields needed for proper bet result tracking

-- Add new fields to Bet table
ALTER TABLE "Bet" ADD COLUMN IF NOT EXISTS "wonAmount" DOUBLE PRECISION;
ALTER TABLE "Bet" ADD COLUMN IF NOT EXISTS "lostAmount" DOUBLE PRECISION;
ALTER TABLE "Bet" ADD COLUMN IF NOT EXISTS "result" TEXT;
ALTER TABLE "Bet" ADD COLUMN IF NOT EXISTS "settledAt" TIMESTAMP(3);
ALTER TABLE "Bet" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Add new fields to Match table
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "winner" TEXT;
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "result" TEXT;
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "settledAt" TIMESTAMP(3);

-- Create BetSettlement table if it doesn't exist
CREATE TABLE IF NOT EXISTS "BetSettlement" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "betId" TEXT,
    "userId" TEXT,
    "winner" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalStakes" DOUBLE PRECISION NOT NULL,
    "totalWinnings" DOUBLE PRECISION NOT NULL,
    "totalLosses" DOUBLE PRECISION NOT NULL,
    "winningBets" INTEGER NOT NULL,
    "losingBets" INTEGER NOT NULL,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BetSettlement_pkey" PRIMARY KEY ("id")
);

-- Create indexes for BetSettlement (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'BetSettlement_matchId_idx') THEN
        CREATE INDEX "BetSettlement_matchId_idx" ON "BetSettlement"("matchId");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'BetSettlement_betId_idx') THEN
        CREATE INDEX "BetSettlement_betId_idx" ON "BetSettlement"("betId");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'BetSettlement_userId_idx') THEN
        CREATE INDEX "BetSettlement_userId_idx" ON "BetSettlement"("userId");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'BetSettlement_settledAt_idx') THEN
        CREATE INDEX "BetSettlement_settledAt_idx" ON "BetSettlement"("settledAt");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'BetSettlement_isProcessed_idx') THEN
        CREATE INDEX "BetSettlement_isProcessed_idx" ON "BetSettlement"("isProcessed");
    END IF;
END $$;

-- Create indexes for new Bet fields (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Bet_settledAt_idx') THEN
        CREATE INDEX "Bet_settledAt_idx" ON "Bet"("settledAt");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Bet_result_idx') THEN
        CREATE INDEX "Bet_result_idx" ON "Bet"("result");
    END IF;
END $$;

-- Create indexes for new Match fields (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Match_settledAt_idx') THEN
        CREATE INDEX "Match_settledAt_idx" ON "Match"("settledAt");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Match_winner_idx') THEN
        CREATE INDEX "Match_winner_idx" ON "Match"("winner");
    END IF;
END $$;

-- Add foreign key constraints for BetSettlement (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'BetSettlement_matchId_fkey') THEN
        ALTER TABLE "BetSettlement" ADD CONSTRAINT "BetSettlement_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'BetSettlement_betId_fkey') THEN
        ALTER TABLE "BetSettlement" ADD CONSTRAINT "BetSettlement_betId_fkey" FOREIGN KEY ("betId") REFERENCES "Bet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'BetSettlement_userId_fkey') THEN
        ALTER TABLE "BetSettlement" ADD CONSTRAINT "BetSettlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Update existing bets to have updatedAt timestamp
UPDATE "Bet" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
`;

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migration...');
    
    // Run the migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 New fields added:');
    console.log('   - Bet table: wonAmount, lostAmount, result, settledAt, updatedAt');
    console.log('   - Match table: winner, result, settledAt');
    console.log('   - New table: BetSettlement');
    console.log('   - New indexes and foreign keys');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration().catch(console.error);
