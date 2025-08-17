-- AlterTable
ALTER TABLE "Bet" ADD COLUMN "marketId" TEXT,
ADD COLUMN "selectionId" TEXT,
ADD COLUMN "selectionName" TEXT,
ADD COLUMN "marketName" TEXT,
ADD COLUMN "type" TEXT;

-- CreateIndex
CREATE INDEX "Bet_marketId_idx" ON "Bet"("marketId");

-- CreateIndex
CREATE INDEX "Bet_selectionId_idx" ON "Bet"("selectionId");

-- CreateIndex
CREATE INDEX "Bet_type_idx" ON "Bet"("type");

-- CreateIndex
CREATE INDEX "Bet_status_idx" ON "Bet"("status");
