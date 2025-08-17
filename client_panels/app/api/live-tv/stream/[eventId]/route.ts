import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  console.log('🚀 LIVE TV ROUTE CALLED!');
  
  try {
    const { eventId } = params;
    console.log('🔍 Event ID:', eventId);
    
    // Check if this is a casino game (streamingId format)
    const isCasinoGame = /^\d{4}$/.test(eventId); // Casino games have 4-digit IDs like 3030, 3035, etc.
    
    if (isCasinoGame) {
      // For casino games, return JSON with stream URL
      const streamUrl = `https://casinostream.trovetown.co/route/?id=${eventId}`;
      
      console.log('🎰 Casino stream URL:', streamUrl);
      
      return NextResponse.json({
        success: true,
        streamUrl: streamUrl,
        message: 'Casino stream URL retrieved successfully'
      });
    } else {
      // For cricket matches, return HLS content directly
      const hlsContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:1
#EXTINF:6.0,
https://mis3.sqmr.xyz:3334/app/${eventId}/llhls.m3u8`;
      
      console.log('🏏 Cricket HLS content returned');
      
      return new NextResponse(hlsContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { success: false, message: 'Error' },
      { status: 500 }
    );
  }
}
