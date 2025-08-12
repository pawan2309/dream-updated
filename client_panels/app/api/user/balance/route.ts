import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '../../../../lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                 request.cookies.get('authToken')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any

    // Get user data from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        balance: true,
        isActive: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      balance: user.balance,
      username: user.username
    })

  } catch (error) {
    console.error('Error fetching user balance:', error)
    return NextResponse.json(
      { error: 'Invalid token or internal server error' },
      { status: 401 }
    )
  }
} 