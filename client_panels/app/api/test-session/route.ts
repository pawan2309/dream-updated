import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [TEST-SESSION] Testing backend session endpoint...');
    
    // Get token from authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'No authorization token provided'
      });
    }

    const token = authHeader.substring(7);
    console.log('🔍 [TEST-SESSION] Token:', token.substring(0, 20) + '...');
    
    // Test backend session endpoint
    const response = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/auth/session', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('🔍 [TEST-SESSION] Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [TEST-SESSION] Backend failed:', response.status, errorText);
      return NextResponse.json({
        success: false,
        error: `Backend failed: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    console.log('✅ [TEST-SESSION] Backend success:', JSON.stringify(data, null, 2));
    
    return NextResponse.json({
      success: true,
      message: 'Backend session test successful',
      data: data
    });

  } catch (error) {
    console.error('❌ [TEST-SESSION] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
