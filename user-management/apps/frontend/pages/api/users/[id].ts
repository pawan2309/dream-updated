import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export const runtime = 'nodejs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.betx_session;
    console.log('🔍 Users API: Checking authentication');
    console.log('🍪 Cookies:', req.cookies);
    console.log('🔑 Token found:', !!token, 'Length:', token?.length || 0);
    console.log('🔑 Token from header:', req.headers.authorization);
    console.log('🔑 Token from cookie:', req.cookies.betx_session);
    
    if (!token) {
      console.log('❌ No token found');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if token looks like a valid JWT (should be 3 parts separated by dots)
    if (!token.includes('.') || token.split('.').length !== 3) {
      console.log('❌ Token format invalid - not a valid JWT');
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const decoded = verifyToken(token);
    console.log('🔍 Token decoded:', decoded);
    console.log('🔍 Token raw:', token);
    console.log('🔍 Token length:', token.length);
    
    if (!decoded) {
      console.log('❌ Token verification failed');
      console.log('❌ Token verification failed - token might be malformed');
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    console.log('✅ Authentication successful for user:', decoded.username);

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (req.method === 'GET') {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          UserCommissionShare: true,
          parent: {
            select: {
              id: true,
              username: true,
              name: true,
              role: true
            }
          },
          children: {
            select: {
              id: true,
              username: true,
              name: true,
              role: true,
              isActive: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({ success: true, user });
    }

    if (req.method === 'PUT') {
      const {
        name,
        contactno,
        casinoShare,
        casinoCommission,
        ishare,
        mobileshare,
        isActive
      } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (contactno !== undefined) updateData.contactno = contactno;
      if (isActive !== undefined) updateData.isActive = isActive;

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData
      });

      // Handle commission share updates
      if (casinoShare !== undefined || casinoCommission !== undefined) {
        const commissionShareData = {
          cshare: parseFloat(casinoShare) || 0,
          casinocommission: parseFloat(casinoCommission) || 0,
          ishare: parseFloat(ishare) || 0,
          mobileshare: parseFloat(mobileshare) || 0
        };

        const existingShare = await prisma.UserCommissionShare.findFirst({
          where: { userId: id }
        });

        if (existingShare) {
          await prisma.UserCommissionShare.update({
            where: { id: existingShare.id },
            data: commissionShareData
          });
        } else {
          await prisma.UserCommissionShare.create({
            data: {
              userId: id,
              ...commissionShareData
            }
          });
        }

        // Update parent commission values if this user has children
        if (updatedUser.parentId) {
          const children = await prisma.user.findMany({
            where: { parentId: updatedUser.parentId }
          });

          const totalChildShare = children.reduce((sum, child) => {
            const childShare = child.UserCommissionShare?.[0];
            return sum + (childShare?.cshare || 0);
          }, 0);

          const parentUpdateData = {
            cshare: Math.max(0, 100 - totalChildShare)
          };

          await prisma.user.update({
            where: { id: updatedUser.parentId },
            data: parentUpdateData
          });
        }
      }

      return res.status(200).json({ 
        success: true, 
        message: 'User updated successfully',
        user: updatedUser
      });
    }

  } catch (error) {
    console.error('User API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
} 