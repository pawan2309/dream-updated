-- Migration: Add bet settlement fields for client ledger
-- This migration adds all the missing fields needed for proper bet result tracking

-- Add new fields to Bet table
ALTER TABLE "Bet" ADD COLUMN "wonAmount" DOUBLE PRECISION;
ALTER TABLE "Bet" ADD COLUMN "lostAmount" DOUBLE PRECISION;
ALTER TABLE "Bet" ADD COLUMN "result" TEXT;
ALTER TABLE "Bet" ADD COLUMN "settledAt" TIMESTAMP(3);
ALTER TABLE "Bet" ADD COLUMN "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Add new fields to Match table
ALTER TABLE "Match" ADD COLUMN "winner" TEXT;
ALTER TABLE "Match" ADD COLUMN "result" TEXT;
ALTER TABLE "Match" ADD COLUMN "settledAt" TIMESTAMP(3);
ALTER TABLE "Match" ADD COLUMN "resultData" JSONB;

-- Create BetSettlement table
CREATE TABLE "BetSettlement" (
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

-- Create indexes for BetSettlement
CREATE INDEX "BetSettlement_matchId_idx" ON "BetSettlement"("matchId");
CREATE INDEX "BetSettlement_betId_idx" ON "BetSettlement"("betId");
CREATE INDEX "BetSettlement_userId_idx" ON "BetSettlement"("userId");
CREATE INDEX "BetSettlement_settledAt_idx" ON "BetSettlement"("settledAt");
CREATE INDEX "BetSettlement_isProcessed_idx" ON "BetSettlement"("isProcessed");

-- Create indexes for new Bet fields
CREATE INDEX "Bet_settledAt_idx" ON "Bet"("settledAt");
CREATE INDEX "Bet_result_idx" ON "Bet"("result");

-- Create indexes for new Match fields
CREATE INDEX "Match_settledAt_idx" ON "Match"("settledAt");
CREATE INDEX "Match_winner_idx" ON "Match"("winner");

-- Add foreign key constraints for BetSettlement
ALTER TABLE "BetSettlement" ADD CONSTRAINT "BetSettlement_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BetSettlement" ADD CONSTRAINT "BetSettlement_betId_fkey" FOREIGN KEY ("betId") REFERENCES "Bet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BetSettlement" ADD CONSTRAINT "BetSettlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update existing bets to have updatedAt timestamp
UPDATE "Bet" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
