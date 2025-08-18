import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'L9vY7z!pQkR#eA1dT3u*Xj5@FbNmC2Ws';

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
    console.log('🔍 Update Status API: Starting status update process');
    
    // Verify session - use same method as session API
    const authToken = req.cookies.betx_session;
    console.log('🔍 Update Status API: Auth token found:', !!authToken);
    
    if (!authToken) {
      console.log('❌ Update Status API: No authentication token');
      return res.status(401).json({ success: false, message: 'No authentication token' });
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(authToken, JWT_SECRET);
      console.log('✅ Update Status API: JWT verified, user ID:', decoded.userId || decoded.id);
    } catch (error) {
      console.log('❌ Update Status API: JWT verification failed:', error);
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const userId = decoded.userId || decoded.id;
    
    if (!decoded || !userId) {
      console.log('❌ Update Status API: Invalid session data');
      return res.status(401).json({ success: false, message: 'Invalid session' });
    }

    const { userIds, isActive, role } = req.body;
    console.log('🔍 Update Status API: Request data:', { userIds, isActive, role });

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      console.log('❌ Update Status API: Invalid user IDs');
      return res.status(400).json({ success: false, message: 'User IDs are required' });
    }

    if (typeof isActive !== 'boolean') {
      console.log('❌ Update Status API: Invalid isActive value');
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }

    let allUserIdsToUpdate = [...userIds];
    let downlineCount = 0;

    // Find all downline users and add them to the update list (for both activation and deactivation)
    console.log('🔍 Update Status API: Finding downline users for:', userIds);
    const downlineIds = await getAllDownlineUserIds(userIds);
    allUserIdsToUpdate = [...userIds, ...downlineIds];
    downlineCount = downlineIds.length;
    console.log('🔍 Update Status API: Total users to update:', allUserIdsToUpdate.length, 'Downline:', downlineCount);

    // Update all specified users (including downline for both activation and deactivation)
    // Remove role filter for cascade operations to allow updating users of different roles
    console.log('🔍 Update Status API: Updating users with isActive:', isActive);
    const updateResult = await prisma.user.updateMany({
      where: {
        id: { in: allUserIdsToUpdate },
        // Remove role filter to allow cascade deactivation across different roles
      },
      data: {
        isActive: isActive,
      },
    });

    console.log('✅ Update Status API: Update successful, count:', updateResult.count);

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
    console.error('❌ Update Status API: Error occurred:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: (error as Error).message,
    });
  }
} 