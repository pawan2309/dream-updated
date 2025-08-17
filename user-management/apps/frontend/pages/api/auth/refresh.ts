import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const SESSION_COOKIE = 'betx_session';
const SESSION_DURATION = 60 * 10; // 10 minutes

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies[SESSION_COOKIE];
  if (!token) {
    return res.status(401).json({ success: false, message: 'No session token' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    let userPayload;
    if (typeof decoded === 'object' && 'user' in decoded) {
      userPayload = decoded.user;
    } else {
      userPayload = decoded;
    }
    // Issue a new token with a fresh 5-minute expiry
    const newToken = jwt.sign({ user: userPayload }, JWT_SECRET, { expiresIn: SESSION_DURATION });
    res.setHeader('Set-Cookie', serialize(SESSION_COOKIE, newToken, {
      httpOnly: true,
      path: '/',
      maxAge: SESSION_DURATION,
      sameSite: 'lax',
    }));
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid session token' });
  }
} 