import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({ 
        where: { id: id as string },
        include: {
          userCommissionShare: true
        }
      });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      return res.status(200).json({ success: true, user });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch user', error: (error as Error).message });
    }
  }
  if (req.method === 'PUT') {
    try {
      console.log('API received body:', req.body); // Debug log
      
      const { 
        name, 
        contactno, 
        share, 
        commissionType, 
        casinoStatus, 
        matchCommission, 
        sessionCommission, 
        password,
        reference,
        casinoShare,
        casinoCommission,
        cshare,
        icshare,
        session_commission_type,
        // Parent commission fields
        myMatchCommission,
        mySessionCommission,
        myCasinoCommission,
        myCasinoShare
      } = req.body;
      
      // Get the user being updated to check parent relationship
      const userToUpdate = await prisma.user.findUnique({
        where: { id: id as string },
        include: { parent: true }
      });
      
      if (!userToUpdate) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      // Validate share hierarchy if user has a parent
      if (userToUpdate.parent) {
        const parentCommissionShare = await prisma.userCommissionShare.findUnique({
          where: { userId: userToUpdate.parent.id }
        });
        
        // Validate main share
        if (share !== undefined && share !== null) {
          const childShare = parseFloat(share) || 0;
          const parentShare = parentCommissionShare?.share || 0;
          
          if (childShare > parentShare) {
            return res.status(400).json({ 
              success: false, 
              message: `Child share (${childShare}%) cannot exceed parent share (${parentShare}%). Please set child share to ${parentShare}% or less.` 
            });
          }
        }

        // Validate cshare (casino share)
        if (cshare !== undefined && cshare !== null) {
          const childCshare = parseFloat(cshare) || 0;
          const parentCshare = parentCommissionShare?.cshare || 0;
          
          if (childCshare > parentCshare) {
            return res.status(400).json({ 
              success: false, 
              message: `Child casino share (${childCshare}%) cannot exceed parent casino share (${parentCshare}%). Please set child casino share to ${parentCshare}% or less.` 
            });
          }
        }

        // Validate icshare (international casino share)
        if (icshare !== undefined && icshare !== null) {
          const childIshare = parseFloat(icshare) || 0;
          const parentIshare = parentCommissionShare?.icshare || 0;
          
          if (childIshare > parentIshare) {
            return res.status(400).json({ 
              success: false, 
              message: `Child international casino share (${childIshare}%) cannot exceed parent international casino share (${parentIshare}%). Please set child international casino share to ${parentIshare}% or less.` 
            });
          }
        }
      }
      
      // Prepare basic user data object
      const userDataToUpdate: any = {
        name,
        contactno,
        reference,
        casinoStatus: typeof casinoStatus === 'boolean' ? casinoStatus : (casinoStatus === 'true'),
      };
      
      // If password is provided and not empty, store in plain text
      if (password && password.length >= 6) {
        userDataToUpdate.password = password;
      }
      
      // Update user with basic fields
      const user = await prisma.user.update({
        where: { id: id as string },
        data: userDataToUpdate,
      });

      // Prepare commission share data
      const commissionShareData: any = {
        share: parseFloat(share) || 0,
        available_share_percent: parseFloat(share) || 0, // Initially, available share equals assigned share
        cshare: parseFloat(cshare) || 0,
        icshare: parseFloat(icshare) || 0,
        matchcommission: parseFloat(matchCommission) || 0,
        sessioncommission: parseFloat(sessionCommission) || 0,
        casinocommission: 0, // Will be set below based on casinoCommission
        commissionType: commissionType || null,
        sessionCommission: sessionCommission !== undefined ? parseFloat(sessionCommission) : null,
        session_commission_type: session_commission_type || "No Comm",
      };
      
      // Handle casino share and commission consistently
      console.log('Casino fields received:', { casinoShare, casinoCommission }); // Debug log
      
      // Save casino share to cshare field
      if (casinoShare !== undefined && casinoShare !== '') {
        commissionShareData.cshare = parseFloat(casinoShare) || 0;
        console.log('Using casinoShare for cshare:', parseFloat(casinoShare) || 0);
      }
      
      // Save casino commission to casinocommission field
      if (casinoCommission !== undefined && casinoCommission !== '') {
        commissionShareData.casinocommission = parseFloat(casinoCommission) || 0;
        console.log('Using casinoCommission for casinocommission:', parseFloat(casinoCommission) || 0);
      }

      console.log('Commission share data to save:', commissionShareData); // Debug log
      
      // Check if UserCommissionShare record exists
      const existingCommissionShare = await prisma.userCommissionShare.findUnique({
        where: { userId: id as string }
      });

      if (existingCommissionShare) {
        // Update existing UserCommissionShare record
        console.log('Updating existing commission share record');
        await prisma.userCommissionShare.update({
          where: { userId: id as string },
          data: commissionShareData
        });
      } else {
        // Create new UserCommissionShare record
        console.log('Creating new commission share record');
        await prisma.userCommissionShare.create({
          data: {
            userId: id as string,
            ...commissionShareData
          }
        });
      }

      // Update parent's commission values if provided
      if (userToUpdate.parent && (myMatchCommission !== undefined || mySessionCommission !== undefined || myCasinoCommission !== undefined || myCasinoShare !== undefined)) {
        const parentUpdateData: any = {};
        
        if (myMatchCommission !== undefined) {
          parentUpdateData.matchcommission = parseFloat(myMatchCommission) || 0;
        }
        if (mySessionCommission !== undefined) {
          parentUpdateData.sessioncommission = parseFloat(mySessionCommission) || 0;
        }
        if (myCasinoCommission !== undefined) {
          parentUpdateData.casinocommission = parseFloat(myCasinoCommission) || 0;
        }
        if (myCasinoShare !== undefined) {
          parentUpdateData.cshare = parseFloat(myCasinoShare) || 0;
        }

        if (Object.keys(parentUpdateData).length > 0) {
          await prisma.userCommissionShare.update({
            where: { userId: userToUpdate.parent.id },
            data: parentUpdateData
          });
          console.log('Updated parent commission values:', parentUpdateData);
        }
      }

      // Fetch updated user with commission share data
      const updatedUser = await prisma.user.findUnique({
        where: { id: id as string },
        include: {
          userCommissionShare: true
        }
      });

      return res.status(200).json({ success: true, user: updatedUser });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to update user', error: (error as Error).message });
    }
  }
  return res.status(405).json({ success: false, message: 'Method not allowed' });
} 