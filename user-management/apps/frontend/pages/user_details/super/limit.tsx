import React, { useEffect, useState } from 'react';
import Layout from '../../../components/Layout';
import Link from 'next/link';

interface SuperAgent {
  id: string;
  code?: string;
  name?: string;
  creditLimit: number;
}

const SuperLimitUpdatePage = () => {
  const [superAgents, setSuperAgents] = useState<SuperAgent[]>([]);
  const [myLimit, setMyLimit] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSuperAgents();
  }, []);

  const fetchSuperAgents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users?role=SUPER_AGENT&excludeInactiveParents=true');
      const data = await res.json();
      if (res.ok && data.users) {
        setSuperAgents(data.users);
        setMyLimit(data.myLimit || 0);
      } else {
        setError(data.error || 'Failed to fetch super agents');
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
          role: 'SUPER_AGENT' 
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Silent success - no alert
        fetchSuperAgents();
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
  const filteredSuperAgents = superAgents.filter(superAgent =>
    (superAgent.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     superAgent.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const totalPages = Math.ceil(filteredSuperAgents.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedSuperAgents = filteredSuperAgents.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, entriesPerPage]);

  return (
    <Layout>
      <div className="container-fluid">
        <div className="row mb-2">
          <div className="col-sm-6">
                          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Super Agent</h2>
          </div>
          <div className="col-sm-6">
            <ol className="breadcrumb float-sm-right">
              <li className="breadcrumb-item"><Link href="/user_details/super">Super Agent</Link></li>
              <li className="breadcrumb-item active">Update Super Agent Limit</li>
            </ol>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <div className="card card-indigo">
              <div className="card-header">
                <h4>Super Agent Coin Details</h4>
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
                        <th>Super Agent Name</th>
                        <th>Limit</th>
                        <th>Enter Limit</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                      <tr><td colSpan={5}>Loading...</td></tr>
                    ) : paginatedSuperAgents.length === 0 ? (
                      <tr><td colSpan={5}>No super agents found.</td></tr>
                    ) : (
                      paginatedSuperAgents.map((superAgent, idx) => (
                        <tr key={superAgent.id}>
                          <td>{startIndex + idx + 1}</td>
                          <td>{superAgent.code} {superAgent.name}</td>
                          <td>{superAgent.creditLimit || 0}</td>
                          <td style={{ minWidth: 120 }}>
                            <input
                              required
                              type="number"
                              className="form-control"
                              step="0.01"
                              name="limit"
                              value={inputValues[superAgent.id] || ''}
                              onChange={e => handleInputChange(superAgent.id, e.target.value)}
                            />
                          </td>
                          <td style={{ minWidth: 150 }}>
                            <button className="btn-sm btn-primary" type="button" style={{ marginRight: '2px' }} onClick={() => handleLimitUpdate(superAgent.id, 'Add')}>Add</button>
                            <button className="btn-sm btn-danger" type="button" onClick={() => handleLimitUpdate(superAgent.id, 'Minus')}>Minus</button>
                          </td>
                        </tr>
                      ))
                    )}
                    </tbody>
                  </table>
                <div className="row mt-3">
                  <div className="col-sm-6">
                    <p>Showing {filteredSuperAgents.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredSuperAgents.length)} of {filteredSuperAgents.length} entries</p>
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
    </Layout>
  );
};

export default SuperLimitUpdatePage; 