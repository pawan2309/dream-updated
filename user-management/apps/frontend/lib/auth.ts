import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable not set');
}

export interface UserData {
  id?: string;
  userId?: string;
  username: string;
  role: string;
  name?: string;
}

/**
 * Verify JWT token and return user data
 */
export function verifyToken(token: string): UserData | null {
  try {
    console.log('🔍 Auth utility: Verifying token with secret:', JWT_SECRET.substring(0, 10) + '...');
    console.log('🔍 Auth utility: Token to verify:', token.substring(0, 20) + '...');
    
    const payload = jwt.verify(token, JWT_SECRET) as UserData;
    console.log('🔍 Auth utility: JWT payload:', payload);
    
    // Normalize the payload to ensure consistent structure
    const normalizedPayload = {
      id: payload.id || payload.userId,
      userId: payload.userId || payload.id,
      username: payload.username,
      role: payload.role,
      name: payload.name
    };
    
    console.log('🔍 Auth utility: Normalized payload:', normalizedPayload);
    return normalizedPayload;
  } catch (error) {
    console.error('❌ Auth utility: Token verification failed:', error);
    console.error('❌ Auth utility: Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : 'Unknown'
    });
    return null;
  }
}

/**
 * Generate JWT token for user
 */
export function generateToken(userData: UserData): string {
  return jwt.sign(userData, JWT_SECRET, { expiresIn: '10m' });
}

/**
 * Decode JWT token without verification (for debugging)
 */
export function decodeToken(token: string): any {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('Token decode failed:', error);
    return null;
  }
} 