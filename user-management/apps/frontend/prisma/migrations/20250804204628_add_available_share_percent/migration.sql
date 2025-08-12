/*
  Warnings:

  - You are about to drop the column `hCommission` on the `UserCommissionShare` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserCommissionShare" DROP COLUMN "hCommission",
ADD COLUMN     "available_share_percent" DOUBLE PRECISION NOT NULL DEFAULT 0;
