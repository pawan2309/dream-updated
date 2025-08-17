-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'SUB_OWNER', 'SUPER_ADMIN', 'ADMIN', 'SUB', 'MASTER', 'SUPER_AGENT', 'AGENT', 'USER');

-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'WIN', 'LOSS', 'ADJUSTMENT', 'LIMIT_UPDATE', 'PNL_CREDIT', 'PNL_DEBIT', 'SETTLEMENT');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('UPCOMING', 'LIVE', 'CLOSED', 'ABONDED', 'COMPLETED', 'REMOVE', 'CANCEL', 'OPEN');

-- CreateEnum
CREATE TYPE "BetStatus" AS ENUM ('PENDING', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "parentId" TEXT,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT,
    "zcommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "code" TEXT,
    "contactno" TEXT,
    "cshare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "icshare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "matchcommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mobileshare" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "reference" TEXT,
    "session_commission_type" TEXT NOT NULL DEFAULT 'No Comm',
    "sessioncommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "share" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "exposure" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "casinoStatus" BOOLEAN,
    "commissionType" TEXT,
    "matchCommission" DOUBLE PRECISION,
    "sessionCommission" DOUBLE PRECISION,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ledger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "collection" TEXT,
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "type" "LedgerType" NOT NULL,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referenceId" TEXT,
    "transactionType" TEXT,
    "matchId" TEXT,
    "sourceUserId" TEXT,

    CONSTRAINT "Ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bmarketId" TEXT,
    "beventId" TEXT,
    "matchName" TEXT,
    "tournament" TEXT,
    "startTime" TIMESTAMP(3),
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "matchType" TEXT,
    "isCricket" BOOLEAN NOT NULL DEFAULT true,
    "teams" JSONB,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "apiSource" TEXT,
    "rawData" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "odds" DOUBLE PRECISION NOT NULL,
    "stake" DOUBLE PRECISION NOT NULL,
    "potentialWin" DOUBLE PRECISION NOT NULL,
    "status" "BetStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bet_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Ledger_userId_createdAt_idx" ON "Ledger"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Match_externalId_key" ON "Match"("externalId");

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
ALTER TABLE "User" ADD CONSTRAINT "User_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfitDistribution" ADD CONSTRAINT "ProfitDistribution_betId_fkey" FOREIGN KEY ("betId") REFERENCES "Bet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfitDistribution" ADD CONSTRAINT "ProfitDistribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchOdds" ADD CONSTRAINT "MatchOdds_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginSession" ADD CONSTRAINT "LoginSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
