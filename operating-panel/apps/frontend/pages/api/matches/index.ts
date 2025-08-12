import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Mock cricket matches data
    const mockMatches = [
      {
        id: 'match_001',
        matchName: 'India v Australia',
        date: '2025-01-15',
        time: '14:30:00',
        isLive: true,
        status: 'INPLAY',
        venue: 'Melbourne Cricket Ground',
        tournament: 'Test Series 2025'
      },
      {
        id: 'match_002',
        matchName: 'England v South Africa',
        date: '2025-01-16',
        time: '10:00:00',
        isLive: false,
        status: 'UPCOMING',
        venue: 'Lord\'s Cricket Ground',
        tournament: 'Test Series 2025'
      },
      {
        id: 'match_003',
        matchName: 'Pakistan v New Zealand',
        date: '2025-01-14',
        time: '15:00:00',
        isLive: false,
        status: 'COMPLETED',
        venue: 'Gaddafi Stadium',
        tournament: 'Test Series 2025'
      },
      {
        id: 'match_004',
        matchName: 'West Indies v Sri Lanka',
        date: '2025-01-17',
        time: '11:30:00',
        isLive: false,
        status: 'UPCOMING',
        venue: 'Kensington Oval',
        tournament: 'Test Series 2025'
      },
      {
        id: 'match_005',
        matchName: 'Bangladesh v Afghanistan',
        date: '2025-01-13',
        time: '13:00:00',
        isLive: false,
        status: 'COMPLETED',
        venue: 'Sher-e-Bangla Stadium',
        tournament: 'Test Series 2025'
      }
    ];

    return res.status(200).json({
      success: true,
      message: 'Matches retrieved successfully',
      data: mockMatches
    });
  } catch (error) {
    console.error('Matches API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
