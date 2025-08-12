import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { matchId, matchName } = req.body;

    if (!matchId || !matchName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Match ID and Match Name are required' 
      });
    }

    // Mock market decision processing
    console.log('Market decision applied for:', { matchId, matchName });

    return res.status(200).json({
      success: true,
      message: 'Market decision applied successfully',
      data: {
        matchId,
        matchName,
        decision: 'Market decision applied',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Market decision API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
} 