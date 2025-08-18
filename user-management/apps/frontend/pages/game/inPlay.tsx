import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Head from 'next/head';

interface LiveMatch {
  id: string;
  title: string;
  externalId: string;
  status: string;
  isLive: boolean;
  startTime?: Date;
  teams?: any;
  matchName?: string;
  matchType?: string;
  tournament?: string;
  apiSource?: string;
  beventId?: string;
  bmarketId?: string;
  isCricket?: boolean;
  lastUpdated?: Date;
}

export default function InPlayPage() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLiveMatches();
    // Refresh every 3 seconds
    const interval = setInterval(fetchLiveMatches, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/matches/inplay');
      if (!response.ok) {
        throw new Error('Failed to fetch live matches');
      }
      const data = await response.json();
      setMatches(data.matches || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      console.error('Error fetching live matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'live':
        return <span className="badge badge-danger">LIVE</span>;
      case 'upcoming':
        return <span className="badge badge-warning">UPCOMING</span>;
      case 'finished':
        return <span className="badge badge-secondary">FINISHED</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  const formatTime = (dateString: string | Date) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatTeams = (teams: any) => {
    if (!teams) return 'N/A';
    if (typeof teams === 'string') return teams;
    if (Array.isArray(teams)) return teams.join(' vs ');
    return 'Teams info unavailable';
  };

  return (
    <Layout>
      <Head>
        <title>InPlay Game</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/fontawesome-free/css/all.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/datatables-responsive/css/responsive.bootstrap4.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/dist/css/adminlte.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/overlayScrollbars/css/OverlayScrollbars.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/sweetalert2-theme-bootstrap-4/bootstrap-4.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/overlayScrollbars/css/OverlayScrollbars.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/sweetalert2-theme-bootstrap-4/bootstrap-4.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/toastr/toastr.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/select2/css/select2.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/daterangepicker/daterangepicker.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/tempusdominus-bootstrap-4/css/tempusdominus-bootstrap-4.min.css" />
      </Head>
      <section className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1>In Play Games</h1>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item"><a href="/">Home</a></li>
                <li className="breadcrumb-item active">In Play Games</li>
              </ol>
            </div>
          </div>
        </div>
      </section>
      <section className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h3 className="card-title">Live Matches</h3>
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={fetchLiveMatches}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-1"></i>
                          Loading...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-sync-alt mr-1"></i>
                          Refresh
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  {error && (
                    <div className="alert alert-danger alert-dismissible">
                      <button type="button" className="close" data-dismiss="alert" aria-hidden="true">×</button>
                      <h5><i className="icon fas fa-ban"></i> Error!</h5>
                      {error}
                    </div>
                  )}
                  
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'center' }}><input type="checkbox" name="all" id="all" value="1" /></th>
                        <th>#</th>
                        <th>Game</th>
                        <th>Market</th>
                        <th>Start Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="text-center">
                            <div className="d-flex justify-content-center align-items-center py-4">
                              <div className="spinner-border text-primary" role="status">
                                <span className="sr-only">Loading...</span>
                              </div>
                              <span className="ml-2">Loading live matches...</span>
                            </div>
                          </td>
                        </tr>
                      ) : matches.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-4">
                            <i className="fas fa-info-circle mr-2"></i>
                            No live matches available at the moment
                          </td>
                        </tr>
                      ) : (
                        matches.map((match, index) => (
                          <tr key={match.id}>
                            <td style={{ textAlign: 'center' }}>
                              <input type="checkbox" name={`match_${match.id}`} value={match.id} />
                            </td>
                            <td>{index + 1}</td>
                            <td>
                              <div>
                                <strong>{match.title || match.matchName || 'Match'}</strong>
                                {match.tournament && (
                                  <div className="text-muted small">{match.tournament}</div>
                                )}
                                {match.matchType && (
                                  <div className="text-muted small">{match.matchType}</div>
                                )}
                              </div>
                            </td>
                            <td>
                              <div>
                                <div>{formatTeams(match.teams)}</div>
                                {match.apiSource && (
                                  <div className="text-muted small">Source: {match.apiSource}</div>
                                )}
                              </div>
                            </td>
                            <td>
                              {match.startTime ? formatTime(match.startTime) : 'TBD'}
                            </td>
                            <td>
                              {getStatusBadge(match.status)}
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-info btn-sm" title="View Details">
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button className="btn btn-success btn-sm" title="Edit Match">
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button className="btn btn-warning btn-sm" title="Manage Odds">
                                  <i className="fas fa-chart-line"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
} 