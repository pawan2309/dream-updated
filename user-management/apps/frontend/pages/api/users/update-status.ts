import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'L9vY7z!pQkR#eA1dT3u*Xj5@FbNmC2Ws';
const SESSION_COOKIE = 'betx_session';

/**
 * Recursively finds all downline users (children, grandchildren, etc.)
 */
async function getAllDownlineUserIds(parentIds: string[]): Promise<string[]> {
  const allDownlineIds: string[] = [];
  const queue = [...parentIds];

  while (queue.length > 0) {
    const currentParentId = queue.shift()!;
    
    // Find all direct children of the current parent
    const children = await prisma.user.findMany({
      where: { parentId: currentParentId },
      select: { id: true }
    });

    // Add children IDs to the result and queue for further processing
    for (const child of children) {
      if (!allDownlineIds.includes(child.id)) {
        allDownlineIds.push(child.id);
        queue.push(child.id);
      }
    }
  }

  return allDownlineIds;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Verify session
    const cookies = parse(req.headers.cookie || '');
    const token = cookies[SESSION_COOKIE];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.user?.id;
    
    if (!decoded || !userId) {
      return res.status(401).json({ success: false, message: 'Invalid session' });
    }

    const { userIds, isActive, role } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'User IDs are required' });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }

    let allUserIdsToUpdate = [...userIds];
    let downlineCount = 0;

    // Find all downline users and add them to the update list (for both activation and deactivation)
    const downlineIds = await getAllDownlineUserIds(userIds);
    allUserIdsToUpdate = [...userIds, ...downlineIds];
    downlineCount = downlineIds.length;

    // Update all specified users (including downline for both activation and deactivation)
    // Remove role filter for cascade operations to allow updating users of different roles
    const updateResult = await prisma.user.updateMany({
      where: {
        id: { in: allUserIdsToUpdate },
        // Remove role filter to allow cascade deactivation across different roles
      },
      data: {
        isActive: isActive,
      },
    });



    const message = isActive 
      ? `Successfully activated ${updateResult.count} users (${userIds.length} direct + ${downlineCount} downline)`
      : `Successfully deactivated ${updateResult.count} users (${userIds.length} direct + ${downlineCount} downline)`;

    return res.status(200).json({
      success: true,
      message,
      updatedCount: updateResult.count,
      directCount: userIds.length,
      downlineCount: downlineCount
    });

  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: (error as Error).message,
    });
  }
} 