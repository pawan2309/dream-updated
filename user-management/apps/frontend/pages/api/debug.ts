import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🔍 Debug API: Request received');
    console.log('🔍 Debug API: Headers:', req.headers);
    console.log('🔍 Debug API: Cookies:', req.cookies);
    console.log('🔍 Debug API: Authorization header:', req.headers.authorization);
    console.log('🔍 Debug API: betx_session cookie:', req.cookies.betx_session);
    
    // Check if token exists
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.betx_session;
    
    if (token) {
      console.log('🔍 Debug API: Token found, length:', token.length);
      console.log('🔍 Debug API: Token format check:', {
        hasDots: token.includes('.'),
        parts: token.split('.').length,
        firstPart: token.substring(0, 20) + '...',
        lastPart: '...' + token.substring(token.length - 20)
      });
    } else {
      console.log('❌ Debug API: No token found');
    }

    return res.status(200).json({
      success: true,
      message: 'Debug info logged to console',
      hasToken: !!token,
      tokenLength: token?.length || 0,
      cookies: Object.keys(req.cookies),
      headers: Object.keys(req.headers)
    });

  } catch (error) {
    console.error('💥 Debug API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Debug API error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
