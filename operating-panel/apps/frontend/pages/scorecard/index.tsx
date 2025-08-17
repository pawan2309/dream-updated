import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function ScorecardIndexPage() {
  return (
    <>
      <Head>
        <title>Cricket Scorecards</title>
        <meta name="description" content="Live cricket scorecards and match details" />
      </Head>

      <div className="container mt-4">
        <div className="row">
          <div className="col-12">
            <h1 className="mb-4">🏏 Cricket Scorecards</h1>
            
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Available Scorecards</h5>
              </div>
              <div className="card-body">
                <p className="text-muted">
                  View live cricket scorecards and match details. Click on a match to see the full scorecard.
                </p>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="card h-100">
                      <div className="card-body">
                        <h6 className="card-title">Sample Match 1</h6>
                        <p className="card-text">YORKS vs SOM - Live Scorecard</p>
                        <Link href="/scorecard/12345" className="btn btn-primary btn-sm">
                          View Scorecard
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <div className="card h-100">
                      <div className="card-body">
                        <h6 className="card-title">Sample Match 2</h6>
                        <p className="card-text">Team A vs Team B - Live Scorecard</p>
                        <Link href="/scorecard/67890" className="btn btn-primary btn-sm">
                          View Scorecard
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <h6>Quick Test Links:</h6>
                  <div className="btn-group" role="group">
                    <Link href="/scorecard/test123" className="btn btn-outline-secondary btn-sm">
                      Test Scorecard 1
                    </Link>
                    <Link href="/scorecard/test456" className="btn btn-outline-secondary btn-sm">
                      Test Scorecard 2
                    </Link>
                    <Link href="/scorecard/demo789" className="btn btn-outline-secondary btn-sm">
                      Demo Scorecard
                    </Link>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h6>API Endpoints:</h6>
                  <div className="bg-light p-3 rounded">
                    <code>/api/scorecard/[eventId]</code> - Frontend API endpoint<br/>
                    <code>/fetch/scorecard/[eventId]</code> - Backend API endpoint<br/>
                    <small className="text-muted">
                      Replace [eventId] with the actual match ID
                    </small>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card mt-4">
              <div className="card-header">
                <h5 className="mb-0">How to Use</h5>
              </div>
              <div className="card-body">
                <ol>
                  <li>Navigate to a specific scorecard using the URL: <code>/scorecard/[eventId]</code></li>
                  <li>The page will automatically fetch scorecard data from the backend API</li>
                  <li>Data is transformed and displayed in the exact format you specified</li>
                  <li>Real-time updates can be implemented using WebSocket connections</li>
                </ol>
                
                <div className="alert alert-info">
                  <strong>Note:</strong> The scorecard page is designed to match exactly with your HTML structure. 
                  It includes all the elements like over balls, team scores, batting details, and run rates.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
