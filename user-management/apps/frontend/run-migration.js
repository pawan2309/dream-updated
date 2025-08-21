const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🔄 Starting database migration...');

    // Drop existing tables if they exist (for clean migration)
    console.log('🗑️ Dropping existing tables...');
    await prisma.$executeRaw`DROP TABLE IF EXISTS "MatchOdds" CASCADE`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Bet" CASCADE`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Match" CASCADE`;

    console.log('✅ Tables dropped successfully');

    // Push the new schema
    console.log('📝 Pushing new schema...');
    const { execSync } = require('child_process');
    execSync('npx prisma db push', { stdio: 'inherit' });

    console.log('✅ Schema pushed successfully');

    // Verify the new schema
    console.log('🔍 Verifying new schema...');
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'Match'
    `;
    
    console.log('📊 Table count:', tableCount);

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
