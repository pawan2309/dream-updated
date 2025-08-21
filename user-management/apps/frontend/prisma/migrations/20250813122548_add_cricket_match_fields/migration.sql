-- AlterEnum
ALTER TYPE "MatchStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "MatchStatus" ADD VALUE 'ABANDONED';
ALTER TYPE "MatchStatus" ADD VALUE 'CANCELED';
ALTER TYPE "MatchStatus" ADD VALUE 'OPEN';
ALTER TYPE "MatchStatus" ADD VALUE 'SUSPENDED';
ALTER TYPE "MatchStatus" ADD VALUE 'SETTLED';

-- AlterEnum
ALTER TYPE "BetStatus" ADD VALUE 'CANCELED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "name" TEXT;
ALTER TABLE "User" ADD COLUMN "zcommission" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "code" TEXT;
ALTER TABLE "User" ADD COLUMN "contactno" TEXT;
ALTER TABLE "User" ADD COLUMN "cshare" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "icshare" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "matchcommission" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "mobileshare" DOUBLE PRECISION NOT NULL DEFAULT 100;
ALTER TABLE "User" ADD COLUMN "reference" TEXT;
ALTER TABLE "User" ADD COLUMN "session_commission_type" TEXT NOT NULL DEFAULT 'No Comm';
ALTER TABLE "User" ADD COLUMN "sessioncommission" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "share" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "exposure" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "casinoStatus" BOOLEAN;
ALTER TABLE "User" ADD COLUMN "commissionType" TEXT;
ALTER TABLE "User" ADD COLUMN "matchCommission" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN "sessionCommission" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Ledger" ADD COLUMN "referenceId" TEXT;
ALTER TABLE "Ledger" ADD COLUMN "transactionType" TEXT;
ALTER TABLE "Ledger" ADD COLUMN "matchId" TEXT;
ALTER TABLE "Ledger" ADD COLUMN "sourceUserId" TEXT;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN "bmarketId" TEXT;
ALTER TABLE "Match" ADD COLUMN "beventId" TEXT;
ALTER TABLE "Match" ADD COLUMN "matchName" TEXT;
ALTER TABLE "Match" ADD COLUMN "tournament" TEXT;
ALTER TABLE "Match" ADD COLUMN "startTime" TIMESTAMP(3);
ALTER TABLE "Match" ADD COLUMN "isLive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Match" ADD COLUMN "matchType" TEXT;
ALTER TABLE "Match" ADD COLUMN "isCricket" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Match" ADD COLUMN "teams" JSONB;
ALTER TABLE "Match" ADD COLUMN "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Match" ADD COLUMN "apiSource" TEXT;
ALTER TABLE "Match" ADD COLUMN "rawData" JSONB;
ALTER TABLE "Match" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Match" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ProfitDistribution" (
    "id" TEXT NOT NULL,
    "betId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profitShare" DOUBLE PRECISION NOT NULL,
    "amountEarned" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfitDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchOdds" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "oddsData" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MatchOdds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logoutAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "location" TEXT,
    "sessionDuration" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ledger_userId_createdAt_idx" ON "Ledger"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Match_bmarketId_idx" ON "Match"("bmarketId");

-- CreateIndex
CREATE INDEX "Match_beventId_idx" ON "Match"("beventId");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX "Match_startTime_idx" ON "Match"("startTime");

-- CreateIndex
CREATE INDEX "Match_isLive_idx" ON "Match"("isLive");

-- CreateIndex
CREATE INDEX "Match_isActive_idx" ON "Match"("isActive");

-- CreateIndex
CREATE INDEX "Match_createdAt_idx" ON "Match"("createdAt");

-- CreateIndex
CREATE INDEX "MatchOdds_marketId_idx" ON "MatchOdds"("marketId");

-- CreateIndex
CREATE INDEX "MatchOdds_eventId_idx" ON "MatchOdds"("eventId");

-- CreateIndex
CREATE INDEX "MatchOdds_lastUpdated_idx" ON "MatchOdds"("lastUpdated");

-- CreateIndex
CREATE INDEX "MatchOdds_isActive_idx" ON "MatchOdds"("isActive");

-- CreateIndex
CREATE INDEX "LoginSession_userId_idx" ON "LoginSession"("userId");

-- CreateIndex
CREATE INDEX "LoginSession_loginAt_idx" ON "LoginSession"("loginAt");

-- CreateIndex
CREATE INDEX "LoginSession_isActive_idx" ON "LoginSession"("isActive");

-- AddForeignKey
ALTER TABLE "ProfitDistribution" ADD CONSTRAINT "ProfitDistribution_betId_fkey" FOREIGN KEY ("betId") REFERENCES "Bet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfitDistribution" ADD CONSTRAINT "ProfitDistribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchOdds" ADD CONSTRAINT "MatchOdds_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginSession" ADD CONSTRAINT "LoginSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
