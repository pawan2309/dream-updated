import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    // Mock authentication for development based on actual user codes
    // In production, this would validate against the database
    if (username === 'OWN0001' && password === '123456') {
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
        user: mockUser,
        message: 'Login successful'
      });
    } else if (username === 'SUD0006' && password === '123456') {
      const mockUser = {
        id: '2',
        name: 'Super Admin User',
        email: 'superadmin@example.com',
        role: 'SUPER_ADMIN',
        subdomain: 'admin',
        userCode: 'SUD0006'
      };

      return res.status(200).json({
        success: true,
        user: mockUser,
        message: 'Login successful'
      });
    } else if (username === 'owner@example.com' && password === 'pass123') {
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
        user: mockUser,
        message: 'Login successful'
      });
    } else if (username === 'admin@example.com' && password === 'pass123') {
      const mockUser = {
        id: '2',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
        subdomain: 'admin',
        userCode: 'ADM0001'
      };

      return res.status(200).json({
        success: true,
        user: mockUser,
        message: 'Login successful'
      });
    } else if (username === 'client@example.com' && password === 'pass123') {
      const mockUser = {
        id: '3',
        name: 'Client User',
        email: 'client@example.com',
        role: 'USER',
        subdomain: 'client',
        userCode: 'CLI0001'
      };

      return res.status(200).json({
        success: true,
        user: mockUser,
        message: 'Login successful'
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
  } catch (error) {
    console.error('Login API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
