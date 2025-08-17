import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'L9vY7z!pQkR#eA1dT3u*Xj5@FbNmC2Ws';
const SESSION_COOKIE = 'betx_session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get token from cookie using Next.js built-in parser
    const token = req.cookies.betx_session;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No authentication token' });
    }

    const payload = jwt.verify(token, JWT_SECRET) as any;
    const userId = payload.user.id;

    // Fetch complete user data including commission details from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
              include: {
          UserCommissionShare: true
        }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile',
      error: (error as Error).message 
    });
  }
} 