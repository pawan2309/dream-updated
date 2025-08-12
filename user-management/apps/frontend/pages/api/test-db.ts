import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('Database connection successful');
    
    // Test if we can query the User table
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    // Test if we can find the specific user
    const testUser = await prisma.user.findUnique({
      where: { username: 'SOW0001' }
    });
    console.log('Test user found:', testUser ? 'Yes' : 'No');
    
    return res.status(200).json({
      success: true,
      message: 'Database connection working',
      userCount,
      testUserExists: !!testUser
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: (error as Error).message
    });
  } finally {
    await prisma.$disconnect();
  }
} 