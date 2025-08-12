import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface CommissionData {
  user: {
    id: string;
    username: string;
    name: string;
    role: string;
    code: string;
  };
  summary: {
    totalCommissions: number;
    commissionConfig: {
      share: number;
      matchcommission: number;
      sessioncommission: number;
      mobileshare: number;
    };
  };
  distributions: Array<{
    id: string;
    amountEarned: number;
    profitShare: number;
    createdAt: string;
    bet: {
      id: string;
      stake: number;
      potentialWin: number;
      status: string;
    };
  }>;
  totalCommissions: number;
  totalBets: number;
}

export default function CommissionDashboard() {
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUserAndCommissions = async () => {
      try {
        // Get current user
        const userRes = await fetch('/api/auth/session');
        const userData = await userRes.json();
        
        if (userData.valid && userData.user) {
          setUser(userData.user);
          
          // Get commission data
          await fetchCommissionData(userData.user.id);
        } else {
          setError('User not authenticated');
        }
      } catch (err) {
        setError('Failed to load commission data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndCommissions();
  }, []);

  const fetchCommissionData = async (userId: string) => {
    try {
      const params = new URLSearchParams({
        userId,
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate })
      });

      const res = await fetch(`/api/commissions/reports?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setCommissionData(data.data);
      } else {
        setError('Failed to fetch commission data');
      }
    } catch (err) {
      setError('Failed to fetch commission data');
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <Layout>
        <div className="content-wrapper">
          <div className="text-center" style={{ padding: '50px' }}>
            <i className="fas fa-spinner fa-spin fa-2x"></i>
            <p>Loading commission data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="content-wrapper">
          <div className="alert alert-danger m-3">
            {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Commission Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <section className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1>Commission Dashboard</h1>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item"><a href="/">Home</a></li>
                <li className="breadcrumb-item active">Commission Dashboard</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="content">
        <div className="container-fluid">
          {commissionData && (
            <>
              {/* Summary Cards */}
              <div className="row">
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-info">
                    <div className="inner">
                      <h3>{formatAmount(commissionData.totalCommissions)}</h3>
                      <p>Total Commissions</p>
                    </div>
                    <div className="icon">
                      <i className="fas fa-coins"></i>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-success">
                    <div className="inner">
                      <h3>{commissionData.totalBets}</h3>
                      <p>Total Bets</p>
                    </div>
                    <div className="icon">
                      <i className="fas fa-chart-line"></i>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-warning">
                    <div className="inner">
                      <h3>{commissionData.summary.commissionConfig.share}%</h3>
                      <p>Share Commission</p>
                    </div>
                    <div className="icon">
                      <i className="fas fa-percentage"></i>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-danger">
                    <div className="inner">
                      <h3>{commissionData.summary.commissionConfig.matchcommission}%</h3>
                      <p>Match Commission</p>
                    </div>
                    <div className="icon">
                      <i className="fas fa-trophy"></i>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commission Configuration */}
              <div className="row">
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Commission Configuration</h3>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-3">
                          <div className="info-box">
                            <span className="info-box-icon bg-info">
                              <i className="fas fa-share-alt"></i>
                            </span>
                            <div className="info-box-content">
                              <span className="info-box-text">Share</span>
                              <span className="info-box-number">{commissionData.summary.commissionConfig.share}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="info-box">
                            <span className="info-box-icon bg-success">
                              <i className="fas fa-trophy"></i>
                            </span>
                            <div className="info-box-content">
                              <span className="info-box-text">Match Commission</span>
                              <span className="info-box-number">{commissionData.summary.commissionConfig.matchcommission}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="info-box">
                            <span className="info-box-icon bg-warning">
                              <i className="fas fa-clock"></i>
                            </span>
                            <div className="info-box-content">
                              <span className="info-box-text">Session Commission</span>
                              <span className="info-box-number">{commissionData.summary.commissionConfig.sessioncommission}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="info-box">
                            <span className="info-box-icon bg-danger">
                              <i className="fas fa-mobile-alt"></i>
                            </span>
                            <div className="info-box-content">
                              <span className="info-box-text">Mobile Share</span>
                              <span className="info-box-number">{commissionData.summary.commissionConfig.mobileshare}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commission History */}
              <div className="row">
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Commission History</h3>
                    </div>
                    <div className="card-body">
                      <div className="table-responsive">
                        <table className="table table-bordered table-striped">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Bet ID</th>
                              <th>Stake</th>
                              <th>Potential Win</th>
                              <th>Commission %</th>
                              <th>Commission Amount</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {commissionData.distributions.map((distribution) => (
                              <tr key={distribution.id}>
                                <td>{formatDate(distribution.createdAt)}</td>
                                <td>{distribution.bet.id.substring(0, 8)}...</td>
                                <td>{formatAmount(distribution.bet.stake)}</td>
                                <td>{formatAmount(distribution.bet.potentialWin)}</td>
                                <td>{distribution.profitShare}%</td>
                                <td className="text-success font-weight-bold">
                                  {formatAmount(distribution.amountEarned)}
                                </td>
                                <td>
                                  <span className={`badge badge-${distribution.bet.status === 'WON' ? 'success' : 'danger'}`}>
                                    {distribution.bet.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {commissionData.distributions.length === 0 && (
                              <tr>
                                <td colSpan={7} className="text-center text-muted">
                                  No commission data available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
} 