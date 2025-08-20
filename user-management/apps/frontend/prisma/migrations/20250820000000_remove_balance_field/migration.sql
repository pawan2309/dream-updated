-- Remove balance field from User table
ALTER TABLE "User" DROP COLUMN IF EXISTS "balance";

-- Remove balanceAfter field from Ledger table  
ALTER TABLE "Ledger" DROP COLUMN IF EXISTS "balanceAfter";
