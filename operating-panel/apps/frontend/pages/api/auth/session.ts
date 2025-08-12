import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Mock session data for development
    const mockUser = {
      id: '1',
      name: 'Owner User',
      email: 'owner@example.com',
      role: 'OWNER',
      subdomain: 'admin',
      userCode: 'OWN0001'
    };

    return res.status(200).json({
      success: true,
      user: mockUser
    });
  } catch (error) {
    console.error('Session API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
