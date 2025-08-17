import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';

function PortalDropdown({ show, anchorEl, children, dropdownRef }: { show: boolean; anchorEl: HTMLElement | null; children: React.ReactNode; dropdownRef: React.RefObject<HTMLDivElement> }) {
  if (!show) return null;

  return ReactDOM.createPortal(
    <div
      ref={dropdownRef}
      className="dropdown-menu show"
      style={{
        position: 'absolute',
        top: anchorEl ? anchorEl.offsetTop + anchorEl.offsetHeight : 0,
        left: anchorEl ? anchorEl.offsetLeft : 0,
        zIndex: 1000,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        minWidth: '150px'
      }}
    >
      {children}
    </div>,
    document.body
  );
}

export default function SubOwnerPage() {
  const [subOwners, setSubOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [activating, setActivating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [dropdownAnchor, setDropdownAnchor] = useState<null | HTMLElement>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Add state for modal
  const [limitModal, setLimitModal] = useState<{ open: boolean, user: any, type: 'deposit' | 'withdrawal' } | null>(null);
  const [limitAmount, setLimitAmount] = useState('');
  const [limitLoading, setLimitLoading] = useState(false);
  const [limitError, setLimitError] = useState('');
  const [parentInfo, setParentInfo] = useState<{ name: string, code: string, limit: number } | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchSubOwners = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/users?role=SUB_OWNER&isActive=true&excludeInactiveParents=true');
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
      const res = await fetch('/api/users?role=SUB_OWNER&isActive=true&excludeInactiveParents=true');
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

  const handleLimitSubmit = async () => {
    if (!limitModal || !limitAmount || isNaN(Number(limitAmount)) || Number(limitAmount) <= 0) {
      setLimitError('Please enter a valid amount');
      return;
    }
    setLimitLoading(true);
    setLimitError('');
    try {
      console.log('📡 Making API call to /api/users/update-limits');
      const requestBody = {
        userId: limitModal.user.id,
        amount: Number(limitAmount),
        type: limitModal.type, // 'deposit' or 'withdrawal'
        remark: `Credit limit ${limitModal.type} by sub owner`,
      };
      console.log('📦 Request body:', requestBody);
      
      const res = await fetch('/api/users/update-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });
      
      console.log('📥 Response received:', res.status, res.statusText);
      const data = await res.json();
      console.log('📄 Response data:', data);
      
      if (data.success) {
        console.log('✅ Limit update successful');
        alert(`Successfully ${limitModal.type}ed ${limitAmount} credits for ${limitModal.user.name}`);
        handleCloseLimitModal();
        refreshData();
      } else {
        console.log('❌ Limit update failed:', data.message);
        setLimitError(data.message || 'Failed to update limit');
      }
    } catch (err) {
      console.log('❌ Network error:', err);
      setLimitError('Network error');
    } finally {
      setLimitLoading(false);
    }
  };

  const handleStatusUpdate = async (isActive: boolean, userIds?: string[]) => {
    const usersToUpdate = userIds || selectedUsers;
    
    if (usersToUpdate.length === 0) {
      alert('Please select at least one user');
      return;
    }

    if (isActive) {
      setActivating(true);
    } else {
      setDeactivating(true);
    }

    try {
      console.log('📡 Making API call to /api/users/update-status');
      const requestBody = {
        userIds: usersToUpdate,
        isActive: isActive,
        role: 'SUB_OWNER'
      };
      console.log('📦 Request body:', requestBody);
      
      const res = await fetch('/api/users/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response received:', res.status, res.statusText);
      const data = await res.json();
      console.log('📄 Response data:', data);
      
      if (data.success) {
        console.log('✅ Status update successful');
        alert(data.message || `Successfully ${isActive ? 'activated' : 'deactivated'} users`);
        setSubOwners(prev => prev.map(user => usersToUpdate.includes(user.id) ? { ...user, isActive: isActive } : user));
        if (!userIds) { setSelectedUsers([]); }
        refreshData();
      } else {
        console.log('❌ Status update failed:', data.message);
        alert('Failed to update status: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.log('❌ Network error:', err);
      alert('Network error while updating status');
    } finally {
      if (isActive) { setActivating(false); } else { setDeactivating(false); }
    }
  };

  const handleCloseLimitModal = () => {
    setLimitModal(null);
    setLimitAmount('');
    setLimitError('');
    setParentInfo(null);
  };

  const handleDropdownAction = (action: string, user: any, e?: React.MouseEvent) => {
    handleDropdownClose();
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    switch (action) {
      case 'edit':
        window.location.href = `/user_details/sub_owner/${user.id}/edit`;
        break;
      case 'active':
        handleStatusUpdate(true, [user.id]);
        break;
      case 'inactive':
        handleStatusUpdate(false, [user.id]);
        break;
      case 'deposit':
        setLimitModal({ open: true, user, type: 'deposit' });
        break;
      case 'withdraw':
        setLimitModal({ open: true, user, type: 'withdrawal' });
        break;
      case 'downline':
        window.location.href = `/user_details/downline?userId=${user.id}`;
        break;
      case 'statement':
        window.location.href = `/ledger?userId=${user.id}`;
        break;
    }
  };

  const handleDropdownClose = () => {
    setOpenDropdownId(null);
    setDropdownAnchor(null);
  };

  if (loading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Sub Owner Management</h4>
                <div className="card-tools">
                  <button
                    className="btn btn-success mr-2"
                    onClick={() => handleStatusUpdate(true)}
                    disabled={activating || deactivating || selectedUsers.length === 0}
                  >
                    {activating ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fa fa-check"></i> Activate</>}
                  </button>
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => handleStatusUpdate(false)}
                    disabled={activating || deactivating || selectedUsers.length === 0}
                  >
                    {deactivating ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fa fa-ban"></i> DeActivate</>}
                  </button>
                </div>
              </div>
              <div className="card-body">
                {/* Search and filters */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by code, name, or contact..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 text-right">
                    <select
                      className="form-control d-inline-block w-auto"
                      value={entriesPerPage}
                      onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                    >
                      <option value={10}>10 entries</option>
                      <option value={25}>25 entries</option>
                      <option value={50}>50 entries</option>
                      <option value={100}>100 entries</option>
                    </select>
                  </div>
                </div>

                {/* Users table */}
                <div className="table-responsive">
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === paginatedSubOwners.length && paginatedSubOwners.length > 0}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                          />
                        </th>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Contact</th>
                        <th>Credit Limit</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSubOwners.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={(e) => handleUserSelect(user.id, e.target.checked)}
                            />
                          </td>
                          <td>{user.code}</td>
                          <td>{user.name}</td>
                          <td>{user.contactno}</td>
                          <td>{user.creditLimit || 0}</td>
                          <td>
                            <span className={`badge badge-${user.isActive ? 'success' : 'danger'}`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary dropdown-toggle"
                                onClick={(e) => {
                                  setOpenDropdownId(openDropdownId === user.id ? null : user.id);
                                  setDropdownAnchor(e.currentTarget);
                                }}
                                ref={(el) => {
                                  if (el) buttonRefs.current[user.id] = el;
                                }}
                              >
                                Actions
                              </button>
                              <PortalDropdown
                                show={openDropdownId === user.id}
                                anchorEl={dropdownAnchor}
                                dropdownRef={dropdownRef}
                              >
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleDropdownAction('edit', user)}
                                >
                                  <i className="fas fa-edit"></i> Edit
                                </button>
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleDropdownAction('active', user)}
                                >
                                  <i className="fas fa-check"></i> Activate
                                </button>
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleDropdownAction('inactive', user)}
                                >
                                  <i className="fa fa-ban"></i> Deactivate
                                </button>
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleDropdownAction('deposit', user)}
                                >
                                  <i className="fas fa-plus"></i> Deposit
                                </button>
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleDropdownAction('withdraw', user)}
                                >
                                  <i className="fas fa-minus"></i> Withdraw
                                </button>
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleDropdownAction('downline', user)}
                                >
                                  <i className="fas fa-users"></i> Downline
                                </button>
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleDropdownAction('statement', user)}
                                >
                                  <i className="fas fa-file-alt"></i> Statement
                                </button>
                              </PortalDropdown>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredSubOwners.length)} of {filteredSubOwners.length} entries
                  </div>
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
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Limit Update Modal */}
      {limitModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{limitModal.type === 'deposit' ? 'Deposit' : 'Withdraw'} Limit for {limitModal.user.code} {limitModal.user.name}</h5>
                <button type="button" className="close" onClick={handleCloseLimitModal}>&times;</button>
              </div>
              <div className="modal-body">
                {parentInfo && (
                  <div className="alert alert-info">
                    Parent: {parentInfo.code} {parentInfo.name} (Limit: {parentInfo.limit})
                  </div>
                )}
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    value={limitAmount}
                    onChange={(e) => setLimitAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
                {limitError && (
                  <div className="alert alert-danger">{limitError}</div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleCloseLimitModal} disabled={limitLoading}>Cancel</button>
                <button className="btn btn-primary" onClick={handleLimitSubmit} disabled={limitLoading}>
                  {limitLoading ? 'Processing...' : (limitModal.type === 'deposit' ? 'Deposit' : 'Withdraw')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal backdrop */}
      {limitModal && <div className="modal-backdrop fade show"></div>}
    </Layout>
  );
}

