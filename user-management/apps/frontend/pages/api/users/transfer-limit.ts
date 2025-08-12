import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { LedgerType, Prisma } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { parentId, childId, amount, type, remark } = req.body;
  if (!parentId || !childId || !amount || !type) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
  }
  if (!['deposit', 'withdrawal'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid type.' });
  }

  try {
    // Fetch parent and child
    const [parent, child] = await Promise.all([
      prisma.user.findUnique({ where: { id: parentId } }),
      prisma.user.findUnique({ where: { id: childId } }),
    ]);
    if (!parent || !child) {
      return res.status(404).json({ success: false, message: 'Parent or child user not found.' });
    }
    if (child.parentId !== parent.id) {
      return res.status(400).json({ success: false, message: 'Parent-child relationship invalid.' });
    }

    let parentNewLimit = parent.creditLimit;
    let childNewLimit = child.creditLimit;
    let ledgerType: LedgerType;
    let ledgerRemark = '';

    if (type === 'withdrawal') {
      // Withdraw: deduct from child, add to parent
      if (child.creditLimit < amount) {
        return res.status(400).json({ success: false, message: 'Child does not have enough limit.' });
      }
      parentNewLimit += amount;
      childNewLimit -= amount;
      ledgerType = LedgerType.WITHDRAWAL;
      ledgerRemark = remark || `Withdraw by parent (${parent.name || parent.code || ''})`;
    } else {
      // Deposit: deduct from parent, add to child
      if (parent.creditLimit < amount) {
        return res.status(400).json({ success: false, message: 'Parent does not have enough limit.' });
      }
      parentNewLimit -= amount;
      childNewLimit += amount;
      ledgerType = LedgerType.DEPOSIT;
      ledgerRemark = remark || `Deposit by parent (${parent.name || parent.code || ''})`;
    }

    // Transaction: update both users and create both child and parent ledger entries
    await prisma.user.update({ where: { id: parent.id }, data: { creditLimit: parentNewLimit } });
    await prisma.user.update({ where: { id: child.id }, data: { creditLimit: childNewLimit } });
    // Child ledger entry
    await prisma.ledger.create({
      data: {
        userId: child.id,
        sourceUserId: parent.id,
        collection: type === 'deposit' ? 'DEPOSIT' : 'WITHDRAWAL',
        credit: type === 'deposit' ? amount : 0,
        debit: type === 'withdrawal' ? amount : 0,
        balanceAfter: childNewLimit,
        type: ledgerType,
        remark: ledgerRemark,
        transactionType: type.toUpperCase(),
      } as Prisma.LedgerUncheckedCreateInput,
    });
    // Parent ledger entry
    const parentLedgerData = {
      userId: parent.id,
      sourceUserId: child.id,
      collection: type === 'deposit' ? 'WITHDRAWAL' : 'DEPOSIT',
      credit: type === 'deposit' ? 0 : amount,
      debit: type === 'deposit' ? amount : 0,
      balanceAfter: parentNewLimit,
      type: type === 'deposit' ? LedgerType.WITHDRAWAL : LedgerType.DEPOSIT,
      remark: type === 'deposit'
        ? `Deposit to ${child.name || child.code || ''}`
        : `Withdraw from ${child.name || child.code || ''}`,
      transactionType: type.toUpperCase(),
    } as Prisma.LedgerUncheckedCreateInput;
    console.log('Attempting to create parent ledger entry:', parentLedgerData);
    let parentLedgerEntry = null;
    try {
      parentLedgerEntry = await prisma.ledger.create({ data: parentLedgerData });
      console.log('Parent ledger entry created successfully');
    } catch (error) {
      console.error('Parent ledger creation error:', error);
      return res.status(500).json({ success: false, message: error instanceof Error ? error.message : String(error) });
    }

    return res.status(200).json({ success: true, parentNewLimit, childNewLimit, parentLedgerEntry });
  } catch (error: any) {
    console.error('Error in transfer-limit:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error?.message });
  }
} 