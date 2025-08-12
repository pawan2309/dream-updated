import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testClientPanelDB() {
  try {
    console.log('Testing client panel database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test if we can query the User table
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    // Test if we can find the specific client user
    const clientUser = await prisma.user.findUnique({
      where: { username: 'USE0002' }
    });
    
    if (clientUser) {
      console.log('✅ Client user found:');
      console.log(`   Username: ${clientUser.username}`);
      console.log(`   Name: ${clientUser.name}`);
      console.log(`   Role: ${clientUser.role}`);
      console.log(`   Active: ${clientUser.isActive}`);
      console.log(`   Code: ${clientUser.code}`);
      console.log(`   Password: ${clientUser.password}`);
      
      // Test password verification (plain text)
      const isValidPassword = clientUser.password === '123456';
      console.log(`   Password valid: ${isValidPassword}`);
      
      if (clientUser.role === 'USER' && clientUser.isActive) {
        console.log('✅ User should be able to login to client panel');
      } else {
        console.log('❌ User cannot login to client panel:');
        if (clientUser.role !== 'USER') {
          console.log(`   - Role is ${clientUser.role}, needs to be USER`);
        }
        if (!clientUser.isActive) {
          console.log('   - User is not active');
        }
      }
    } else {
      console.log('❌ Client user USE0002 not found');
    }
    
    // Check for all USER role accounts
    const clientUsers = await prisma.user.findMany({
      where: { 
        role: 'USER',
        isActive: true 
      },
      select: {
        username: true,
        name: true,
        code: true,
        role: true,
        isActive: true,
        password: true
      }
    });
    
    console.log(`\n📋 Active client users (USER role): ${clientUsers.length}`);
    clientUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username} (${user.name || 'N/A'}) - Code: ${user.code} - Password: ${user.password}`);
    });
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check if DATABASE_URL environment variable is set');
    console.log('2. Verify database is running and accessible');
    console.log('3. Check if client panel is using the same database as user management');
    console.log('4. Ensure .env file exists in client_panels directory');
  } finally {
    await prisma.$disconnect();
  }
}

testClientPanelDB(); 