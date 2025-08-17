import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Clear the auth token cookie
    res.setHeader('Set-Cookie', 'authToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict');
    
    console.log('✅ User logged out successfully');
    
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('💥 Logout error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Something went wrong during logout' 
    });
  }
}
