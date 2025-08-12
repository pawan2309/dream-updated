import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('update-limit API called with method:', req.method);
  console.log('Request body:', req.body);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId, amount, type, role } = req.body;
  console.log('Extracted data:', { userId, amount, type, role });

  if (!userId || !amount || !type) {
    console.log('Missing required fields');
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  if (type !== 'Add' && type !== 'Minus') {
    console.log('Invalid type:', type);
    return res.status(400).json({ success: false, message: 'Invalid type. Must be Add or Minus' });
  }

  if (isNaN(Number(amount)) || Number(amount) <= 0) {
    console.log('Invalid amount:', amount);
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }

  // 1. SUB_OWNER limit can only be changed via DB manipulation, not via this API
  if (role === 'SUB_OWNER') {
    return res.status(403).json({ success: false, message: 'Sub Owner limit can only be changed via database manipulation.' });
  }

  try {
    console.log('Finding user with ID:', userId);
    // Get the user to update
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    console.log('User found:', user ? 'Yes' : 'No');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // For all users except SUB_OWNER, enforce parent limit check on Add
    if (type === 'Add' && user.parentId) {
      const parent = await prisma.user.findUnique({ where: { id: user.parentId } });
      if (!parent) {
        return res.status(400).json({ success: false, message: 'Parent user not found' });
      }
      if (parent.creditLimit < Number(amount)) {
        return res.status(400).json({ success: false, message: 'Parent does not have enough available limit.' });
      }
      // Deduct from parent
      await prisma.user.update({
        where: { id: parent.id },
        data: { creditLimit: parent.creditLimit - Number(amount) }
      });
    }
    // For Minus, add back to parent if parent exists
    if (type === 'Minus' && user.parentId) {
      const parent = await prisma.user.findUnique({ where: { id: user.parentId } });
      if (parent) {
        await prisma.user.update({
          where: { id: parent.id },
          data: { creditLimit: parent.creditLimit + Number(amount) }
        });
      }
    }

    // Calculate new credit limit (using type assertion for now)
    const currentLimit = (user as any).creditLimit || 0;
    const newLimit = type === 'Add' ? currentLimit + Number(amount) : currentLimit - Number(amount);
    console.log('Limit calculation:', { currentLimit, amount, type, newLimit });

    // Prevent negative limits
    if (newLimit < 0) {
      console.log('Attempted to set negative limit:', newLimit);
      return res.status(400).json({ success: false, message: 'Cannot reduce limit below 0' });
    }

    console.log('Updating user credit limit to:', newLimit);
    // Update user's credit limit
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { creditLimit: newLimit } as any
    });

    console.log('User updated successfully');

    // Fetch parent/upper tier user info if available
    let parentName = 'System';
    if (user.parentId) {
      const parentUser = await prisma.user.findUnique({ where: { id: user.parentId } });
      if (parentUser) {
        parentName = `${parentUser.code || ''} ${parentUser.name || ''}`.trim();
      }
    }
    let remark = '';
    if (type === 'Add') {
      remark = `Coins deposit from ${currentLimit} to ${newLimit} updated From ${parentName}`;
    } else {
      remark = `Coins withdraw from ${currentLimit} to ${newLimit} updated From ${parentName}`;
    }
    // Create ledger entry for this transaction
    await prisma.ledger.create({
      data: {
        userId: userId,
        collection: 'LIMIT_UPDATE',
        debit: type === 'Minus' ? Number(amount) : 0,
        credit: type === 'Add' ? Number(amount) : 0,
        balanceAfter: newLimit,
        type: 'ADJUSTMENT',
        remark,
      }
    });

    console.log('Ledger entry created successfully');

    return res.status(200).json({
      success: true,
      message: `Limit ${type.toLowerCase()}ed successfully`,
      newLimit: newLimit
    });

  } catch (error) {
    console.error('Error updating user limit:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
} 