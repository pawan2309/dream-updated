import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export interface UserData {
  id: string;
  username: string;
  role: string;
  name?: string;
}

/**
 * Verify JWT token and return user data
 */
export async function verifyToken(token: string): Promise<UserData | null> {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as UserData;
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
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