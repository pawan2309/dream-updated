-- Migration: Rename externalId to matchId in Match table
-- This migration renames the externalId column to matchId for better clarity

-- Rename the column from externalId to matchId
ALTER TABLE "Match" RENAME COLUMN "externalId" TO "matchId";

-- Update the unique constraint name if it exists
-- (PostgreSQL automatically handles this, but we can be explicit)
ALTER TABLE "Match" DROP CONSTRAINT IF EXISTS "Match_externalId_key";
ALTER TABLE "Match" ADD CONSTRAINT "Match_matchId_key" UNIQUE ("matchId");

-- Update any existing indexes that reference the old column name
-- (PostgreSQL should handle this automatically, but we can verify)
-- The existing @@index([matchId]) in the schema should work with the renamed column
