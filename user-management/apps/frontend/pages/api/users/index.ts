import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

// Function to get role prefix (3 letters)
function getRolePrefix(role: string): string {
  const rolePrefixes: { [key: string]: string } = {
    'ADMIN': 'ADM',
    'SUPER_ADMIN': 'SUD',
    'SUB_OWNER': 'SOW',
    'SUB': 'SUB', 
    'MASTER': 'MAS',
    'SUPER_AGENT': 'SUP',
    'AGENT': 'AGE',
    'USER': 'USE'
  };
  return rolePrefixes[role] || 'USR';
}

// Function to generate username based on role (3 letters + 4 digits)
function generateUsername(role: string, existingUsers: string[] = []) {
  const prefix = getRolePrefix(role);
  let counter = 1;
  let username = `${prefix}${counter.toString().padStart(4, '0')}`;
  while (existingUsers.includes(username)) {
    counter++;
    username = `${prefix}${counter.toString().padStart(4, '0')}`;
  }
  return username;
}

// Function to generate unique code (same as username)
function generateCode(role: string, existingCodes: string[] = []) {
  return generateUsername(role, existingCodes);
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // List users with optional role, parentId, and isActive filtering
    try {
      const { role, parentId, isActive, excludeInactiveParents } = req.query;
      
      let whereClause: any = {};
      if (role && typeof role === 'string') {
        whereClause.role = role as any;
      }
      if (parentId && typeof parentId === 'string') {
        whereClause.parentId = parentId;
      }
      if (isActive !== undefined) {
        // Convert string to boolean for isActive filter
        const isActiveBool = isActive === 'true' || isActive === true;
        whereClause.isActive = isActiveBool;
        console.log('Filtering by isActive:', isActiveBool, 'Query param:', isActive);
      }
      
      // If excludeInactiveParents is true, we need to filter out users whose parents are inactive
      if (excludeInactiveParents === 'true') {
        whereClause.OR = [
          { parentId: null }, // Top-level users (no parent)
          {
            parent: {
              isActive: true // Only users whose parent is active
            }
          }
        ];
      }
      
      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          balance: true,
          creditLimit: true,
          isActive: true,
          createdAt: true,
          code: true,
          contactno: true,
          password: true, // Include password for credential sharing
          parentId: true,
          updatedAt: true,
          parent: {
            select: {
              username: true,
              name: true,
            }
          },
          userCommissionShare: {
            select: {
              share: true,
              available_share_percent: true,
              cshare: true,
              icshare: true,
              casinocommission: true,
              matchcommission: true,
              sessioncommission: true,
              sessionCommission: true,
              session_commission_type: true,
              commissionType: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('Found users:', users.length);
      console.log('Where clause:', whereClause);
      console.log('Sample users:', users.slice(0, 3).map(u => ({ id: u.id, username: u.username, role: u.role, isActive: u.isActive })));
      
      return res.status(200).json({ success: true, users });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch users', error: (error as Error).message });
    }
  }

  if (req.method === 'POST') {
    // Create a new user
    try {
      console.log('Creating user with body:', req.body);
      
      const { 
        role, 
        password, 
        name, 
        contactno, 
        reference,
        share,
        cshare,
        icshare,
        mobileshare,
        session_commission_type,
        matchcommission,
        sessioncommission,
        casinocommission,
        parentId,
        commissionType,
        casinoStatus,
        matchCommission,
        sessionCommission,
        casinoShare,
        casinoCommission,
        // Parent commission fields
        myMatchCommission,
        mySessionCommission,
        myCasinoCommission,
        myCasinoShare
      } = req.body;

      console.log('Extracted fields:', { role, name, contactno, parentId });

      // Validate required fields
      if (!role || !password || !name) {
        console.log('Missing required fields:', { role: !!role, password: !!password, name: !!name });
        return res.status(400).json({ success: false, message: 'Role, password, and name are required' });
      }

      // Validate role
      const validRoles = ['ADMIN', 'SUPER_ADMIN', 'SUB_OWNER', 'SUB', 'MASTER', 'SUPER_AGENT', 'AGENT', 'USER'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ success: false, message: `Invalid role: ${role}. Valid roles are: ${validRoles.join(', ')}` });
      }

      // Validate contact number if provided
      if (contactno && (contactno.length < 10 || contactno.length > 15)) {
        return res.status(400).json({ success: false, message: 'Contact number must be between 10 and 15 digits' });
      }

      // Get existing usernames and codes
      const existingUsers = await prisma.user.findMany({ 
        select: { username: true, code: true } 
      });
      const existingUsernames = existingUsers.map((u: { username: string }) => u.username);
      const existingCodes = existingUsers.map((u: { code: string | null }) => u.code).filter((code): code is string => code !== null);

      // Generate unique code (and use as username)
      const code = generateCode(role, existingCodes);
      const username = code; // Username is now the same as code

      // Store password in plain text for credential sharing
      console.log('Generated username:', username);
      console.log('Generated code:', code);
      console.log('Password stored in plain text for sharing');

      // Get the id of the currently logged-in user from the session
      const session = req.cookies['betx_session'];
      let creatorId = null;
      if (session) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(session, process.env.JWT_SECRET || 'dev_secret');
          creatorId = decoded.user?.id || null;
        } catch (e) {
          console.error('Error decoding session:', e);
          creatorId = null;
        }
      }

      // Ensure parentId is a valid UUID, not a role name
      let resolvedParentId = null;
      let parentUser = null;
      
      if (typeof parentId !== 'undefined' && parentId !== null) {
        // If parentId looks like a UUID, use it directly
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (uuidRegex.test(parentId)) {
          // Verify the parent user exists
          parentUser = await prisma.user.findUnique({ where: { id: parentId } });
          if (!parentUser) {
            return res.status(400).json({ success: false, message: `Parent user with ID ${parentId} not found.` });
          }
          resolvedParentId = parentId;
        } else {
          // If parentId is a role name, look up the first user with that role
          parentUser = await prisma.user.findFirst({ where: { role: parentId } });
          if (parentUser) {
            resolvedParentId = parentUser.id;
          } else {
            return res.status(400).json({ success: false, message: `No user found with role ${parentId} to use as parent.` });
          }
        }
      } else {
        // Determine if the new user is a top-level role
        const topLevelRoles = ['SUB_OWNER']; // Add other top-level roles if needed
        const isTopLevel = topLevelRoles.includes(role);
        resolvedParentId = isTopLevel ? null : creatorId;
        
        // If not top-level, get the creator as parent
        if (!isTopLevel && creatorId) {
          parentUser = await prisma.user.findUnique({ where: { id: creatorId } });
        }
      }

      // Validate share hierarchy - child shares cannot exceed parent shares
      if (parentUser) {
        // Get parent's commission share data
        const parentCommissionShare = await prisma.userCommissionShare.findUnique({
          where: { userId: parentUser.id }
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
          console.log(`Main share validation passed: Child share ${childShare}% <= Parent share ${parentShare}%`);
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
          console.log(`Casino share validation passed: Child cshare ${childCshare}% <= Parent cshare ${parentCshare}%`);
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
          console.log(`International casino share validation passed: Child ishare ${childIshare}% <= Parent ishare ${parentIshare}%`);
        }

        // Validate mobileshare (mobile share)
        if (mobileshare !== undefined && mobileshare !== null) {
          const childMobileshare = parseFloat(mobileshare) || 0;
          const parentMobileshare = parentUser.mobileshare || 100;
          
          if (childMobileshare > parentMobileshare) {
            return res.status(400).json({ 
              success: false, 
              message: `Child mobile share (${childMobileshare}%) cannot exceed parent mobile share (${parentMobileshare}%). Please set child mobile share to ${parentMobileshare}% or less.` 
            });
          }
          console.log(`Mobile share validation passed: Child mobileshare ${childMobileshare}% <= Parent mobileshare ${parentMobileshare}%`);
        }
      }

             // Validate credit limit deduction from parent
             const requestedCreditLimit = req.body.creditLimit !== undefined ? Number(req.body.creditLimit) : 0;
             
             if (requestedCreditLimit > 0 && parentUser) {
               // Check if parent has enough credit limit
               if (parentUser.creditLimit < requestedCreditLimit) {
                 return res.status(400).json({ 
                   success: false, 
                   message: `Parent user (${parentUser.name || parentUser.code || parentUser.username}) does not have enough credit limit. Parent has ${parentUser.creditLimit} but ${requestedCreditLimit} is required. Please reduce the credit limit or add more limit to the parent first.` 
                 });
               }
               
               // Deduct from parent's credit limit
               await prisma.user.update({
                 where: { id: parentUser.id },
                 data: { creditLimit: parentUser.creditLimit - requestedCreditLimit }
               });
               
               console.log(`Deducted ${requestedCreditLimit} from parent ${parentUser.username}. New parent limit: ${parentUser.creditLimit - requestedCreditLimit}`);
             }

             // Create user with basic fields
       const userData: any = {
         username,
         name,
         password: password, // Store in plain text for credential sharing
         role: role as any, // Cast to Role enum
         parentId: resolvedParentId,
         creditLimit: requestedCreditLimit,
         balance: 0,
         isActive: true,
         code,
         reference: reference || null,
         contactno: contactno || null,
         mobileshare: parseFloat(mobileshare) || 100,
         casinoStatus: typeof casinoStatus === 'boolean' ? casinoStatus : (casinoStatus === 'true'),
       };

       console.log('Creating user with data:', userData);

       const user = await prisma.user.create({
         data: userData
       });

       // Create UserCommissionShare record with actual values from frontend
       const commissionShareData = {
         userId: user.id,
         share: parseFloat(share) || 0,
         available_share_percent: parseFloat(share) || 0, // Initially, available share equals assigned share
         cshare: parseFloat(cshare) || 0,
         icshare: parseFloat(icshare) || 0,
         casinocommission: parseFloat(casinocommission) || 0,
         matchcommission: parseFloat(matchcommission) || 0, // Use actual value from frontend
         sessioncommission: parseFloat(sessioncommission) || 0, // Use actual value from frontend
         sessionCommission: sessionCommission !== undefined ? parseFloat(sessionCommission) : null,
         session_commission_type: session_commission_type || "No Comm",
         commissionType: commissionType || null,
       };

       // Update parent's commission values if provided
       if (parentUser && (myMatchCommission !== undefined || mySessionCommission !== undefined || myCasinoCommission !== undefined || myCasinoShare !== undefined)) {
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
             where: { userId: parentUser.id },
             data: parentUpdateData
           });
           console.log('Updated parent commission values:', parentUpdateData);
         }
       }

       // Handle casinoShare and casinoCommission fields consistently
       if (casinoShare !== undefined && casinoShare !== '') {
         commissionShareData.cshare = parseFloat(casinoShare) || 0;
       }
       if (casinoCommission !== undefined && casinoCommission !== '') {
         commissionShareData.casinocommission = parseFloat(casinoCommission) || 0;
       }

               console.log('Creating commission share with data:', commissionShareData);
               await prisma.userCommissionShare.create({
          data: commissionShareData
        });
        console.log('Commission share created successfully for user:', user.id);

      // Create ledger entries for credit limit allocation
      if (user.creditLimit > 0) {
        // Fetch parent/creator user info if available
        let parentName = 'System';
        if (user.parentId) {
          const parentUser = await prisma.user.findUnique({ where: { id: user.parentId } });
          if (parentUser) {
            parentName = `${parentUser.code || ''} ${parentUser.name || ''}`.trim();
          }
        }
        
        // Create ledger entry for the new user
        await prisma.ledger.create({
          data: {
            userId: user.id,
            collection: 'LIMIT_UPDATE',
            debit: 0,
            credit: user.creditLimit,
            balanceAfter: user.creditLimit,
            type: 'ADJUSTMENT' as any,
            remark: `Credit limit allocation from parent: ${parentName}`,
          } as any
        });
        
        // Create ledger entry for parent if deduction occurred
        if (parentUser && user.creditLimit > 0) {
          await prisma.ledger.create({
            data: {
              userId: parentUser.id,
              collection: 'LIMIT_UPDATE',
              debit: user.creditLimit,
              credit: 0,
              balanceAfter: parentUser.creditLimit - user.creditLimit,
              type: 'ADJUSTMENT' as any,
              remark: `Credit limit deduction for new user: ${user.name || user.username}`,
            } as any
          });
        }
      }

      console.log('User created successfully:', user.id);

      return res.status(201).json({ 
        success: true, 
        user: { 
          id: user.id, 
          username: user.username, 
          name: user.name,
          role: user.role, 
          isActive: user.isActive,
          code: user.code
        } 
      });
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Check for specific database errors
      if (error.code === 'P2002') {
        return res.status(400).json({ success: false, message: 'Username or code already exists. Please try again.' });
      }
      
      return res.status(500).json({ success: false, message: 'Failed to create user', error: (error as Error).message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default handler; 