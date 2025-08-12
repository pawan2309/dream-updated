import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface LoginSession {
  id: string;
  loginAt: string;
  logoutAt?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  location?: string;
  sessionDuration?: number;
  isActive: boolean;
  user: {
    id: string;
    username: string;
    name?: string;
    role: string;
    code?: string;
  };
}

interface LoginStats {
  totalLogins: number;
  activeSessions: number;
  avgSessionDuration: number;
  deviceStats: Record<string, number>;
  roleStats: Record<string, number>;
}

export default function LoginReportsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [stats, setStats] = useState<LoginStats>({
    totalLogins: 0,
    activeSessions: 0,
    avgSessionDuration: 0,
    deviceStats: {},
    roleStats: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [reportType, setReportType] = useState('daily');
  const [selectedRole, setSelectedRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Read URL parameters on component mount and when router changes
  useEffect(() => {
    if (router.isReady) {
      const { role, type, startDate: urlStartDate, endDate: urlEndDate } = router.query;
      
      if (role && typeof role === 'string') {
        setSelectedRole(role);
      }
      if (type && typeof type === 'string') {
        setReportType(type);
      }
      if (urlStartDate && typeof urlStartDate === 'string') {
        setStartDate(urlStartDate);
      }
      if (urlEndDate && typeof urlEndDate === 'string') {
        setEndDate(urlEndDate);
      }
    }
  }, [router.isReady, router.query]);

  useEffect(() => {
    if (router.isReady) {
      fetchLoginReports();
    }
  }, [reportType, selectedRole, startDate, endDate, currentPage, router.isReady]);

  const updateURL = (newFilters: any) => {
    const query = { ...router.query, ...newFilters };
    // Remove empty values
    Object.keys(query).forEach(key => {
      if (!query[key] || query[key] === '') {
        delete query[key];
      }
    });
    router.push({
      pathname: router.pathname,
      query: query
    }, undefined, { shallow: true });
  };

  const fetchLoginReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        page: currentPage.toString(),
        limit: '50',
      });

      if (selectedRole) params.append('role', selectedRole);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/reports/login-reports?${params}`);
      const data = await response.json();

      if (data.success) {
        setSessions(data.data || []);
        setStats({
          totalLogins: data.stats?.totalLogins || 0,
          activeSessions: data.stats?.activeSessions || 0,
          avgSessionDuration: data.stats?.avgSessionDuration || 0,
          deviceStats: data.stats?.deviceStats || {},
          roleStats: data.stats?.roleStats || {},
        });
        setTotalPages(data.pagination?.pages || 1);
      } else {
        setError('Failed to fetch login reports');
      }
    } catch (err) {
      setError('Error fetching login reports');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN');
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'mobile': return '📱';
      case 'tablet': return '📱';
      case 'desktop': return '💻';
      default: return '❓';
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? 
      <span className="badge badge-success">Online</span> : 
      <span className="badge badge-secondary">Offline</span>;
  };

  return (
    <Layout>
      <Head>
        <title>Login Reports</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      
      <section className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1>Login Reports</h1>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item"><a href="/">Home</a></li>
                <li className="breadcrumb-item active">Login Reports</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="content">
        <div className="container-fluid">
          {/* Statistics Cards */}
            <div className="row mb-4">
              <div className="col-lg-3 col-6">
                <div className="small-box bg-info">
                  <div className="inner">
                    <h3>{stats.totalLogins || 0}</h3>
                    <p>Total Logins</p>
                  </div>
                  <div className="icon">
                    <i className="fas fa-sign-in-alt"></i>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-6">
                <div className="small-box bg-success">
                  <div className="inner">
                    <h3>{stats.activeSessions || 0}</h3>
                    <p>Currently Online</p>
                  </div>
                  <div className="icon">
                    <i className="fas fa-users"></i>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-6">
                <div className="small-box bg-warning">
                  <div className="inner">
                    <h3>{Math.round(stats.avgSessionDuration || 0)}m</h3>
                    <p>Avg Session Duration</p>
                  </div>
                  <div className="icon">
                    <i className="fas fa-clock"></i>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-6">
                <div className="small-box bg-danger">
                  <div className="inner">
                    <h3>{Object.keys(stats.deviceStats || {}).length}</h3>
                    <p>Device Types</p>
                  </div>
                  <div className="icon">
                    <i className="fas fa-mobile-alt"></i>
                  </div>
                </div>
              </div>
            </div>

          {/* Filters */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Filters</h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-2">
                  <div className="form-group">
                    <label>Report Type</label>
                    <select 
                      className="form-control" 
                      value={reportType} 
                      onChange={(e) => {
                        setReportType(e.target.value);
                        updateURL({ type: e.target.value });
                      }}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="online">Currently Online</option>
                      <option value="session-duration">Session Duration</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="form-group">
                    <label>Role</label>
                    <select 
                      className="form-control" 
                      value={selectedRole} 
                      onChange={(e) => {
                        setSelectedRole(e.target.value);
                        updateURL({ role: e.target.value });
                      }}
                    >
                      <option value="">All Roles</option>
                      <option value="BOSS">BOSS</option>
                      <option value="SUB">SUB</option>
                      <option value="MASTER">MASTER</option>
                      <option value="SUPER_AGENT">SUPER_AGENT</option>
                      <option value="AGENT">AGENT</option>
                      <option value="USER">USER</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={startDate} 
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        updateURL({ startDate: e.target.value });
                      }}
                    />
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="form-group">
                    <label>End Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={endDate} 
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        updateURL({ endDate: e.target.value });
                      }}
                    />
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="form-group">
                    <label>&nbsp;</label>
                    <button 
                      className="btn btn-primary form-control" 
                      onClick={fetchLoginReports}
                    >
                      <i className="fas fa-search"></i> Search
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Login Sessions</h3>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                  <p>Loading login reports...</p>
                </div>
              ) : error ? (
                <div className="alert alert-danger">
                  <h6>{error}</h6>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>User</th>
                        <th>Role</th>
                        <th>Login Time</th>
                        <th>Logout Time</th>
                        <th>Duration</th>
                        <th>Device</th>
                        <th>IP Address</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session, index) => (
                        <tr key={session.id}>
                          <td>{index + 1}</td>
                          <td>
                            <strong>{session.user.username}</strong>
                            {session.user.name && <br />}
                            {session.user.name && <small className="text-muted">{session.user.name}</small>}
                          </td>
                          <td>
                            <span className="badge badge-info">{session.user.role}</span>
                          </td>
                          <td>{formatDate(session.loginAt)}</td>
                          <td>{session.logoutAt ? formatDate(session.logoutAt) : 'N/A'}</td>
                          <td>{formatDuration(session.sessionDuration)}</td>
                          <td>
                            {getDeviceIcon(session.deviceType)} {session.deviceType || 'Unknown'}
                          </td>
                          <td>
                            <small className="text-muted">{session.ipAddress || 'N/A'}</small>
                          </td>
                          <td>{getStatusBadge(session.isActive)}</td>
                        </tr>
                      ))}
                      
                      {sessions.length === 0 && (
                        <tr>
                          <td colSpan={9} className="text-center">No login sessions found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <nav>
                    <ul className="pagination">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </button>
                      </li>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        </li>
                      ))}
                      
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
} 