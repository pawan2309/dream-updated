const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🚀 Starting migration: Add enhanced odds fields to Bet table');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../prisma/migrations/20250818000000_add_enhanced_odds_fields/migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📖 Migration SQL loaded:', migrationSQL);
    
    // Execute the migration
    console.log('⚡ Executing migration...');
    
    // Add new columns
    await prisma.$executeRaw`ALTER TABLE "Bet" ADD COLUMN IF NOT EXISTS "marketType" TEXT`;
    await prisma.$executeRaw`ALTER TABLE "Bet" ADD COLUMN IF NOT EXISTS "oddsSnapshot" JSONB`;
    await prisma.$executeRaw`ALTER TABLE "Bet" ADD COLUMN IF NOT EXISTS "oddsTier" INTEGER`;
    await prisma.$executeRaw`ALTER TABLE "Bet" ADD COLUMN IF NOT EXISTS "availableStake" DOUBLE PRECISION`;
    
    // Add indexes
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Bet_marketType_idx" ON "Bet"("marketType")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Bet_oddsTier_idx" ON "Bet"("oddsTier")`;
    
    // Add comments
    await prisma.$executeRaw`COMMENT ON COLUMN "Bet"."marketType" IS 'Market type: match_winner, cricketcasino, tied_match, custom'`;
    await prisma.$executeRaw`COMMENT ON COLUMN "Bet"."oddsSnapshot" IS 'Complete odds data snapshot when bet was placed'`;
    await prisma.$executeRaw`COMMENT ON COLUMN "Bet"."oddsTier" IS 'Which tier of odds (1=best, 2=second best, etc.)'`;
    await prisma.$executeRaw`COMMENT ON COLUMN "Bet"."availableStake" IS 'Available stake at that odds level'`;
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the new columns exist
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Bet' 
      AND column_name IN ('marketType', 'oddsSnapshot', 'oddsTier', 'availableStake')
      ORDER BY column_name
    `;
    
    console.log('🔍 Verification - New columns:', columns);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
runMigration();
