import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSubOwner() {
  try {
    console.log('Creating SUB_OWNER user...');
    
    // Check if SUB_OWNER already exists
    const existingSubOwner = await prisma.user.findFirst({
      where: { role: 'SUB_OWNER' }
    });

    if (existingSubOwner) {
      console.log('SUB_OWNER already exists:', {
        id: existingSubOwner.id,
        username: existingSubOwner.username,
        name: existingSubOwner.name,
        code: existingSubOwner.code
      });
      return;
    }

    // Create SUB_OWNER user
    const subOwner = await prisma.user.create({
      data: {
        username: 'SOW0001',
        password: 'admin123',
        role: 'SUB_OWNER',
        name: 'Sub Owner Admin',
        code: 'SOW0001',
        contactno: '1234567890',
        creditLimit: 1000000,
        balance: 0,
        isActive: true,
        mobileshare: 100,
        casinoStatus: true,
      }
    });

    // Create UserCommissionShare record for SUB_OWNER
    await prisma.userCommissionShare.create({
      data: {
        userId: subOwner.id,
        share: 100, // Full share for SUB_OWNER
        available_share_percent: 100, // Full available share
        cshare: 100, // Casino share same as main share
        icshare: 0, // International casino share
        casinocommission: 0, // No casino commission for SUB_OWNER
        matchcommission: 0, // No match commission for SUB_OWNER
        sessioncommission: 0, // No session commission for SUB_OWNER
        sessionCommission: 0,
        session_commission_type: "No Comm",
        commissionType: "NoCommission",
      }
    });

    console.log('SUB_OWNER created successfully!');
    console.log('Login credentials:');
    console.log('Username:', subOwner.username);
    console.log('Password:', 'admin123');
    console.log('Name:', subOwner.name);
    console.log('Code:', subOwner.code);
    console.log('Role:', subOwner.role);

  } catch (error) {
    console.error('Error creating SUB_OWNER:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSubOwner(); 