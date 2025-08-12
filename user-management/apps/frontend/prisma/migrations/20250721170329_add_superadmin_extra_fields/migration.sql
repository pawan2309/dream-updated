-- AlterTable
ALTER TABLE "User" ADD COLUMN     "casinoStatus" BOOLEAN,
ADD COLUMN     "commissionType" TEXT,
ADD COLUMN     "matchCommission" DOUBLE PRECISION,
ADD COLUMN     "sessionCommission" DOUBLE PRECISION;
