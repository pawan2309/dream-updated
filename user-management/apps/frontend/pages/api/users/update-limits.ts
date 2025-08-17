import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { userId, limits } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    if (!limits || typeof limits !== 'object') {
      return res.status(400).json({ success: false, message: 'Limits object is required' });
    }

    // Update user limits
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        creditLimit: limits.creditLimit || 0,
        exposure: limits.exposure || 0,
        // Add other limit fields as needed
      },
              include: {
          UserCommissionShare: true
        }
    });

    return res.status(200).json({
      success: true,
      message: 'User limits updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update limits error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user limits',
      error: (error as Error).message
    });
  }
} 