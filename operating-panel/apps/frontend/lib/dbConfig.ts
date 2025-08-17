// Database Configuration
export const dbConfig = {
  // Use localhost with Docker-mapped ports
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:8079@localhost:5433/betting_db",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6380"
};

// Override process.env for Prisma
if (typeof process !== 'undefined') {
  process.env.DATABASE_URL = dbConfig.databaseUrl;
  process.env.REDIS_URL = dbConfig.redisUrl;
}
