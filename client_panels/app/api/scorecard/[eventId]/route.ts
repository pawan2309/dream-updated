import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params;

  if (!eventId) {
    return NextResponse.json(
      { success: false, error: 'Event ID is required' },
      { status: 400 }
    );
  }

  try {
    // Call the backend scorecard API
    const backendUrl = `http://localhost:4001/fetch/scorecard/${eventId}`;
    
    console.log(`🏏 Client Panels API: Fetching scorecard for event ${eventId} from backend`);
    
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Betting-ClientPanels/1.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!backendResponse.ok) {
      console.error(`❌ Backend API error: ${backendResponse.status} ${backendResponse.statusText}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to fetch scorecard from backend',
          error: `${backendResponse.status}: ${backendResponse.statusText}`
        },
        { status: backendResponse.status }
      );
    }

    const backendData = await backendResponse.json();
    
    if (!backendData.success) {
      console.error('❌ Backend API returned error:', backendData);
      return NextResponse.json(
        {
          success: false,
          message: 'Backend API error',
          error: backendData.message || 'Unknown backend error'
        },
        { status: 500 }
      );
    }

    // Transform the backend data to match our frontend interface
    const transformedData = transformScorecardData(backendData.data, eventId);
    
    console.log(`✅ Successfully fetched and transformed scorecard for event ${eventId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Scorecard data retrieved successfully',
      data: transformedData,
      source: 'backend-api',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`💥 Client Panels scorecard API error for event ${eventId}:`, error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function transformScorecardData(rawData: any, eventId: string) {
  try {
    // Default structure if transformation fails
    const defaultData = {
      eventId: eventId,
      matchInfo: {
        name: "Match Details",
        status: "Live",
        venue: "TBD",
        startTime: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      teams: [
        {
          name: "Team 1",
          score: "0-0",
          overs: "0",
          wickets: "0",
          runRate: "0.00",
          logo: ""
        },
        {
          name: "Team 2",
          score: "0-0",
          overs: "0",
          wickets: "0",
          runRate: "0.00",
          logo: ""
        }
      ],
      currentInnings: {
        teamName: "Team 1",
        score: "0-0",
        overs: "0",
        wickets: "0",
        target: "0",
        ballsRemaining: "0",
        message: "Match starting soon"
      },
      batting: [],
      bowling: [],
      extras: {
        wides: "0",
        noBalls: "0",
        byes: "0",
        legByes: "0"
      },
      fallOfWickets: [],
      partnerships: [],
      overDetails: [],
      currentOver: ["-", "-", "-", "-", "-", "-"],
      requiredRunRate: "0.00",
      currentRunRate: "0.00"
    };

    // If no raw data, return default
    if (!rawData) {
      return defaultData;
    }

    // Try to extract meaningful data from the backend response
    const transformed = {
      ...defaultData,
      eventId: eventId,
      matchInfo: {
        name: rawData.matchName || rawData.name || rawData.match_name || "Match Details",
        status: rawData.status || rawData.matchStatus || "Live",
        venue: rawData.venue || rawData.ground || "TBD",
        startTime: rawData.startTime || rawData.startDate || rawData.matchStartTime || new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      teams: extractTeams(rawData),
      currentInnings: extractCurrentInnings(rawData),
      batting: extractBatting(rawData),
      bowling: extractBowling(rawData),
      extras: extractExtras(rawData),
      fallOfWickets: extractFallOfWickets(rawData),
      partnerships: extractPartnerships(rawData),
      overDetails: extractOverDetails(rawData),
      currentOver: extractCurrentOver(rawData),
      requiredRunRate: rawData.requiredRunRate || rawData.required_rr || "0.00",
      currentRunRate: rawData.currentRunRate || rawData.current_rr || "0.00"
    };

    return transformed;

  } catch (error) {
    console.error('Error transforming scorecard data:', error);
    // Return default data if transformation fails
    return {
      eventId: eventId,
      matchInfo: {
        name: "Match Details",
        status: "Live",
        venue: "TBD",
        startTime: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      teams: [
        { name: "Team 1", score: "0-0", overs: "0", wickets: "0", runRate: "0.00", logo: "" },
        { name: "Team 2", score: "0-0", overs: "0", wickets: "0", runRate: "0.00", logo: "" }
      ],
      currentInnings: {
        teamName: "Team 1",
        score: "0-0",
        overs: "0",
        wickets: "0",
        target: "0",
        ballsRemaining: "0",
        message: "Match starting soon"
      },
      batting: [],
      bowling: [],
      extras: { wides: "0", noBalls: "0", byes: "0", legByes: "0" },
      fallOfWickets: [],
      partnerships: [],
      overDetails: [],
      currentOver: ["-", "-", "-", "-", "-", "-"],
      requiredRunRate: "0.00",
      currentRunRate: "0.00"
    };
  }
}

function extractTeams(rawData: any) {
  try {
    if (rawData.teams && Array.isArray(rawData.teams)) {
      return rawData.teams.map((team: any) => ({
        name: team.name || team.teamName || "Unknown Team",
        score: team.score || team.runs || "0-0",
        overs: team.overs || "0",
        wickets: team.wickets || "0",
        runRate: team.runRate || team.rr || "0.00",
        logo: team.logo || ""
      }));
    }
    
    // Fallback: try to extract from other fields
    const teams = [];
    if (rawData.team1) {
      teams.push({
        name: rawData.team1.name || rawData.team1 || "Team 1",
        score: rawData.team1Score || "0-0",
        overs: rawData.team1Overs || "0",
        wickets: rawData.team1Wickets || "0",
        runRate: rawData.team1RR || "0.00",
        logo: ""
      });
    }
    if (rawData.team2) {
      teams.push({
        name: rawData.team2.name || rawData.team2 || "Team 2",
        score: rawData.team2Score || "0-0",
        overs: rawData.team2Overs || "0",
        wickets: rawData.team2Wickets || "0",
        runRate: rawData.team2RR || "0.00",
        logo: ""
      });
    }
    
    return teams.length > 0 ? teams : [
      { name: "Team 1", score: "0-0", overs: "0", wickets: "0", runRate: "0.00", logo: "" },
      { name: "Team 2", score: "0-0", overs: "0", wickets: "0", runRate: "0.00", logo: "" }
    ];
  } catch (error) {
    console.error('Error extracting teams:', error);
    return [
      { name: "Team 1", score: "0-0", overs: "0", wickets: "0", runRate: "0.00", logo: "" },
      { name: "Team 2", score: "0-0", overs: "0", wickets: "0", runRate: "0.00", logo: "" }
    ];
  }
}

function extractCurrentInnings(rawData: any) {
  try {
    if (rawData.currentInnings) {
      return {
        teamName: rawData.currentInnings.teamName || "Team 1",
        score: rawData.currentInnings.score || "0-0",
        overs: rawData.currentInnings.overs || "0",
        wickets: rawData.currentInnings.wickets || "0",
        target: rawData.currentInnings.target || "0",
        ballsRemaining: rawData.currentInnings.ballsRemaining || "0",
        message: rawData.currentInnings.message || "Match in progress"
      };
    }
    
    // Fallback: try to extract from other fields
    return {
      teamName: rawData.battingTeam || "Team 1",
      score: rawData.currentScore || "0-0",
      overs: rawData.currentOvers || "0",
      wickets: rawData.currentWickets || "0",
      target: rawData.target || "0",
      ballsRemaining: rawData.ballsRemaining || "0",
      message: rawData.message || "Match in progress"
    };
  } catch (error) {
    console.error('Error extracting current innings:', error);
    return {
      teamName: "Team 1",
      score: "0-0",
      overs: "0",
      wickets: "0",
      target: "0",
      ballsRemaining: "0",
      message: "Match starting soon"
    };
  }
}

function extractBatting(rawData: any) {
  try {
    if (rawData.batting && Array.isArray(rawData.batting)) {
      return rawData.batting.map((batsman: any) => ({
        name: batsman.name || "Unknown",
        runs: batsman.runs || "0",
        balls: batsman.balls || "0",
        fours: batsman.fours || "0",
        sixes: batsman.sixes || "0",
        strikeRate: batsman.strikeRate || "0.00",
        status: batsman.status || "Not Out"
      }));
    }
    return [];
  } catch (error) {
    console.error('Error extracting batting:', error);
    return [];
  }
}

function extractBowling(rawData: any) {
  try {
    if (rawData.bowling && Array.isArray(rawData.bowling)) {
      return rawData.bowling.map((bowler: any) => ({
        name: bowler.name || "Unknown",
        overs: bowler.overs || "0",
        maidens: bowler.maidens || "0",
        runs: bowler.runs || "0",
        wickets: bowler.wickets || "0",
        economy: bowler.economy || "0.00"
      }));
    }
    return [];
  } catch (error) {
    console.error('Error extracting bowling:', error);
    return [];
  }
}

function extractExtras(rawData: any) {
  try {
    if (rawData.extras) {
      return {
        wides: rawData.extras.wides || "0",
        noBalls: rawData.extras.noBalls || "0",
        byes: rawData.extras.byes || "0",
        legByes: rawData.extras.legByes || "0"
      };
    }
    return { wides: "0", noBalls: "0", byes: "0", legByes: "0" };
  } catch (error) {
    console.error('Error extracting extras:', error);
    return { wides: "0", noBalls: "0", byes: "0", legByes: "0" };
  }
}

function extractFallOfWickets(rawData: any) {
  try {
    if (rawData.fallOfWickets && Array.isArray(rawData.fallOfWickets)) {
      return rawData.fallOfWickets.map((wicket: any) => ({
        wicket: wicket.wicket || "0",
        score: wicket.score || "0",
        overs: wicket.overs || "0",
        batsman: wicket.batsman || "Unknown"
      }));
    }
    return [];
  } catch (error) {
    console.error('Error extracting fall of wickets:', error);
    return [];
  }
}

function extractPartnerships(rawData: any) {
  try {
    if (rawData.partnerships && Array.isArray(rawData.partnerships)) {
      return rawData.partnerships.map((partnership: any) => ({
        batsmen: partnership.batsmen || ["Unknown", "Unknown"],
        runs: partnership.runs || "0",
        balls: partnership.balls || "0"
      }));
    }
    return [];
  } catch (error) {
    console.error('Error extracting partnerships:', error);
    return [];
  }
}

function extractOverDetails(rawData: any) {
  try {
    if (rawData.overDetails && Array.isArray(rawData.overDetails)) {
      return rawData.overDetails.map((over: any) => ({
        over: over.over || "0",
        runs: over.runs || "0",
        wickets: over.wickets || "0",
        extras: over.extras || "0"
      }));
    }
    return [];
  } catch (error) {
    console.error('Error extracting over details:', error);
    return [];
  }
}

function extractCurrentOver(rawData: any) {
  try {
    if (rawData.currentOver && Array.isArray(rawData.currentOver)) {
      return rawData.currentOver.map((ball: any) => ball.toString());
    }
    return ["-", "-", "-", "-", "-", "-"];
  } catch (error) {
    console.error('Error extracting current over:', error);
    return ["-", "-", "-", "-", "-", "-"];
  }
}
