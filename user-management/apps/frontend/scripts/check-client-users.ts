import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkClientUsers() {
  try {
    console.log('Checking for client users (USER role)...');
    
    // Find all users with USER role
    const clientUsers = await prisma.user.findMany({
      where: { 
        role: 'USER',
        isActive: true 
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        balance: true,
        code: true,
        contactno: true,
        createdAt: true
      }
    });

    console.log(`Found ${clientUsers.length} active client users:`);
    
    if (clientUsers.length === 0) {
      console.log('No client users found. You need to create a USER role account first.');
      console.log('\nTo create a client user:');
      console.log('1. Use the user management panel');
      console.log('2. Create a new user with role: USER');
      console.log('3. Set username and password');
      console.log('4. Ensure isActive: true');
    } else {
      clientUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. Client User:`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Name: ${user.name || 'N/A'}`);
        console.log(`   Code: ${user.code || 'N/A'}`);
        console.log(`   Balance: ${user.balance}`);
        console.log(`   Contact: ${user.contactno || 'N/A'}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   Active: ${user.isActive}`);
      });
      
      console.log('\nTo login to client panel:');
      console.log('1. Go to client panel login page');
      console.log('2. Use any of the above usernames');
      console.log('3. Use the password set for that user');
    }

  } catch (error) {
    console.error('Error checking client users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClientUsers(); 