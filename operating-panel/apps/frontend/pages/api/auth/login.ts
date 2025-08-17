import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'L9vY7z!pQkR#eA1dT3u*Xj5@FbNmC2Ws';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    // Query the database for the user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { code: username }
        ],
        isActive: true
      },
      include: {
        UserCommissionShare: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or inactive' 
      });
    }

    // Plain text password validation (as requested)
    if (user.password !== password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid password' 
      });
    }

    // Generate JWT token for session
    const sessionToken = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    // Set session token as HTTP-only cookie
    res.setHeader('Set-Cookie', `sessionToken=${sessionToken}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`);

    // Return real user data from database
    const userResponse = {
      id: user.id,
      name: user.name || user.username,
      username: user.username,
      role: user.role,
      code: user.code,
      balance: user.balance,
      creditLimit: user.creditLimit,
      exposure: user.exposure,
      isActive: user.isActive,
      casinoStatus: user.casinoStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return res.status(200).json({
      success: true,
      user: userResponse,
      message: 'Login successful',
      sessionToken: sessionToken // Also return token in response for frontend use
    });

  } catch (error) {
    console.error('Login API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  } finally {
    await prisma.$disconnect();
  }
}
