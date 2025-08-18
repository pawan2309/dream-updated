-- Add enhanced odds data storage fields to Bet table
-- Migration: 20250818000000_add_enhanced_odds_fields

-- Add new odds-related fields
ALTER TABLE "Bet" ADD COLUMN "marketType" TEXT;
ALTER TABLE "Bet" ADD COLUMN "oddsSnapshot" JSONB;
ALTER TABLE "Bet" ADD COLUMN "oddsTier" INTEGER;
ALTER TABLE "Bet" ADD COLUMN "availableStake" DOUBLE PRECISION;

-- Add indexes for performance
CREATE INDEX "Bet_marketType_idx" ON "Bet"("marketType");
CREATE INDEX "Bet_oddsTier_idx" ON "Bet"("oddsTier");

-- Add comments for documentation
COMMENT ON COLUMN "Bet"."marketType" IS 'Market type: match_winner, cricketcasino, tied_match, custom';
COMMENT ON COLUMN "Bet"."oddsSnapshot" IS 'Complete odds data snapshot when bet was placed';
COMMENT ON COLUMN "Bet"."oddsTier" IS 'Which tier of odds (1=best, 2=second best, etc.)';
COMMENT ON COLUMN "Bet"."availableStake" IS 'Available stake at that odds level';
