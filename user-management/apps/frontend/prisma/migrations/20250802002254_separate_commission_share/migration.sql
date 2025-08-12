/*
  Warnings:

  - You are about to drop the column `casinocommission` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `commissionType` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `cshare` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `icshare` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `matchCommission` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `matchcommission` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `sessionCommission` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `session_commission_type` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `sessioncommission` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `share` on the `User` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'OWNER';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "casinocommission",
DROP COLUMN "commissionType",
DROP COLUMN "cshare",
DROP COLUMN "icshare",
DROP COLUMN "matchCommission",
DROP COLUMN "matchcommission",
DROP COLUMN "sessionCommission",
DROP COLUMN "session_commission_type",
DROP COLUMN "sessioncommission",
DROP COLUMN "share";

-- CreateTable
CREATE TABLE "UserCommissionShare" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "share" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cshare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "icshare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "casinocommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "matchcommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sessioncommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sessionCommission" DOUBLE PRECISION,
    "session_commission_type" TEXT NOT NULL DEFAULT 'No Comm',
    "hCommission" DOUBLE PRECISION,
    "commissionType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCommissionShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCommissionShare_userId_key" ON "UserCommissionShare"("userId");

-- AddForeignKey
ALTER TABLE "UserCommissionShare" ADD CONSTRAINT "UserCommissionShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
