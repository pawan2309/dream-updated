import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface ScorecardData {
  eventId: string;
  matchInfo: {
    name: string;
    status: string;
    venue: string;
    startTime: string;
    lastUpdated: string;
  };
  teams: Array<{
    name: string;
    score: string;
    overs: string;
    wickets: string;
    runRate: string;
    logo: string;
  }>;
  currentInnings: {
    teamName: string;
    score: string;
    overs: string;
    wickets: string;
    target: string;
    ballsRemaining: string;
    message: string;
  };
  batting: Array<{
    name: string;
    runs: string;
    balls: string;
    fours: string;
    sixes: string;
    strikeRate: string;
    isNotOut: boolean;
  }>;
  bowling: Array<{
    name: string;
    overs: string;
    maidens: string;
    runs: string;
    wickets: string;
    economy: string;
  }>;
  extras: {
    wides: string;
    noBalls: string;
    byes: string;
    legByes: string;
  };
  fallOfWickets: Array<{
    wicket: string;
    score: string;
    partnership: string;
  }>;
  partnerships: Array<{
    wicket: string;
    partnership: string;
    runs: string;
  }>;
  overDetails: Array<{
    over: string;
    balls: string[];
  }>;
  currentOver: string[];
  requiredRunRate: string;
  currentRunRate: string;
}

export default function ScorecardPage() {
  const router = useRouter();
  const { eventId } = router.query;
  const [scorecardData, setScorecardData] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchScorecardData(eventId as string);
    }
  }, [eventId]);

  const fetchScorecardData = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/scorecard/${id}`);
      if (response.ok) {
        const data = await response.json();
        setScorecardData(data);
      } else {
        setError('Failed to fetch scorecard data');
      }
    } catch (err) {
      setError('Error fetching scorecard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  // Mock data for demonstration - replace with actual API data
  const mockData = {
    eventId: eventId as string,
    matchInfo: {
      name: "YORKS vs SOM",
      status: "Inning Break",
      venue: "Headingley",
      startTime: "2025-08-14T10:00:00Z",
      lastUpdated: new Date().toISOString()
    },
    teams: [
      {
        name: "YORKS",
        score: "247-10",
        overs: "48.5",
        wickets: "10",
        runRate: "5.08",
        logo: "https://cricketchampion.co.in/webroot/img/teams/1661906361_team.png"
      },
      {
        name: "SOM",
        score: "0-0",
        overs: "0",
        wickets: "0",
        runRate: "0.00",
        logo: "https://cricketchampion.co.in/webroot/img/teams/1987967957_team.png"
      }
    ],
    currentInnings: {
      teamName: "SOM",
      score: "0-0",
      overs: "0",
      wickets: "0",
      target: "248",
      ballsRemaining: "300",
      message: "SOM needs 248 runs in 300 balls to win"
    },
    batting: [
      {
        name: "Archie Vaughan*",
        runs: "-",
        balls: "-",
        fours: "-",
        sixes: "-",
        strikeRate: "-",
        isNotOut: true
      },
      {
        name: "Tom Lammonby",
        runs: "-",
        balls: "-",
        fours: "-",
        sixes: "-",
        strikeRate: "-",
        isNotOut: false
      }
    ],
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
    requiredRunRate: "4.96",
    currentRunRate: "0.00"
  };

  const data = scorecardData || mockData;

  return (
    <>
      <Head>
        <title>Cricket Scorecard - {data.matchInfo.name}</title>
        <meta name="description" content={`Live cricket scorecard for ${data.matchInfo.name}`} />
      </Head>

      <div id="root">
        <div className="App">
          <div id="i_frame_4">
            <div className="wbt99-scoremain">
              {/* Header with Over Balls */}
              <div className="main-score-row-head">
                <div className="d-flex text-light" style={{ marginBottom: '0px', padding: '0px' }}>
                  {data.currentOver.map((ball, index) => (
                    <div key={index} className="overBall text-light bg-primary">
                      <span>{ball}</span>
                    </div>
                  ))}
                </div>
                <span className="ball-message welTxt d-flex justify-content-between">
                  <div>{data.matchInfo.status}</div>
                  <div>
                    <svg 
                      stroke="currentColor" 
                      fill="currentColor" 
                      strokeWidth="0" 
                      viewBox="0 0 512 512" 
                      height="1em" 
                      width="1em" 
                      xmlns="http://www.w3.org/2000/svg" 
                      style={{ fontSize: '27px', cursor: 'pointer' }}
                    >
                      <path fill="none" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="32" d="M416 432 64 80"></path>
                      <path d="M224 136.92v33.8a4 4 0 0 0 1.17 2.82l24 24a4 4 0 0 0 6.83-2.82v-74.15a24.53 24.53 0 0 0-12.67-21.72 23.91 23.91 0 0 0-25.55 1.83 8.27 8.27 0 0 0-.66.51l-31.94 26.15a4 4 0 0 0-.29 5.92l17.05 17.06a4 4 0 0 0 5.37.26zm0 238.16-78.07-63.92a32 32 0 0 0-20.28-7.16H64v-96h50.72a4 4 0 0 0 2.82-6.83l-24-24a4 4 0 0 0-2.82-1.17H56a24 24 0 0 0-24 24v112a24 24 0 0 0 24 24h69.76l91.36 74.8a8.27 8.27 0 0 0 .66.51 23.93 23.93 0 0 0 25.85 1.69A24.49 24.49 0 0 0 256 391.45v-50.17a4 4 0 0 0-1.17-2.82l-24-24a4 4 0 0 0-6.83 2.82zM125.82 336zM352 256c0-24.56-5.81-47.88-17.75-71.27a16 16 0 0 0-28.5 14.54C315.34 218.06 320 236.62 320 256q0 4-.31 8.13a8 8 0 0 0 2.32 6.25l19.66 19.67a4 4 0 0 0 6.75-2A146.89 146.89 0 0 0 352 256zm64 0c0-51.19-13.08-83.89-34.18-120.06a16 16 0 0 0-27.64 16.12C373.07 184.44 384 211.83 384 256c0 23.83-3.29 42.88-9.37 60.65a8 8 0 0 0 1.9 8.26l16.77 16.76a4 4 0 0 0 6.52-1.27C410.09 315.88 416 289.91 416 256z"></path>
                      <path d="M480 256c0-74.26-20.19-121.11-50.51-168.61a16 16 0 1 0-27 17.22C429.82 147.38 448 189.5 448 256c0 47.45-8.9 82.12-23.59 113a4 4 0 0 0 .77 4.55L443 391.39a4 4 0 0 0 6.4-1C470.88 348.22 480 307 480 256z"></path>
                    </svg>
                  </div>
                </span>
              </div>

              {/* Team Scores */}
              <div className="main-score-row-body">
                <span className="team-name4">
                  <img 
                    width="25px" 
                    height="25px" 
                    src={data.teams[0].logo} 
                    alt="team1" 
                    style={{ borderRadius: '50%', marginInline: '5px' }}
                  />
                  {data.teams[0].name}
                </span>
                <span className="wbt99-runrate"> </span>
                <span className="team-score">{data.teams[0].score} ({data.teams[0].overs})</span>
              </div>

              <div className="main-score-row-body">
                <span className="team-name4">
                  <img 
                    alt="team2" 
                    width="25px" 
                    height="25px" 
                    src={data.teams[1].logo} 
                    style={{ borderRadius: '50%', marginInline: '5px' }}
                  />
                  {data.teams[1].name}
                </span>
                <span className="wbt99-runrate"> </span>
                <span className="team-score">{data.teams[1].score} ({data.teams[1].overs})</span>
              </div>

              {/* Target Message */}
              <div className="main-score-row-body" style={{ marginBottom: '10px' }}>
                <div className="text-nowrap overflow-auto" style={{ margin: 'auto' }}>
                  <span style={{ fontSize: '14px', color: 'rgb(255, 255, 255)' }}>
                    {data.currentInnings.message}
                  </span>
                </div>
              </div>

              {/* Batting Details Table */}
              <div className="main-score-row-body" style={{ background: 'rgba(0, 0, 0, 0.78)' }}>
                <div className="row" style={{ fontSize: '16px', color: 'rgb(255, 255, 255)', display: 'inline-grid', width: '100%', margin: 'auto' }}>
                  {/* Header */}
                  <div className="inner" style={{ background: 'teal' }}>
                    <span style={{ width: '50%' }}>Player</span>
                    <span style={{ width: '20%' }}>Run(Ball)</span>
                    <span style={{ width: '10%' }}>4s</span>
                    <span style={{ width: '10%' }}>6s</span>
                    <span style={{ width: '10%' }}>SR</span>
                  </div>
                  
                  {/* Batting Rows */}
                  {data.batting.map((batsman, index) => (
                    <span key={index} className="inner">
                      <span style={{ width: '50%' }}>
                        {batsman.name}{batsman.isNotOut ? '*' : ''}
                      </span>
                      <span style={{ width: '20%' }}> {batsman.runs} ({batsman.balls})</span>
                      <span style={{ width: '10%' }}>{batsman.fours}</span>
                      <span style={{ width: '10%' }}> {batsman.sixes}</span>
                      <span style={{ width: '10%' }}> {batsman.strikeRate}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer with Run Rate */}
              <div className="footer d-flex w-100 justify-content-between align-items-center mt-1 px-2" style={{ background: 'teal' }}>
                <div className="text-start" style={{ width: '70%' }}>
                  CRR : {data.currentRunRate}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .App {
          font-family: Arial, sans-serif;
          background: #1a1a1a;
          color: white;
          min-height: 100vh;
        }
        
        .wbt99-scoremain {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .main-score-row-head {
          background: #2c2c2c;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
        }
        
        .overBall {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 5px;
          font-weight: bold;
        }
        
        .ball-message {
          margin-top: 10px;
          font-size: 18px;
          font-weight: bold;
        }
        
        .main-score-row-body {
          background: #2c2c2c;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .team-name4 {
          display: flex;
          align-items: center;
          font-weight: bold;
          font-size: 18px;
        }
        
        .team-score {
          font-size: 20px;
          font-weight: bold;
          color: #ffd700;
        }
        
        .wbt99-runrate {
          color: #888;
        }
        
        .inner {
          display: grid;
          grid-template-columns: 50% 20% 10% 10% 10%;
          padding: 8px 0;
          border-bottom: 1px solid #444;
        }
        
        .inner:last-child {
          border-bottom: none;
        }
        
        .footer {
          padding: 10px;
          border-radius: 0 0 8px 8px;
        }
        
        .text-light {
          color: #ffffff !important;
        }
        
        .bg-primary {
          background-color: #007bff !important;
        }
        
        .bg-teal {
          background-color: teal !important;
        }
        
        .d-flex {
          display: flex !important;
        }
        
        .justify-content-between {
          justify-content: space-between !important;
        }
        
        .align-items-center {
          align-items: center !important;
        }
        
        .text-nowrap {
          white-space: nowrap !important;
        }
        
        .overflow-auto {
          overflow: auto !important;
        }
        
        .mt-1 {
          margin-top: 0.25rem !important;
        }
        
        .px-2 {
          padding-left: 0.5rem !important;
          padding-right: 0.5rem !important;
        }
        
        .w-100 {
          width: 100% !important;
        }
        
        .text-start {
          text-align: left !important;
        }
      `}</style>
    </>
  );
}
