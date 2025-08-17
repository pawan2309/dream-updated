import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'L9vY7z!pQkR#eA1dT3u*Xj5@FbNmC2Ws';
const SESSION_COOKIE = 'betx_session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get user from session
    const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
    const token = cookies[SESSION_COOKIE];

    if (!token) {
      console.error('No session token found in cookies:', cookies);
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    let payload, sessionUserId;
    try {
      payload = jwt.verify(token, JWT_SECRET);
      if (typeof payload === 'object' && payload !== null && 'user' in payload && payload.user && 'id' in payload.user) {
        sessionUserId = (payload as any).user.id;
      } else {
        throw new Error('JWT payload does not contain user id');
      }
      // console.log('Decoded JWT payload:', payload);
    } catch (jwtError: any) {
      console.error('JWT verification failed:', jwtError);
      return res.status(401).json({ success: false, message: 'Invalid session token', error: jwtError.message });
    }

    const { newPassword, userId } = req.body;

    if (!newPassword) {
      return res.status(400).json({ success: false, message: 'New password is required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    // Determine which user to update
    const targetUserId = userId || sessionUserId;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: targetUserId }
    });
    // console.log('User lookup result:', user);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Store password in plain text for credential sharing
    await prisma.user.update({
      where: { id: targetUserId },
      data: { password: newPassword } // Store in plain text for credential sharing
    });

    return res.status(200).json({ success: true, message: 'Password changed successfully', username: user.username });

  } catch (error: any) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error?.message, stack: error?.stack });
  }
} 