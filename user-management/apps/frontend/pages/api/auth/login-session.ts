import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Create new login session
    try {
      const { userId, ipAddress, userAgent, deviceType, location } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Close any existing active sessions for this user
      await prisma.loginSession.updateMany({
        where: {
          userId,
          isActive: true,
        },
        data: {
          isActive: false,
          logoutAt: new Date(),
        },
      });

      // Create new login session
      const loginSession = await prisma.loginSession.create({
        data: {
          userId,
          ipAddress: ipAddress || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
          userAgent: userAgent || req.headers['user-agent'],
          deviceType: deviceType || getDeviceType(req.headers['user-agent'] as string),
          location,
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              role: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        session: loginSession,
      });
    } catch (error) {
      console.error('Error creating login session:', error);
      res.status(500).json({ error: 'Failed to create login session' });
    }
  } else if (req.method === 'PUT') {
    // Update login session (logout)
    try {
      const { sessionId, userId } = req.body;

      if (!sessionId || !userId) {
        return res.status(400).json({ error: 'Session ID and User ID are required' });
      }

      const session = await prisma.loginSession.findFirst({
        where: {
          id: sessionId,
          userId,
          isActive: true,
        },
      });

      if (!session) {
        return res.status(404).json({ error: 'Active session not found' });
      }

      // Calculate session duration in minutes
      const sessionDuration = Math.round(
        (new Date().getTime() - session.loginAt.getTime()) / (1000 * 60)
      );

      // Update session with logout time and duration
      const updatedSession = await prisma.loginSession.update({
        where: { id: sessionId },
        data: {
          logoutAt: new Date(),
          sessionDuration,
          isActive: false,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              role: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        session: updatedSession,
      });
    } catch (error) {
      console.error('Error updating login session:', error);
      res.status(500).json({ error: 'Failed to update login session' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Helper function to detect device type
function getDeviceType(userAgent: string): string {
  if (!userAgent) return 'unknown';
  
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const tabletRegex = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i;
  
  if (tabletRegex.test(userAgent)) {
    return 'tablet';
  } else if (mobileRegex.test(userAgent)) {
    return 'mobile';
  } else {
    return 'desktop';
  }
} 