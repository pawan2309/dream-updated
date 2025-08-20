import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Bet API test route is working',
    timestamp: new Date().toISOString(),
    status: 'API is accessible'
  });
}
