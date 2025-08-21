-- Migration: Remove rawData and resultData fields from Match table
-- This migration removes the JSON fields that are no longer needed

-- Remove rawData column from Match table
ALTER TABLE "Match" DROP COLUMN IF EXISTS "rawData";

-- Remove resultData column from Match table
ALTER TABLE "Match" DROP COLUMN IF EXISTS "resultData";

-- Update the schema to reflect these changes
-- The Match table will now only contain the essential fields without raw JSON data
