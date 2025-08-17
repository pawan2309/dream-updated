import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    console.log('🔐 Login attempt for username:', username);

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      console.log('❌ User not found:', username);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    console.log('🔍 User found:', {
      id: user.id,
      username: user.username,
      passwordLength: user.password?.length || 0,
      isActive: user.isActive,
      role: user.role
    });

    // Check if user is active
    if (!user.isActive) {
      console.log('❌ User account inactive:', username);
      return res.status(401).json({ 
        success: false, 
        message: 'Account is inactive. Please contact admin.' 
      });
    }



    // Verify password
    console.log('🔐 Password comparison:', {
      inputPassword: password,
      inputPasswordLength: password.length,
      storedPasswordLength: user.password?.length || 0,
      storedPasswordType: typeof user.password
    });
    
    // Check if stored password is already hashed (bcrypt hashes start with $2b$)
    let isPasswordValid = false;
    
    if (user.password.startsWith('$2b$')) {
      // Password is already hashed with bcrypt
      isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('🔐 Bcrypt comparison result:', isPasswordValid);
    } else {
      // Password is plain text (temporary fallback)
      isPasswordValid = (password === user.password);
      console.log('🔐 Plain text comparison result:', isPasswordValid);
      
      // TODO: Hash the password and update the database
      if (isPasswordValid) {
        console.log('⚠️ Plain text password detected - should be hashed');
      }
    }
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', username);
      return res.status(401).json({ 
        success: false, 
        message: 'Password wrong' 
      });
    }

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET environment variable not set');
      return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error' 
      });
    }
    
    console.log('🔐 Login API: Using JWT secret from env');
    
    const token = jwt.sign(
      { 
        id: user.id,
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('🔐 Login API: Generated token:', token.substring(0, 30) + '...');

    // Create login session
    await prisma.loginSession.create({
      data: {
        userId: user.id,
        loginAt: new Date(),
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    });

    // Set HTTP-only cookie with proper domain and path
    const cookieValue = `betx_session=${token}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Lax`;
    res.setHeader('Set-Cookie', cookieValue);
    
    console.log('✅ Login successful for user:', username, 'Role:', user.role);
    console.log('🍪 Cookie set:', cookieValue);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('💥 Login error:', error);
    console.error('💥 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : 'Unknown'
    });
    
    // Return more detailed error for debugging
    return res.status(500).json({ 
      success: false, 
      message: 'Something went wrong. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('💥 Error disconnecting from database:', disconnectError);
    }
  }
}
