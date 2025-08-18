import React, { useEffect, useState, useRef, useCallback } from 'react';
import Layout, { BackArrow } from '../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createPortal } from 'react-dom';

function PortalDropdown({ show, anchorEl, children, dropdownRef }: { show: boolean; anchorEl: HTMLElement | null; children: React.ReactNode; dropdownRef: React.RefObject<HTMLDivElement> }) {
  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 });
  const [ready, setReady] = React.useState(false);

  const updatePosition = React.useCallback(() => {
    if (show && anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      let left = rect.left + window.pageXOffset;
      let top = rect.bottom + window.pageYOffset + 2;
      const dropdownWidth = Math.max(rect.width, 150);
      if (left + dropdownWidth > viewportWidth + window.pageXOffset) {
        left = viewportWidth + window.pageXOffset - dropdownWidth - 10;
      }
      if (left < window.pageXOffset + 10) {
        left = window.pageXOffset + 10;
      }
      if (top + 200 > viewportHeight + window.pageYOffset) {
        top = rect.top + window.pageYOffset - 202;
      }
      setCoords({ top, left, width: rect.width });
      setReady(true);
    } else {
      setReady(false);
    }
  }, [show, anchorEl]);

  React.useEffect(() => {
    updatePosition();
    if (show) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [show, anchorEl, updatePosition]);

  if (!show || !ready) return null;
  return createPortal(
    <div
      ref={dropdownRef}
      className="custom-dropdown-menu"
      style={{
        position: 'absolute',
        zIndex: 3000,
        top: coords.top,
        left: coords.left,
        minWidth: coords.width,
      }}
    >
      {children}
    </div>,
    document.body
  );
}

export default function DownlinePage() {
  const router = useRouter();
  const { userId } = router.query;
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [activating, setActivating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [limitModal, setLimitModal] = useState<{ open: boolean, user: any, type: 'deposit' | 'withdraw' } | null>(null);
  const [limitAmount, setLimitAmount] = useState('');
  const [limitLoading, setLimitLoading] = useState(false);
  const [limitError, setLimitError] = useState('');
  const [parentInfo, setParentInfo] = useState<{ name: string, code: string, limit: number } | null>(null);
  const [parentUser, setParentUser] = useState<any>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError('');
    fetch(`/api/users?parentId=${userId}&isActive=true`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUsers(data.users || []);
        } else {
          setError('Failed to fetch downline users');
        }
      })
      .catch(() => setError('Failed to fetch downline users'))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setParentUser(data.user);
        else setParentUser(null);
      })
      .catch(() => setParentUser(null));
  }, [userId]);

  // Add refresh function
  const refreshData = async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/users?parentId=${userId}&isActive=true`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      } else {
        setError('Failed to fetch downline users');
      }
    } catch (err) {
      setError('Failed to fetch downline users');
    } finally {
      setLoading(false);
    }
  };

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
  }, [userId]);

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(paginatedUsers.map(user => user.id));
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
  const filteredUsers = users.filter(user =>
    user.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.contactno?.includes(searchTerm)
  );
  const totalPages = Math.ceil(filteredUsers.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);
  useEffect(() => { setCurrentPage(1); }, [entriesPerPage]);

  const toggleDropdown = (userId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (openDropdownId === userId) {
      setOpenDropdownId(null);
      setAnchorEl(null);
    } else {
      setOpenDropdownId(userId);
      setAnchorEl(buttonRefs.current[userId]);
    }
  };
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
      setAnchorEl(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDropdownAction = (action: string, user: any, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setOpenDropdownId(null);
    setAnchorEl(null);
    switch (action) {
      case 'edit':
        router.push(`/user_details/admin/${user.id}/edit`);
        break;
      case 'active': handleStatusUpdate(true, [user.id]); break;
      case 'inactive': handleStatusUpdate(false, [user.id]); break;
      case 'statement': router.push(`/user_details/statement?userId=${user.id}`); break;
      case 'changePassword': router.push(`/changePassword?userId=${user.id}&returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`); break;
      case 'downline': router.push(`/user_details/downline?userId=${user.id}`); break;
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
        body: JSON.stringify({ userIds: usersToUpdate, isActive: isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.map(user => usersToUpdate.includes(user.id) ? { ...user, isActive: isActive } : user));
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

  async function handleOpenLimitModal(user: any, type: 'deposit' | 'withdraw') {
    setLimitModal({ open: true, user, type });
    setLimitAmount('');
    setLimitError('');
    setParentInfo(null);
    if (user.parentId) {
      try {
        const res = await fetch(`/api/users/${user.parentId}`);
        const data = await res.json();
        if (data.success && data.user) {
          setParentInfo({
            name: data.user.name || '',
            code: data.user.code || '',
            limit: data.user.creditLimit || 0,
          });
        } else {
          setParentInfo({ name: 'Not found', code: '', limit: 0 });
        }
      } catch {
        setParentInfo({ name: 'Error loading parent', code: '', limit: 0 });
      }
    } else {
      setParentInfo({ name: 'No parent', code: '', limit: 0 });
    }
  }
  function handleCloseLimitModal() {
    setLimitModal(null);
    setLimitAmount('');
    setLimitError('');
    setParentInfo(null);
  }
  async function handleLimitSubmit() {
    if (!limitModal || !limitAmount || isNaN(Number(limitAmount)) || Number(limitAmount) <= 0) {
      setLimitError('Please enter a valid amount');
      return;
    }
    setLimitLoading(true);
    setLimitError('');
    try {
      const res = await fetch('/api/users/update-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: limitModal.user.id,
          amount: Number(limitAmount),
          type: limitModal.type === 'deposit' ? 'Add' : 'Minus',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        handleCloseLimitModal();
        refreshData();
      } else {
        setLimitError(data.message || 'Failed to update limit');
      }
    } catch (err) {
      setLimitError('Network error');
    } finally {
      setLimitLoading(false);
    }
  }

  return (
    <Layout>
      <Head>
        <title>Downline Details</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <section className="content-header">
        <div className="container-fluid">
          <div className="row mb-2 align-items-center">
            <div className="col-6 d-flex align-items-center">
              <BackArrow />
            </div>
            <div className="col-6">
              <ol className="breadcrumb justify-content-end float-sm-right mb-0">
                <li className="breadcrumb-item"><Link href="/">Home</Link></li>
                <li className="breadcrumb-item active">Downline</li>
              </ol>
            </div>
          </div>
          <div className="row mb-2">
            <div className="col-12">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Downline Details</h2>
              {parentUser && (
                <div style={{ fontSize: '1rem', marginTop: 8 }}>
                  <b>Parent:</b> {parentUser.code} {parentUser.name} ({parentUser.role})
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <form action="#" method="post" id="downlineForm">
              <div className="card-header">
                <div className="form-group">
                  <div className="user-action-grid">
                    <button 
                      className="btn btn-primary" 
                      type="button" 
                      onClick={() => {
                        if (parentUser) {
                          // Navigate to create page with parentId and role as query parameters
                          window.location.href = `/user/create?parentId=${parentUser.id}&role=${parentUser.role}`;
                        } else {
                          alert('Parent information not available');
                        }
                      }}
                      disabled={!parentUser}
                    >
                      New <i className="fa fa-plus-circle"></i>
                    </button>
                    <button
                      className="btn btn-info"
                      type="button"
                      onClick={() => {
                        // Open limit modal for the first selected user (or show alert if none selected)
                        if (selectedUsers.length === 0) {
                          alert('Please select at least one user to update limit.');
                          return;
                        }
                        const user = paginatedUsers.find(u => u.id === selectedUsers[0]);
                        if (user) {
                          handleOpenLimitModal(user, 'deposit');
                        }
                      }}
                      disabled={selectedUsers.length === 0}
                    >
                      Limit Update <i className="fa fa-coins"></i>
                    </button>
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
                    <p>Loading downline users...</p>
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
                          <th><div style={{ textAlign: 'center' }}><input type="checkbox" checked={selectedUsers && selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0} onChange={(e) => setSelectedUsers(e.target.checked ? paginatedUsers.map(user => user.id) : [])} /></div></th>
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
                        {paginatedUsers.length === 0 && (<tr><td colSpan={11} style={{ textAlign: 'center' }}>No downline users found.</td></tr>)}
                        {paginatedUsers.map((user, idx) => (
                          <tr key={user.id} className={selectedUsers.includes(user.id) ? 'table-active' : ''}>
                            <td><input type="checkbox" checked={selectedUsers && selectedUsers.includes(user.id)} onChange={e => setSelectedUsers(e.target.checked ? [...selectedUsers, user.id] : selectedUsers.filter(id => id !== user.id))} /></td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 'bold' }}>{idx + 1}</span>
                                <div className="dropdown">
                                  <button
                                    ref={el => { buttonRefs.current[user.id] = el; }}
                                    className="btn btn-sm"
                                    style={{ 
                                      minWidth: '5px', 
                                      padding: '2px 4px',
                                      backgroundColor: '#007bff',
                                      borderColor: '#007bff',
                                      color: 'white'
                                    }}
                                    onClick={e => toggleDropdown(user.id, e)}
                                  >
                                    <i className="fas fa-chevron-down" style={{ color: '#ffffff', fontSize: '15px' }}></i>
                                  </button>
                                  {openDropdownId === user.id && buttonRefs.current[user.id] && (
                                    <PortalDropdown
                                      show={openDropdownId === user.id}
                                      anchorEl={buttonRefs.current[user.id]}
                                      dropdownRef={dropdownRef}
                                    >
                                      <button className="dropdown-item" onClick={(e) => handleDropdownAction('edit', user, e)}>Edit</button>
                                      <button className="dropdown-item" onClick={(e) => handleDropdownAction(user.isActive ? 'inactive' : 'active', user, e)}>{user.isActive ? 'Deactivate' : 'Activate'}</button>
                                      <button className="dropdown-item" onClick={() => window.location.href = `/user_details/statement?userId=${user.id}`}>Statement</button>
                                      <button className="dropdown-item" onClick={() => handleOpenLimitModal(user, 'deposit')} disabled={!user.parentId}>Deposit</button>
                                      <button className="dropdown-item" onClick={() => handleOpenLimitModal(user, 'withdraw')} disabled={!user.parentId}>Withdraw</button>
                                      <button className="dropdown-item" onClick={() => window.location.href = `/user_details/downline?userId=${user.id}`}>Downline</button>
                                      <button className="dropdown-item" onClick={() => window.location.href = `/changePassword?userId=${user.id}&returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`}>Change Password</button>
                                      <button className="dropdown-item" onClick={() => alert('Send Login Details (SMS)')}>Send Login Details (SMS)</button>
                                      <button className="dropdown-item" onClick={() => alert('Send Login Details (Device)')}>Send Login Details (Device)</button>
                                    </PortalDropdown>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>{user.code || 'N/A'}</td>
                            <td>{user.name || 'N/A'}</td>
                            <td>{user.contactno || 'N/A'}</td>
                                                            <td>{user.password || 'N/A'}</td>
                            <td>{(user.creditLimit || 0).toLocaleString()}</td>
                            <td>{user.UserCommissionShare?.matchcommission ?? '0'}</td>
                            <td>{user.UserCommissionShare?.sessioncommission ?? '0'}</td>
                            <td>{user.UserCommissionShare?.share || 0}%</td>
                            <td><span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* Pagination */}
                    <div className="row mt-3">
                      <div className="col-sm-6">
                        <p>Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} entries</p>
                      </div>
                      <div className="col-sm-6 text-right">
                        <nav>
                          <ul className="pagination pagination-sm justify-content-end mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
                            </li>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                              return (
                                <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                  <button className="page-link" onClick={() => setCurrentPage(pageNum)}>{pageNum}</button>
                                </li>
                              );
                            })}
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
                            </li>
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
      </section>
      {/* Modal for deposit/withdraw */}
      {limitModal && limitModal.open && (
        <div className="modal show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{limitModal.type === 'deposit' ? 'Deposit' : 'Withdraw'} Limit for {limitModal.user.code} {limitModal.user.name}</h5>
                <button type="button" className="close" onClick={handleCloseLimitModal}>&times;</button>
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <b>Parent:</b> {parentInfo ? (parentInfo.name === 'No parent' ? 'No parent' : parentInfo.name === 'Not found' ? 'Parent not found' : parentInfo.name === 'Error loading parent' ? 'Error loading parent' : `${parentInfo.code} ${parentInfo.name}`) : 'Loading...'}<br/>
                  <b>Parent Limit:</b> <input type="text" className="form-control" value={parentInfo ? parentInfo.limit : ''} readOnly />
                </div>
                <div className="mb-2"><b>Client:</b> {limitModal.user.code} {limitModal.user.name}<br/>
                  <b>Client Limit:</b> <input type="text" className="form-control" value={limitModal.user.creditLimit} readOnly />
                </div>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Enter amount"
                  value={limitAmount}
                  onChange={e => setLimitAmount(e.target.value)}
                  min="1"
                  step="0.01"
                  autoFocus
                />
                {limitError && <div className="alert alert-danger mt-2">{limitError}</div>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleCloseLimitModal} disabled={limitLoading}>Cancel</button>
                <button className="btn btn-primary" onClick={handleLimitSubmit} disabled={limitLoading}>{limitLoading ? 'Processing...' : (limitModal.type === 'deposit' ? 'Deposit' : 'Withdraw')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
} 