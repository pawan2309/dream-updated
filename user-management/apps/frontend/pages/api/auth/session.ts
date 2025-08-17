import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ valid: false, message: 'Method not allowed' });
  }

  try {
    // Get token from cookie
    const authToken = req.cookies.betx_session;
    console.log('🔍 Session API: Checking for auth token');
    console.log('🔍 Session API: Request headers:', Object.keys(req.headers));
    console.log('🔍 Session API: Cookie header:', req.headers.cookie);
    console.log('🍪 All cookies:', req.cookies);
    console.log('🔑 Auth token found:', !!authToken, 'Length:', authToken?.length || 0);
    console.log('🔑 Auth token value:', authToken);

    if (!authToken) {
      console.log('❌ No auth token found in cookies');
      return res.status(401).json({ valid: false, message: 'No authentication token' });
    }
    
    console.log('🔍 Token content (first 20 chars):', authToken.substring(0, 20) + '...');

    // Verify JWT token
    let decoded: any;
    try {
      console.log('🔍 Verifying JWT token...');
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) {
        console.error('❌ JWT_SECRET environment variable not set');
        return res.status(500).json({ valid: false, message: 'Server configuration error' });
      }
      
      console.log('🔍 Session API: Using JWT secret from env');
      console.log('🔍 Session API: Token to verify:', authToken.substring(0, 30) + '...');
      console.log('🔍 Session API: Token length:', authToken.length);
      console.log('🔍 Session API: Token format check:', {
        hasDots: authToken.includes('.'),
        parts: authToken.split('.').length,
        firstPart: authToken.split('.')[0]?.substring(0, 10) + '...',
        secondPart: authToken.split('.')[1]?.substring(0, 10) + '...',
        thirdPart: authToken.split('.')[2]?.substring(0, 10) + '...'
      });
      
      decoded = jwt.verify(authToken, JWT_SECRET);
      console.log('✅ JWT token verified successfully:', {
        userId: decoded.userId,
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      });
    } catch (error) {
      console.log('❌ Invalid JWT token:', error);
      console.log('❌ Token verification error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : 'Unknown'
      });
      
      // Try to decode without verification to see the payload
      try {
        const unverifiedPayload = jwt.decode(authToken);
        console.log('🔍 Unverified payload:', unverifiedPayload);
      } catch (decodeError) {
        console.log('❌ Even decode failed:', decodeError);
      }
      
      return res.status(401).json({ valid: false, message: 'Invalid token' });
    }

    // Get user from database
    const userId = decoded.userId || decoded.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      console.log('❌ User not found for token');
      return res.status(401).json({ valid: false, message: 'User not found' });
    }

    // Check if user is still active
    if (!user.isActive) {
      console.log('❌ User account not active:', user.username);
      return res.status(401).json({ valid: false, message: 'Account not active' });
    }

    console.log('✅ Valid session for user:', user.username, 'Role:', user.role);

    // Return user session data
    return res.status(200).json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('💥 Session validation error:', error);
    return res.status(500).json({ valid: false, message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
