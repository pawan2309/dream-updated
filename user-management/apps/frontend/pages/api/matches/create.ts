import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { title, matchId, status = 'UPCOMING' } = req.body;

    if (!title || !matchId) {
      return res.status(400).json({ 
        success: false, 
        message: 'title and matchId are required' 
      });
    }

    // Check if match with matchId already exists
    const existingMatch = await prisma.match.findUnique({
      where: { matchId }
    });

    if (existingMatch) {
      return res.status(409).json({ 
        success: false, 
        message: 'Match with this external ID already exists' 
      });
    }

    // Create the match
    const match = await prisma.match.create({
      data: {
        title,
        matchId,
        status: status as 'UPCOMING' | 'LIVE' | 'CLOSED'
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Match created successfully',
      data: match
    });

  } catch (error) {
    console.error('Error creating match:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 