import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { matchId, matchName, selectedTeam } = req.body;

    if (!matchId || !matchName || !selectedTeam) {
      return res.status(400).json({ 
        success: false, 
        message: 'Match ID, Match Name, and Selected Team are required' 
      });
    }

    // Mock match decision processing
    console.log('Match decision applied for:', { matchId, matchName, selectedTeam });

    return res.status(200).json({
      success: true,
      message: 'Match decision applied successfully',
      data: {
        matchId,
        matchName,
        selectedTeam,
        decision: 'Match decision applied',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Match decision API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
} 