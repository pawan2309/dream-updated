import React, { useState, useEffect } from 'react';
import Layout, { BackArrow } from '../../components/Layout';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface LedgerEntry {
  id: string;
  collection: string;
  debit: number;
  credit: number;
  balanceAfter: number;
  type: string;
  remark?: string;
  createdAt: string;
}

export default function MyLedgerPage() {
  const [siteName, setSiteName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const site = hostname.split('.')[1]?.toUpperCase() || 'SITE';
      setSiteName(hostname);
      setBrandName(site);
      document.title = site;
    }
  }, []);

  // Get current user and their ledger
  useEffect(() => {
    const fetchUserAndLedger = async () => {
      setLoading(true);
      setError('');
      try {
        // Get current user
        const userRes = await fetch('/api/auth/session');
        const userData = await userRes.json();
        
        if (!userData.valid || !userData.user) {
          router.replace('/login');
          return;
        }
        
        setUser(userData.user);
        
        // Get user's ledger
        const ledgerRes = await fetch(`/api/users/${userData.user.id}/ledger`);
        const ledgerData = await ledgerRes.json();
        
        if (ledgerData.success) {
          setLedger(ledgerData.ledger || []);
        } else {
          setError('Failed to fetch ledger');
        }
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndLedger();
  }, []);

  // Filter and paginate data
  const filteredLedger = ledger.filter(entry => 
    entry.remark?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.collection.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLedger.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedLedger = filteredLedger.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Reset to first page when entries per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [entriesPerPage]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>My Ledger</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-12">
              <div className="d-flex align-items-center">
                <BackArrow />
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb" style={{ backgroundColor: 'transparent', padding: 0, margin: 0 }}>
                    <li className="breadcrumb-item">
                      <Link href="/" className="text-dark">
                        Dashboard
                      </Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link href="/ledger" className="text-dark">
                        Ledger
                      </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      My Ledger
                    </li>
                  </ol>
                </nav>
              </div>
              <h1 className="m-0 text-dark mt-2">My Ledger</h1>
            </div>
          </div>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    Ledger for {user?.name || user?.username} ({user?.code})
                  </h3>
                  <div className="card-tools">
                    <div className="input-group input-group-sm" style={{ width: 250 }}>
                      <input
                        type="text"
                        name="table_search"
                        className="form-control float-right"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <div className="input-group-append">
                        <button type="submit" className="btn btn-default">
                          <i className="fas fa-search"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card-body">
                  {error && (
                    <div className="alert alert-danger">
                      <h6>{error}</h6>
                    </div>
                  )}
                  
                  {ledger.length === 0 ? (
                    <div className="alert alert-info">
                      <h6>No ledger entries found</h6>
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive">
                        <table className="table table-bordered table-striped">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Date & Time</th>
                              <th>Type</th>
                              <th>Collection</th>
                              <th>Debit</th>
                              <th>Credit</th>
                              <th>Balance After</th>
                              <th>Remark</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedLedger.map((entry, index) => (
                              <tr key={entry.id}>
                                <td>{startIndex + index + 1}</td>
                                <td>{formatDate(entry.createdAt)}</td>
                                <td>
                                  <span className={`badge badge-${entry.type === 'ADJUSTMENT' ? 'warning' : 'info'}`}>
                                    {entry.type}
                                  </span>
                                </td>
                                <td>{entry.collection}</td>
                                <td className="text-danger">
                                  {entry.debit > 0 ? formatAmount(entry.debit) : '-'}
                                </td>
                                <td className="text-success">
                                  {entry.credit > 0 ? formatAmount(entry.credit) : '-'}
                                </td>
                                <td className="font-weight-bold">
                                  {formatAmount(entry.balanceAfter)}
                                </td>
                                <td>{entry.remark || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination */}
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div>
                          <label>
                            Show{' '}
                            <select
                              value={entriesPerPage}
                              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                              className="form-control form-control-sm d-inline-block"
                              style={{ width: 'auto' }}
                            >
                              <option value={10}>10</option>
                              <option value={25}>25</option>
                              <option value={50}>50</option>
                              <option value={100}>100</option>
                            </select>
                            {' '}entries
                          </label>
                        </div>
                        
                        <div>
                          <p>
                            Showing {startIndex + 1} to {Math.min(endIndex, filteredLedger.length)} of {filteredLedger.length} entries
                          </p>
                        </div>
                        
                        <div>
                          <nav>
                            <ul className="pagination pagination-sm">
                              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button
                                  className="page-link"
                                  onClick={() => setCurrentPage(currentPage - 1)}
                                  disabled={currentPage === 1}
                                >
                                  Previous
                                </button>
                              </li>
                              
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                return (
                                  <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                                    <button
                                      className="page-link"
                                      onClick={() => setCurrentPage(page)}
                                    >
                                      {page}
                                    </button>
                                  </li>
                                );
                              })}
                              
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
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
} 