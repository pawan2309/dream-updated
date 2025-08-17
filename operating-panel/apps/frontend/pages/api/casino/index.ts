import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

// Production configuration
const PRODUCTION_CONFIG = {
  MAX_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  MAX_CASINO_GAMES: 100,
  CACHE_TTL: 30 * 1000, // 30 seconds
};

const JWT_SECRET = process.env.JWT_SECRET || 'L9vY7z!pQkR#eA1dT3u*Xj5@FbNmC2Ws';

// Input validation
function validateQueryParams(query: any) {
  const { status, refresh } = query;
  
  // Validate status parameter
  if (status && !['all', 'yes', 'no'].includes(status as string)) {
    throw new Error('Invalid status parameter');
  }
  
  // Validate refresh parameter
  if (refresh && refresh !== 'true') {
    throw new Error('Invalid refresh parameter');
  }
  
  return { status, refresh };
}

// Rate limiting check (simple in-memory for now, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (limit.count >= 10) { // Max 10 requests per minute
    return false;
  }
  
  limit.count++;
  return true;
}

// Verify JWT token
async function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Method validation
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed',
      allowedMethods: ['GET']
    });
  }

  // Rate limiting
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIP as string)) {
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: 60
    });
  }

  // Authentication check
  try {
    const token = req.cookies.sessionToken || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Check if user has access to casino data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive'
      });
    }

    // Only allow OWNER, ADMIN, SUPER_ADMIN to access casino data
    const allowedRoles = ['OWNER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to access casino data'
      });
    }

  } catch (authError) {
    console.error('🔐 Authentication error:', authError);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }

  // Secure CORS headers (restrict to your domains in production)
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com', 'https://admin.yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:3001'];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours



  try {
    // Input validation
    const { status, refresh } = validateQueryParams(req.query);

    let casinoData: any[] = [];
    let source = 'database';
    let syncTimestamp: number | null = null;

    // If refresh is requested, try to sync from backend first
    if (refresh === 'true') {
      try {
        const backendUrl = status ? 
          `${process.env.BACKEND_URL || 'http://localhost:4001'}/api/casino?status=${status}&refresh=true` : 
          `${process.env.BACKEND_URL || 'http://localhost:4001'}/api/casino?refresh=true`;
        
        const backendResponse = await fetch(backendUrl, {
          headers: {
            'User-Agent': 'Betting-System-Frontend/1.0'
          }
        });
        
        if (backendResponse.ok) {
          const backendData = await backendResponse.json();
          
          if (backendData.success && backendData.data && Array.isArray(backendData.data)) {
            // Validate backend data structure
            const validCasinos = backendData.data.filter((casino: any) => {
              return casino.eventId && casino.name && casino.shortName && 
                     typeof casino.minStake === 'number' && typeof casino.maxStake === 'number';
            });

            if (validCasinos.length > 0 && validCasinos.length <= PRODUCTION_CONFIG.MAX_CASINO_GAMES) {
              // Sync backend data to database using Prisma transaction
              try {
                await prisma.$transaction(async (tx: any) => {
                  // Clear existing data first
                  await tx.casinoTable.deleteMany();
                  
                  // Insert new data from backend
                  for (const casino of validCasinos) {
                    await tx.casinoTable.create({
                      data: {
                        eventId: BigInt(casino.eventId),
                        name: casino.name.substring(0, 50), // Limit name length
                        shortName: casino.shortName.substring(0, 20), // Limit short name length
                        betStatus: casino.betStatus === 'yes' ? 'OPEN' : 'CLOSED',
                        minStake: Math.max(0, Math.min(casino.minStake, 999999.99)), // Validate range
                        maxStake: Math.max(0, Math.min(casino.maxStake, 999999.99)), // Validate range
                        dataUrl: casino.dataUrl?.substring(0, 500) || null, // Limit URL length
                        resultUrl: casino.resultUrl?.substring(0, 500) || null, // Limit URL length
                        streamId: casino.streamingId ? parseInt(casino.streamingId) || null : null
                      }
                    });
                  }
                });
                
                console.log(`✅ Synced ${validCasinos.length} casino games from backend to database`);
                source = 'backend-synced';
                syncTimestamp = Date.now();
                
              } catch (syncError) {
                console.error('💥 Error syncing backend data to database:', syncError);
                // Don't fail the request, continue with existing data
              }
            } else {
              console.warn(`⚠️ Invalid or excessive casino data from backend: ${backendData.data?.length || 0} items`);
            }
          }
        } else {
          console.warn(`⚠️ Backend responded with status ${backendResponse.status}`);
        }
      } catch (backendError) {
        console.error('💥 Backend refresh failed:', backendError);
        // Continue with database data
      }
    }

    // Get data from database using Prisma
    try {
      const result = await prisma.casinoTable.findMany({
        orderBy: {
          lastUpdated: 'desc'
        },
        take: PRODUCTION_CONFIG.MAX_CASINO_GAMES // Limit results
      });
      
      // Transform DB data to match expected format
      casinoData = result.map((casino: any) => ({
        eventId: casino.eventId.toString(),
        name: casino.name,
        shortName: casino.shortName,
        betStatus: casino.betStatus === 'OPEN' ? 'yes' : 'no',
        minStake: parseFloat(casino.minStake.toString()) || 0,
        maxStake: parseFloat(casino.maxStake.toString()) || 0,
        streamingId: casino.streamId?.toString(),
        dataUrl: casino.dataUrl,
        resultUrl: casino.resultUrl,
        lastUpdated: casino.lastUpdated
      }));
      
    } catch (dbError) {
      console.error('💥 Error fetching from database:', dbError);
      casinoData = [];
    }

    // Filter by status if provided
    let filteredCasinos = casinoData;
    if (status && status !== 'all') {
      filteredCasinos = casinoData.filter((casino: any) => casino.betStatus === status);
    }

    // Success response
    res.json({
      success: true,
      message: 'Casino data retrieved successfully',
      data: filteredCasinos,
      totalFetched: casinoData.length,
      totalFiltered: filteredCasinos.length,
      source: source,
      lastUpdated: casinoData.length > 0 ? Math.max(...casinoData.map((c: any) => new Date(c.lastUpdated).getTime())) : null,
      syncTimestamp: syncTimestamp,
      cacheControl: 'private, max-age=30' // Cache for 30 seconds
    });

  } catch (error: any) {
    // Structured error logging
    const errorId = `casino-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.error(`💥 Casino API Error [${errorId}]:`, {
      error: error.message,
      stack: error.stack,
      query: req.query,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });

    // Don't expose internal errors in production
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMessage = isProduction 
      ? 'An error occurred while processing your request'
      : error.message;

    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      errorId: errorId, // Include error ID for tracking
      ...(isProduction ? {} : { debug: error.stack })
    });
  }
}
