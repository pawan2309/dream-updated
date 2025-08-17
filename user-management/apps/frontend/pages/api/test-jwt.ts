import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return res.status(500).json({ 
        success: false, 
        message: 'JWT_SECRET environment variable not set' 
      });
    }
    
    console.log('🔍 Test JWT API: JWT_SECRET from env:', process.env.JWT_SECRET);
    console.log('🔍 Test JWT API: JWT_SECRET used:', JWT_SECRET.substring(0, 10) + '...');
    
    // Test token generation
    const testPayload = { 
      id: 'test-id', 
      userId: 'test-user-id', 
      username: 'testuser', 
      role: 'test' 
    };
    
    const testToken = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '1h' });
    console.log('🔍 Test JWT API: Generated test token:', testToken.substring(0, 30) + '...');
    
    // Test token verification
    try {
      const verifiedPayload = jwt.verify(testToken, JWT_SECRET);
      console.log('✅ Test JWT API: Token verification successful:', verifiedPayload);
      
      return res.status(200).json({
        success: true,
        message: 'JWT test successful',
        secret: JWT_SECRET.substring(0, 10) + '...',
        testToken: testToken.substring(0, 30) + '...',
        verifiedPayload
      });
    } catch (verifyError) {
      console.log('❌ Test JWT API: Token verification failed:', verifyError);
      return res.status(500).json({
        success: false,
        message: 'JWT verification test failed',
        error: verifyError instanceof Error ? verifyError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('💥 Test JWT API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Test JWT API error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
