import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'L9vY7z!pQkR#eA1dT3u*Xj5@FbNmC2Ws';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get session token from cookies or headers
    const sessionToken = req.cookies.sessionToken || req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'No session token provided' 
      });
    }

    // Validate JWT token
    try {
      const decoded = jwt.verify(sessionToken, JWT_SECRET) as any;
      
      if (!decoded || !decoded.userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid session token' 
        });
      }

      // Fetch current user data
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          UserCommissionShare: true
        }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found or inactive' 
        });
      }

      // Return user data
      const userResponse = {
        id: user.id,
        name: user.name || user.username,
        username: user.username,
        role: user.role,
        code: user.code,

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
        message: 'Session valid'
      });

    } catch (jwtError) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired session token' 
      });
    }

  } catch (error) {
    console.error('Session API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  } finally {
    await prisma.$disconnect();
  }
}
