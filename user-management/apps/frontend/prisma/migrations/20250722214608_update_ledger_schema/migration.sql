-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LedgerType" ADD VALUE 'LIMIT_UPDATE';
ALTER TYPE "LedgerType" ADD VALUE 'PNL_CREDIT';
ALTER TYPE "LedgerType" ADD VALUE 'PNL_DEBIT';
ALTER TYPE "LedgerType" ADD VALUE 'SETTLEMENT';

-- AlterTable
ALTER TABLE "Ledger" ADD COLUMN     "matchId" TEXT,
ADD COLUMN     "sourceUserId" TEXT,
ALTER COLUMN "collection" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Ledger_userId_createdAt_idx" ON "Ledger"("userId", "createdAt");
