import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Head from 'next/head';

interface CompletedMatch {
  id: string;
  code: string;
  name: string;
  dateTime?: Date;
  matchType: string;
  declare: string;
  wonBy: string;
  plusMinus: string;
  teams?: any;
  tournament?: string;
  apiSource?: string;
  settledAt?: Date;
  result?: string;
  resultData?: any;
}

export default function CompleteGamePage() {
  const [matches, setMatches] = useState<CompletedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompletedMatches();
    // Refresh every 60 seconds (less frequent for completed matches)
    const interval = setInterval(fetchCompletedMatches, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchCompletedMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/matches/completed');
      if (!response.ok) {
        throw new Error('Failed to fetch completed matches');
      }
      const data = await response.json();
      setMatches(data.matches || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      console.error('Error fetching completed matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'finished':
        return <span className="badge badge-success">FINISHED</span>;
      case 'settled':
        return <span className="badge badge-info">SETTLED</span>;
      case 'cancelled':
        return <span className="badge badge-danger">CANCELLED</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const formatDateTime = (dateString: string | Date) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
        <title>Complete Game</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/fontawesome-free/css/all.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/datatables-responsive/css/responsive.bootstrap4.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/dist/css/adminlte.min.css" />
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
              <h1>Complete Game</h1>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item"><a href="/">Home</a></li>
                <li className="breadcrumb-item active">Complete Game</li>
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
                    <h3 className="card-title">Completed Matches</h3>
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={fetchCompletedMatches}
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
                        <th>SNo</th>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Date Time</th>
                        <th>Match Type</th>
                        <th>Declare</th>
                        <th>Won By</th>
                        <th>Plus Minus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={10} className="text-center">
                            <div className="d-flex justify-content-center align-items-center py-4">
                              <div className="spinner-border text-primary" role="status">
                                <span className="sr-only">Loading...</span>
                              </div>
                              <span className="ml-2">Loading completed matches...</span>
                            </div>
                          </td>
                        </tr>
                      ) : matches.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="text-center text-muted py-4">
                            <i className="fas fa-info-circle mr-2"></i>
                            No completed matches available
                          </td>
                        </tr>
                      ) : (
                        matches.map((match, index) => (
                          <tr key={match.id}>
                            <td style={{ textAlign: 'center' }}>
                              <input type="checkbox" name={`match_${match.id}`} value={match.id} />
                            </td>
                            <td>{index + 1}</td>
                            <td>{index + 1}</td>
                            <td>
                              <span className="badge badge-secondary">{match.code}</span>
                            </td>
                            <td>
                              <div>
                                <strong>{match.name}</strong>
                                {match.tournament && (
                                  <div className="text-muted small">{match.tournament}</div>
                                )}
                                <div className="text-muted small">{formatTeams(match.teams)}</div>
                              </div>
                            </td>
                            <td>
                              {match.dateTime ? formatDateTime(match.dateTime) : 'N/A'}
                            </td>
                            <td>
                              <span className="badge badge-info">{match.matchType}</span>
                            </td>
                            <td>
                              {getStatusBadge(match.declare)}
                            </td>
                            <td>
                              <span className="badge badge-success">{match.wonBy}</span>
                            </td>
                            <td>
                              <span className={`badge ${match.plusMinus.startsWith('-') ? 'badge-danger' : 'badge-success'}`}>
                                {match.plusMinus}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot></tfoot>
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