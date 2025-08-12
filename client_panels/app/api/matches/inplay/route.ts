import { NextRequest, NextResponse } from 'next/server';
import { sharedApiService } from '../../../../lib/sharedApi';

export async function GET(request: NextRequest) {
  try {
    // Fetch live matches from the operating panel
    const result = await sharedApiService.getLiveMatches();
    
    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        matches: result.data
      });
    } else {
      console.error('Failed to fetch live matches:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          message: result.error || 'Failed to fetch live matches' 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in inplay matches API:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 