import { NextApiRequest, NextApiResponse } from 'next';
import { 
  assignUserWithShare, 
  editUserShare, 
  calculateUserShareInfo,
  getUserChildrenWithShares,
  validateShareAssignment,
  getUserHierarchyTree,
  updateUserCommissions,
  ShareAssignmentRequest,
  ShareUpdateRequest
} from '../../../lib/services/shareCommissionService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Handle share assignment
    try {
      const request: ShareAssignmentRequest = req.body;
      
      const result = await assignUserWithShare(request);
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          user: result.user,
          parentShareInfo: result.parentShareInfo,
          message: 'Share assigned successfully'
        });
      } else {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in share assignment:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  if (req.method === 'PUT') {
    // Handle share editing
    try {
      const request: ShareUpdateRequest = req.body;
      
      const result = await editUserShare(request);
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          user: result.user,
          parentShareInfo: result.parentShareInfo,
          message: 'Share updated successfully'
        });
      } else {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in share editing:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  if (req.method === 'GET') {
    try {
      const { userId, action } = req.query;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      switch (action) {
        case 'share-info':
          // Get user's share information
          const shareInfo = await calculateUserShareInfo(userId);
          return res.status(200).json({
            success: true,
            shareInfo
          });

        case 'children-shares':
          // Get user's children with their share information
          const childrenWithShares = await getUserChildrenWithShares(userId);
          return res.status(200).json({
            success: true,
            children: childrenWithShares
          });

        case 'hierarchy-tree':
          // Get complete hierarchy tree
          const hierarchyTree = await getUserHierarchyTree(userId);
          return res.status(200).json({
            success: true,
            hierarchy: hierarchyTree
          });

        case 'validate-assignment':
          // Validate share assignment
          const { requestedShare } = req.query;
          if (!requestedShare || typeof requestedShare !== 'string') {
            return res.status(400).json({
              success: false,
              error: 'Requested share is required'
            });
          }
          
          const validation = await validateShareAssignment(userId, parseFloat(requestedShare));
          return res.status(200).json({
            success: true,
            validation
          });

        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid action specified'
          });
      }
    } catch (error) {
      console.error('Error in share commission GET:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  if (req.method === 'PATCH') {
    // Handle commission updates
    try {
      const { userId } = req.query;
      const commissions = req.body;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const result = await updateUserCommissions(userId, commissions);
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          user: result.user,
          message: 'Commissions updated successfully'
        });
      } else {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in commission update:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
} 