import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { eventId } = req.query;

  if (!eventId) {
    return res.status(400).json({ message: 'Event ID is required' });
  }

  try {
    // Call the backend scorecard API with the new URL
    const backendUrl = `http://localhost:4001/fetch/scorecard/${eventId}`;
    
    console.log(`🏏 Frontend API: Fetching scorecard for event ${eventId} from backend`);
    
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Betting-Frontend/1.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!backendResponse.ok) {
      console.error(`❌ Backend API error: ${backendResponse.status} ${backendResponse.statusText}`);
      return res.status(backendResponse.status).json({
        success: false,
        message: 'Failed to fetch scorecard from backend',
        error: `${backendResponse.status}: ${backendResponse.statusText}`
      });
    }

    const backendData = await backendResponse.json();
    
    if (!backendData.success) {
      console.error('❌ Backend API returned error:', backendData);
      return res.status(500).json({
        success: false,
        message: 'Backend API error',
        error: backendData.message || 'Unknown backend error'
      });
    }

    // Transform the backend data to match our frontend interface
    const transformedData = transformScorecardData(backendData.data, eventId as string);
    
    console.log(`✅ Successfully fetched and transformed scorecard for event ${eventId}`);
    
    res.json({
      success: true,
      message: 'Scorecard data retrieved successfully',
      data: transformedData,
      source: 'backend-api',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`💥 Frontend scorecard API error for event ${eventId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function transformScorecardData(rawData: any, eventId: string) {
  // This function transforms the backend API response to match our frontend interface
  // You'll need to adjust this based on the actual structure of your backend API response
  
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
    // This is a basic transformation - you'll need to customize based on your actual API response
    
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

// Helper functions to extract data from various possible API response structures
function extractTeams(data: any) {
  // Try to extract team information from various possible structures
  const teams = [];
  
  if (data.teams && Array.isArray(data.teams)) {
    for (const team of data.teams) {
      teams.push({
        name: team.name || team.teamName || "Unknown",
        score: team.score || team.runs || "0-0",
        overs: team.overs || team.over || "0",
        wickets: team.wickets || team.wkts || "0",
        runRate: team.runRate || team.rr || "0.00",
        logo: team.logo || team.teamLogo || ""
      });
    }
  }
  
  // If no teams found, return default
  if (teams.length === 0) {
    teams.push(
      { name: "Team 1", score: "0-0", overs: "0", wickets: "0", runRate: "0.00", logo: "" },
      { name: "Team 2", score: "0-0", overs: "0", wickets: "0", runRate: "0.00", logo: "" }
    );
  }
  
  return teams;
}

function extractCurrentInnings(data: any) {
  return {
    teamName: data.currentTeam || data.battingTeam || "Team 1",
    score: data.currentScore || data.score || "0-0",
    overs: data.currentOvers || data.overs || "0",
    wickets: data.currentWickets || data.wickets || "0",
    target: data.target || data.requiredRuns || "0",
    ballsRemaining: data.ballsRemaining || data.ballsLeft || "0",
    message: data.message || data.targetMessage || "Match in progress"
  };
}

function extractBatting(data: any) {
  if (data.batting && Array.isArray(data.batting)) {
    return data.batting.map((batsman: any) => ({
      name: batsman.name || batsman.batsmanName || "Unknown",
      runs: batsman.runs || "0",
      balls: batsman.balls || "0",
      fours: batsman.fours || "0",
      sixes: batsman.sixes || "0",
      strikeRate: batsman.strikeRate || batsman.sr || "0.00",
      isNotOut: batsman.isNotOut || batsman.notOut || false
    }));
  }
  return [];
}

function extractBowling(data: any) {
  if (data.bowling && Array.isArray(data.bowling)) {
    return data.bowling.map((bowler: any) => ({
      name: bowler.name || bowler.bowlerName || "Unknown",
      overs: bowler.overs || "0",
      maidens: bowler.maidens || "0",
      runs: bowler.runs || "0",
      wickets: bowler.wickets || "0",
      economy: bowler.economy || bowler.eco || "0.00"
    }));
  }
  return [];
}

function extractExtras(data: any) {
  return {
    wides: data.extras?.wides || "0",
    noBalls: data.extras?.noBalls || data.extras?.no_balls || "0",
    byes: data.extras?.byes || "0",
    legByes: data.extras?.legByes || data.extras?.leg_byes || "0"
  };
}

function extractFallOfWickets(data: any) {
  if (data.fallOfWickets && Array.isArray(data.fallOfWickets)) {
    return data.fallOfWickets.map((wicket: any) => ({
      wicket: wicket.wicket || "1",
      score: wicket.score || "0",
      partnership: wicket.partnership || "0"
    }));
  }
  return [];
}

function extractPartnerships(data: any) {
  if (data.partnerships && Array.isArray(data.partnerships)) {
    return data.partnerships.map((partnership: any) => ({
      wicket: partnership.wicket || "1",
      partnership: partnership.partnership || "0",
      runs: partnership.runs || "0"
    }));
  }
  return [];
}

function extractOverDetails(data: any) {
  if (data.overDetails && Array.isArray(data.overDetails)) {
    return data.overDetails.map((over: any) => ({
      over: over.over || "1",
      balls: over.balls || ["-", "-", "-", "-", "-", "-"]
    }));
  }
  return [];
}

function extractCurrentOver(data: any) {
  if (data.currentOver && Array.isArray(data.currentOver)) {
    return data.currentOver;
  }
  if (data.currentBall && Array.isArray(data.currentBall)) {
    return data.currentBall;
  }
  return ["-", "-", "-", "-", "-", "-"];
}
