import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  console.log('API Request Body:', req.body);
  console.log('API Query:', req.query);

  const { id } = req.query;
  const { amount, type, paymentType, remark } = req.body;
  
  // Handle both 'type' and 'paymentType' for backward compatibility
  const finalPaymentType = type || paymentType;
  
  console.log('Parsed values:', { id, amount, type, paymentType, finalPaymentType, remark });

  if (!id || typeof id !== 'string') {
    console.log('Validation failed: User ID is required');
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    console.log('Validation failed: Amount must be greater than zero', { amount, parsed: Number(amount) });
    return res.status(400).json({ success: false, message: 'Amount must be greater than zero.' });
  }
  if (!finalPaymentType || !['lena', 'dena'].includes(finalPaymentType)) {
    console.log('Validation failed: Invalid payment type', { finalPaymentType });
    return res.status(400).json({ success: false, message: 'Invalid payment type.' });
  }
  if (!remark || typeof remark !== 'string' || remark.trim().length === 0) {
    console.log('Validation failed: Remark is required', { remark });
    return res.status(400).json({ success: false, message: 'Remark is required' });
  }
  
  const finalRemark = remark.trim();

  try {
    // Get the user and current limit
    const user = await prisma.user.findUnique({ where: { id } });
    console.log('Found user:', user);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const currentLimit = user.creditLimit || 0;
    console.log('Current limit:', currentLimit);
    let newLimit = currentLimit;
    let credit = 0, debit = 0;
    
    // REVERSED LOGIC:
    // Dena ( देना - To Give ): This is the amount the business owes the user. It's a CREDIT for the user.
    // Lena ( लेना - To Take ): This is the amount the user owes the business. It's a DEBIT for the user.
    if (finalPaymentType === 'dena') {
      credit = Number(amount);
      newLimit = currentLimit + credit;
    } else { // finalPaymentType === 'lena'
      debit = Number(amount);
      newLimit = currentLimit - debit;
    }

    console.log('Updating user credit limit to:', newLimit);
    // Update user's credit limit
    await prisma.user.update({
      where: { id },
      data: { creditLimit: newLimit }
    });
    
    console.log('Creating ledger entry with:', {
      userId: id,
      collection: 'LIMIT_UPDATE',
      debit,
      credit,
      balanceAfter: newLimit,
      type: 'ADJUSTMENT',
      remark,
    });
    
    // Create ledger entry
    const entry = await prisma.ledger.create({
      data: {
        userId: id,
        collection: 'LIMIT_UPDATE',
        debit,
        credit,
        balanceAfter: newLimit,
        type: 'ADJUSTMENT',
        remark: finalRemark,
      }
    });
    
    console.log('Created ledger entry:', entry);
    return res.status(200).json({ success: true, entry, newLimit });
  } catch (error: any) {
    console.error('Error adding manual ledger entry:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error?.message || 'Unknown error'
    });
  }
} 