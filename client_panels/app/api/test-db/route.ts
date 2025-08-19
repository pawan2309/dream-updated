import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if we can query the database
    const userCount = await prisma.user.count();
    console.log('📊 Total users in database:', userCount);
    
    // Try to find the specific user USE0002
    const testUser = await prisma.user.findFirst({
      where: {
        username: 'USE0002'
      },
      select: {
        id: true,
        username: true,
        name: true,
        code: true,
        role: true,
        balance: true,
        creditLimit: true,
        exposure: true,
        isActive: true
      }
    });
    
    console.log('🔍 Test user USE0002 found:', testUser);
    
    // Also try to find any user with role USER
    const anyUser = await prisma.user.findFirst({
      where: {
        role: 'USER',
        isActive: true
      },
      select: {
        id: true,
        username: true,
        name: true,
        code: true,
        role: true,
        balance: true,
        creditLimit: true,
        exposure: true,
        isActive: true
      }
    });
    
    console.log('🔍 Any USER role found:', anyUser);
    
    // Check database schema
    const allUsers = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        username: true,
        name: true,
        code: true,
        role: true,
        balance: true,
        creditLimit: true,
        exposure: true,
        isActive: true
      }
    });
    
    console.log('📋 Sample users from database:', allUsers);
    
    return NextResponse.json({
      success: true,
      message: 'Database test completed',
      data: {
        userCount,
        testUser,
        anyUser,
        sampleUsers: allUsers,
        databaseUrl: process.env.DATABASE_URL || 'Using default connection'
      }
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
}
