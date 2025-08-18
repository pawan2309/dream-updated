import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import NewUserButton from '../../components/NewUserButton';

export default function SubOwnerMasterPage() {
  const [subOwners, setSubOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [activating, setActivating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubOwners = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/users?role=SUB_OWNER');
        const data = await res.json();
        if (data.success) {
          setSubOwners(data.users || []);
        } else {
          setError('Failed to fetch sub owners');
        }
      } catch (err) {
        setError('Failed to fetch sub owners');
      } finally {
        setLoading(false);
      }
    };
    fetchSubOwners();
  }, []);

  // Add refresh function
  const refreshData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users?role=SUB_OWNER');
      const data = await res.json();
      if (data.success) {
        setSubOwners(data.users || []);
      } else {
        setError('Failed to fetch sub owners');
      }
    } catch (err) {
      setError('Failed to fetch sub owners');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh when page becomes visible and periodic refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshData();
      }
    };
    const intervalId = setInterval(() => {
      refreshData();
    }, 30000);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(paginatedSubOwners.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  // Handle individual user selection
  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  // Filter and paginate data
  const filteredSubOwners = subOwners.filter(user => 
    user.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.contactno?.includes(searchTerm)
  );
  const totalPages = Math.ceil(filteredSubOwners.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedSubOwners = filteredSubOwners.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);
  useEffect(() => { setCurrentPage(1); }, [entriesPerPage]);

  const toggleDropdown = (userId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenDropdown(openDropdown === userId ? null : userId);
  };
  useEffect(() => {
    const handleClickOutside = () => { setOpenDropdown(null); };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDropdownAction = (action: string, user: any, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setOpenDropdown(null);
    switch (action) {
      case 'edit': alert(`Edit user: ${user.name}`); break;
      case 'active': handleStatusUpdate(true, [user.id]); break;
      case 'inactive': handleStatusUpdate(false, [user.id]); break;
      default: break;
    }
  };

  const handleStatusUpdate = async (isActive: boolean, userIds?: string[]) => {
    const usersToUpdate = userIds || selectedUsers;
    if (usersToUpdate.length === 0) {
      alert('Please select at least one user');
      return;
    }
    if (isActive) { setActivating(true); } else { setDeactivating(true); }
    try {
      const res = await fetch('/api/users/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: usersToUpdate, isActive: isActive, role: 'SUB_OWNER' }),
      });
      const data = await res.json();
      if (data.success) {
        setSubOwners(prev => prev.map(user => usersToUpdate.includes(user.id) ? { ...user, isActive: isActive } : user));
        if (!userIds) { setSelectedUsers([]); }
        
        // Auto-refresh the page after successful status update
        setTimeout(() => {
          window.location.reload();
        }, 1000); // 1 second delay to show success state
      } else {
        console.error('Failed to update status:', data.message);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      if (isActive) { setActivating(false); } else { setDeactivating(false); }
    }
  };

  return (
    <Layout>
      <Head>
        <title>Sub Owner Master Details</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <section className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Sub Owner Master Details</h2>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item"><Link href="/">Home</Link></li>
                <li className="breadcrumb-item active">Sub Owner</li>
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
                <form action="#" method="post" id="demoForm">
                  <div className="card-header">
                    <div className="form-group">
                      <div className="user-action-grid">
                        <NewUserButton role="SUB_OWNER" className="btn btn-primary">
                          New <i className="fa fa-plus-circle"></i>
                        </NewUserButton>
                        <button className="btn btn-danger" type="button" onClick={() => handleStatusUpdate(false)} disabled={activating || deactivating || selectedUsers.length === 0}>
                          {deactivating ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fa fa-ban"></i> DeActivate</>}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    {loading && (
                      <div className="text-center">
                        <i className="fas fa-spinner fa-spin fa-2x"></i>
                        <p>Loading sub owner users...</p>
                      </div>
                    )}
                    {error && <div className="alert alert-danger">{error}</div>}
                    {!loading && (
                      <>
                        <div className="row mb-3">
                          <div className="col-sm-6">
                            <label>
                              Show{' '}
                              <select value={entriesPerPage} onChange={(e) => setEntriesPerPage(Number(e.target.value))} className="form-control-sm d-inline-block w-auto mx-1">
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
                              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by code, name, or mobile..." className="form-control-sm d-inline-block w-auto ml-1" />
                            </label>
                          </div>
                        </div>
                        <table className="table table-bordered table-striped">
                          <thead>
                            <tr>
                              <th><div style={{ textAlign: 'center' }}><input type="checkbox" checked={selectedUsers.length === paginatedSubOwners.length && paginatedSubOwners.length > 0} onChange={(e) => handleSelectAll(e.target.checked)} /></div></th>
                              <th>SNO</th>
                              <th>CODE</th>
                              <th>Name</th>
                              <th>Mobile</th>
                              <th>Password</th>
                              <th>Limit</th>
                              <th>Match</th>
                              <th>Session</th>
                              <th>Share</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedSubOwners.length === 0 && (<tr><td colSpan={11} style={{ textAlign: 'center' }}>No sub owner users found.</td></tr>)}
                            {paginatedSubOwners.map((user, idx) => (
                              <tr key={user.id} className={selectedUsers.includes(user.id) ? 'table-active' : ''}>
                                <td><input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={(e) => handleUserSelect(user.id, e.target.checked)} /></td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: 'bold' }}>{idx + 1}</span>
                                    <div className="dropdown">
                                      <button
                                        className="btn btn-sm"
                                        style={{ 
                                          minWidth: '5px', 
                                          padding: '2px 4px',
                                          backgroundColor: '#007bff',
                                          borderColor: '#007bff',
                                          color: 'white'
                                        }}
                                        onClick={(e) => toggleDropdown(user.id, e)}
                                      >
                                        <i className="fas fa-chevron-down" style={{ color: '#ffffff', fontSize: '15px' }}></i>
                                      </button>
                                    {openDropdown === user.id && (
                                      <div className="dropdown-menu show" style={{ position: 'absolute', zIndex: 1000 }}>
                                        <button className="dropdown-item" onClick={(e) => handleDropdownAction('edit', user, e)}>Edit</button>
                                        <button className="dropdown-item" onClick={(e) => handleDropdownAction(user.isActive ? 'inactive' : 'active', user, e)}>{user.isActive ? 'Deactivate' : 'Activate'}</button>
                                      </div>
                                                                          )}
                                  </div>
                                </div>
                                </td>
                                <td>{user.code || 'N/A'}</td>
                                <td>{user.name || 'N/A'}</td>
                                <td>{user.contactno || 'N/A'}</td>
                                <td>{user.password || 'N/A'}</td>
                                <td>{(user.creditLimit || 0).toLocaleString()}</td>
                                <td>{user.UserCommissionShare?.matchcommission || 0}</td>
                                <td>{user.UserCommissionShare?.sessioncommission || 0}</td>
                                <td>{user.UserCommissionShare?.share || 0}%</td>
                                <td><span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="row mt-3">
                          <div className="col-sm-6">
                            <p>Showing {startIndex + 1} to {Math.min(endIndex, filteredSubOwners.length)} of {filteredSubOwners.length} entries</p>
                          </div>
                          <div className="col-sm-6 text-right">
                            <nav>
                              <ul className="pagination pagination-sm justify-content-end mb-0">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>Previous</button></li>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => { const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i; return (<li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}><button className="page-link" onClick={() => setCurrentPage(pageNum)}>{pageNum}</button></li>); })}
                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}><button className="page-link" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button></li>
                              </ul>
                            </nav>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
} 