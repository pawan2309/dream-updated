import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../../../components/Layout';
import Link from 'next/link';

interface SuperAdmin {
  id: string;
  code?: string;
  name?: string;
  creditLimit: number;
}

const SuperAdminLimitUpdatePage = () => {
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [myLimit, setMyLimit] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSuperAdmins();
  }, []);

  const fetchSuperAdmins = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users?role=SUPER_ADMIN&excludeInactiveParents=true');
      const data = await res.json();
      if (res.ok && data.users) {
        setSuperAdmins(data.users);
        setMyLimit(data.myLimit || 0);
      } else {
        setError(data.error || 'Failed to fetch super admins');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (id: string, value: string) => {
    setInputValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleLimitUpdate = async (id: string, type: 'Add' | 'Minus') => {
    const value = inputValues[id];
    if (!value || isNaN(Number(value))) {
      return; // Silent fail - no alert
    }
    const amount = Number(value);
    if (amount <= 0) {
      return; // Silent fail - no alert
    }
    try {
      const res = await fetch('/api/users/update-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: id, 
          amount, 
          type: type === 'Add' ? 'add' : 'deduct', // API expects 'add' or 'deduct'
          role: 'SUPER_ADMIN' // Add the missing role field
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Silent success - no alert
        fetchSuperAdmins();
        setInputValues((prev) => ({ ...prev, [id]: '' }));
      } else {
        // Silent fail - no alert
        console.error('Failed to update limit:', data.message || data.error);
      }
    } catch (err) {
      console.error('Error updating limit:', err);
      // Silent fail - no alert
    }
  };

  // Filtered and paginated data
  const filteredAdmins = superAdmins.filter(admin =>
    (admin.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     admin.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const totalPages = Math.ceil(filteredAdmins.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedAdmins = filteredAdmins.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, entriesPerPage]);

  return (
    <Layout>
      <Head>
        <title>Update Super Admin Limit</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <section className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Super Admin</h2>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item"><Link href="/user_details/super_admin">Super Admin</Link></li>
                <li className="breadcrumb-item active">Update Super Admin Limit</li>
              </ol>
            </div>
          </div>
        </div>
      </section>
      <section className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card card-indigo">
                <div className="card-header">
                  <h4>Super Admin Coin Details</h4>
                </div>
                <div className="card-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="row mb-3">
                    <div className="col-sm-6">
                      <label>
                        Show{' '}
                        <select value={entriesPerPage} onChange={e => setEntriesPerPage(Number(e.target.value))} className="form-control-sm d-inline-block w-auto mx-1">
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                        {' '}entries
                      </label>
                    </div>
                    <div className="col-sm-6 text-right">
                      <label>
                        Search:{' '}
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by code or name..." className="form-control-sm d-inline-block w-auto ml-1" />
                      </label>
                    </div>
                  </div>
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>SNo</th>
                        <th>Super Admin Name</th>
                        <th>Limit</th>
                        <th>Enter Limit</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={5}>Loading...</td></tr>
                      ) : paginatedAdmins.length === 0 ? (
                        <tr><td colSpan={5}>No super admins found.</td></tr>
                      ) : (
                        paginatedAdmins.map((admin, idx) => (
                          <tr key={admin.id}>
                            <td>{startIndex + idx + 1}</td>
                            <td>{admin.code} {admin.name}</td>
                            <td>{admin.creditLimit || 0}</td>
                            <td style={{ minWidth: 120 }}>
                              <input
                                required
                                type="number"
                                className="form-control"
                                step="0.01"
                                name="limit"
                                value={inputValues[admin.id] || ''}
                                onChange={e => handleInputChange(admin.id, e.target.value)}
                              />
                            </td>
                            <td style={{ minWidth: 150 }}>
                              <button className="btn-sm btn-primary" type="button" style={{ marginRight: '2px' }} onClick={() => handleLimitUpdate(admin.id, 'Add')}>Add</button>
                              <button className="btn-sm btn-danger" type="button" onClick={() => handleLimitUpdate(admin.id, 'Minus')}>Minus</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <div className="row mt-3">
                    <div className="col-sm-6">
                      <p>Showing {filteredAdmins.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredAdmins.length)} of {filteredAdmins.length} entries</p>
                    </div>
                    <div className="col-sm-6 text-right">
                      <nav>
                        <ul className="pagination pagination-sm justify-content-end mb-0">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>Previous</button></li>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                            return (
                              <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}><button className="page-link" onClick={() => setCurrentPage(pageNum)}>{pageNum}</button></li>
                            );
                          })}
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}><button className="page-link" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button></li>
                        </ul>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SuperAdminLimitUpdatePage; 