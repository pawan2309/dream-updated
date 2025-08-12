const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCreditLimitDeduction() {
  try {
    console.log('🧪 Testing Credit Limit Deduction from Parent');
    console.log('=============================================');

    // 1. Create a parent user with 1000 credit limit
    console.log('\n1. Creating parent user with 1000 credit limit...');
    const parentUser = await prisma.user.create({
      data: {
        username: 'TEST_PARENT',
        name: 'Test Parent',
        password: 'password123',
        role: 'SUPER_ADMIN',
        creditLimit: 1000,
        balance: 0,
        isActive: true,
        code: 'TEST_PARENT',
        mobileshare: 100,
        casinoStatus: true
      }
    });

    // Create commission share for parent
    await prisma.userCommissionShare.create({
      data: {
        userId: parentUser.id,
        share: 100,
        available_share_percent: 100,
        cshare: 100,
        icshare: 100,
        casinocommission: 10,
        matchcommission: 10,
        sessioncommission: 10,
        sessionCommission: 10,
        session_commission_type: 'Percentage',
        commissionType: 'Percentage'
      }
    });

    console.log(`✅ Parent created: ${parentUser.username} with ${parentUser.creditLimit} credit limit`);

    // 2. Test creating a child user with 300 credit limit (should succeed)
    console.log('\n2. Creating child user with 300 credit limit (should succeed)...');
    
    const childUser1 = await prisma.user.create({
      data: {
        username: 'TEST_CHILD1',
        name: 'Test Child 1',
        password: 'password123',
        role: 'ADMIN',
        parentId: parentUser.id,
        creditLimit: 300,
        balance: 0,
        isActive: true,
        code: 'TEST_CHILD1',
        mobileshare: 80,
        casinoStatus: true
      }
    });

    // Create commission share for child
    await prisma.userCommissionShare.create({
      data: {
        userId: childUser1.id,
        share: 80,
        available_share_percent: 80,
        cshare: 80,
        icshare: 80,
        casinocommission: 8,
        matchcommission: 8,
        sessioncommission: 8,
        sessionCommission: 8,
        session_commission_type: 'Percentage',
        commissionType: 'Percentage'
      }
    });

    console.log(`✅ Child 1 created: ${childUser1.username} with ${childUser1.creditLimit} credit limit`);

    // 3. Check parent's updated credit limit
    const updatedParent = await prisma.user.findUnique({
      where: { id: parentUser.id }
    });
    console.log(`📊 Parent's updated credit limit: ${updatedParent.creditLimit} (should be 700)`);

    // 4. Test creating another child with 500 credit limit (should succeed)
    console.log('\n3. Creating child user with 500 credit limit (should succeed)...');
    
    const childUser2 = await prisma.user.create({
      data: {
        username: 'TEST_CHILD2',
        name: 'Test Child 2',
        password: 'password123',
        role: 'ADMIN',
        parentId: parentUser.id,
        creditLimit: 500,
        balance: 0,
        isActive: true,
        code: 'TEST_CHILD2',
        mobileshare: 60,
        casinoStatus: true
      }
    });

    // Create commission share for child 2
    await prisma.userCommissionShare.create({
      data: {
        userId: childUser2.id,
        share: 60,
        available_share_percent: 60,
        cshare: 60,
        icshare: 60,
        casinocommission: 6,
        matchcommission: 6,
        sessioncommission: 6,
        sessionCommission: 6,
        session_commission_type: 'Percentage',
        commissionType: 'Percentage'
      }
    });

    console.log(`✅ Child 2 created: ${childUser2.username} with ${childUser2.creditLimit} credit limit`);

    // 5. Check parent's final credit limit
    const finalParent = await prisma.user.findUnique({
      where: { id: parentUser.id }
    });
    console.log(`📊 Parent's final credit limit: ${finalParent.creditLimit} (should be 200)`);

    // 6. Test creating a child with 300 credit limit (should fail - parent only has 200)
    console.log('\n4. Attempting to create child with 300 credit limit (should fail)...');
    
    try {
      const childUser3 = await prisma.user.create({
        data: {
          username: 'TEST_CHILD3',
          name: 'Test Child 3',
          password: 'password123',
          role: 'ADMIN',
          parentId: parentUser.id,
          creditLimit: 300, // This should fail
          balance: 0,
          isActive: true,
          code: 'TEST_CHILD3',
          mobileshare: 50,
          casinoStatus: true
        }
      });
      console.log('❌ This should have failed but succeeded!');
    } catch (error) {
      console.log('✅ Correctly failed to create child with insufficient parent limit');
      console.log(`Error: ${error.message}`);
    }

    // 7. Check ledger entries
    console.log('\n5. Checking ledger entries...');
    const parentLedger = await prisma.ledger.findMany({
      where: { userId: parentUser.id },
      orderBy: { createdAt: 'asc' }
    });

    const child1Ledger = await prisma.ledger.findMany({
      where: { userId: childUser1.id },
      orderBy: { createdAt: 'asc' }
    });

    const child2Ledger = await prisma.ledger.findMany({
      where: { userId: childUser2.id },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`📊 Parent ledger entries: ${parentLedger.length}`);
    console.log(`📊 Child 1 ledger entries: ${child1Ledger.length}`);
    console.log(`📊 Child 2 ledger entries: ${child2Ledger.length}`);

    if (parentLedger.length > 0) {
      console.log('Parent ledger entries:');
      parentLedger.forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.remark} - Debit: ${entry.debit}, Credit: ${entry.credit}, Balance: ${entry.balanceAfter}`);
      });
    }

    if (child1Ledger.length > 0) {
      console.log('Child 1 ledger entries:');
      child1Ledger.forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.remark} - Debit: ${entry.debit}, Credit: ${entry.credit}, Balance: ${entry.balanceAfter}`);
      });
    }

    if (child2Ledger.length > 0) {
      console.log('Child 2 ledger entries:');
      child2Ledger.forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.remark} - Debit: ${entry.debit}, Credit: ${entry.credit}, Balance: ${entry.balanceAfter}`);
      });
    }

    console.log('\n✅ Credit limit deduction test completed successfully!');

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCreditLimitDeduction(); 