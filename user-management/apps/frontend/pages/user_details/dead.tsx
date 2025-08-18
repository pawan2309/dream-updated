import React, { useState, useEffect, useRef } from 'react';
import Layout, { BackArrow } from '../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

// PortalDropdown component for action menu
function PortalDropdown({ show, anchorEl, children, dropdownRef }: { show: boolean; anchorEl: HTMLElement | null; children: React.ReactNode; dropdownRef: React.RefObject<HTMLDivElement> }) {
  if (!show || !anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();
  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: rect.bottom + 5,
        left: rect.left,
        zIndex: 1000,
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        minWidth: '150px'
      }}
    >
      {children}
    </div>
  );
}

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  mobile: string;
  password: string;
  creditLimit: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
  parent?: {
    username: string;
    name: string;
  };
  UserCommissionShare?: {
    share: number;
    matchcommission: number;
    sessioncommission: number;
    casinocommission: number;
  };
}

export default function DeadUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [activating, setActivating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownAnchor, setDropdownAnchor] = useState<HTMLElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchDeadUsers();
  }, []);

  const fetchDeadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users?isActive=false', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch dead users');
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (userIds: string[]) => {
    try {
      setActivating(true);
      const res = await fetch('/api/users/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: userIds,
          isActive: true,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to activate users');
      }

      const result = await res.json();
      fetchDeadUsers(); // Refresh the list
      setSelectedUsers([]); // Clear selection
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to activate users');
    } finally {
      setActivating(false);
    }
  };

  const handleBulkActivate = () => {
    if (selectedUsers.length === 0) {
      alert('Please select users to activate');
      return;
    }
    handleActivate(selectedUsers);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleDropdownOpen = (userId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenDropdownId(userId);
    setDropdownAnchor(e.currentTarget);
  };

  const handleDropdownClose = () => {
    setOpenDropdownId(null);
    setDropdownAnchor(null);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        dropdownAnchor &&
        !(dropdownAnchor as any).contains(event.target)
      ) {
        handleDropdownClose();
      }
    }
    if (openDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId, dropdownAnchor]);

  // Handle dropdown actions
  const handleDropdownAction = (action: string, user: any, e?: React.MouseEvent) => {
    handleDropdownClose();
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    switch (action) {
      case 'activate':
        handleActivate([user.id]);
        break;
      case 'statement':
        // Navigate to statement page
        window.location.href = `/user_details/statement?userId=${user.id}`;
        break;
      case 'downline':
        // Navigate to downline page
        window.location.href = `/user_details/downline?userId=${user.id}`;
        break;
      case 'changePassword':
        // Navigate to change password page
        window.location.href = `/changePassword?userId=${user.id}&returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        break;
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'OWNER': 'Owner',
      'SUB_OWNER': 'Sub Owner',
      'SUPER_ADMIN': 'Super Admin',
      'ADMIN': 'Admin',
      'SUB': 'Sub',
      'MASTER': 'Master',
      'SUPER_AGENT': 'Super Agent',
      'AGENT': 'Agent',
      'USER': 'Client'
    };
    return roleMap[role] || role;
  };

  const getRoleOptions = () => {
    const roles = ['OWNER', 'SUB_OWNER', 'SUPER_ADMIN', 'ADMIN', 'SUB', 'MASTER', 'SUPER_AGENT', 'AGENT', 'USER'];
    return roles.map(role => ({
      value: role,
      label: getRoleDisplayName(role)
    }));
  };

  // Function to determine if user was cascade-deactivated
  const isCascadeDeactivated = (user: User) => {
    return user.parentId && user.parent && user.parent.username;
  };

  // Filter users based on search term and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-xl">Loading dead users...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dead Users</title>
        <style jsx>{`
          .dropdown-item {
            display: block;
            width: 100%;
            padding: 8px 12px;
            clear: both;
            font-weight: 400;
            color: #212529;
            text-align: inherit;
            white-space: nowrap;
            background-color: transparent;
            border: 0;
            cursor: pointer;
          }
          .dropdown-item:hover {
            background-color: #f8f9fa;
          }
          .table td {
            position: relative;
          }
        `}</style>
      </Head>
      <Layout>
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-6">
                <div className="float-sm-left">
                  <BackArrow />
                </div>
              </div>
              <div className="col-6">
                <ol className="breadcrumb justify-content-end float-sm-right mb-0">
                  <li className="breadcrumb-item"><Link href="/">Home</Link></li>
                  <li className="breadcrumb-item active">Dead Users</li>
                </ol>
              </div>
            </div>
            <div className="row mb-2">
              <div className="col-12">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Dead Users <i className="fa fa-skull text-red-600"></i></h2>
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
                          <button
                            onClick={handleBulkActivate}
                            disabled={activating || selectedUsers.length === 0}
                            className="btn btn-success"
                          >
                            <i className="fa fa-play mr-2"></i>
                            Activate Selected ({selectedUsers.length})
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="card-body">
                      {loading && (
                        <div className="text-center">
                          <i className="fas fa-spinner fa-spin fa-2x"></i>
                          <p>Loading dead users...</p>
                        </div>
                      )}
                      {error && <div className="alert alert-danger">{error}</div>}
                      {!loading && (
                        <>
                          <div className="row mb-3 align-items-end">
                            <div className="col-md-auto col-12 mb-2 mb-md-0">
                              <label>
                                Show{' '}
                                <select 
                                  value={entriesPerPage} 
                                  onChange={(e) => {
                                    setEntriesPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                  }}
                                  className="form-control-sm d-inline-block w-auto mx-1"
                                >
                                  <option value={10}>10</option>
                                  <option value={25}>25</option>
                                  <option value={50}>50</option>
                                  <option value={100}>100</option>
                                </select>
                                {' '}entries
                              </label>
                            </div>
                            <div className="col-md-auto col-12 mb-2 mb-md-0">
                              <label>
                                Filter by Role:{' '}
                                <select
                                  value={roleFilter}
                                  onChange={(e) => setRoleFilter(e.target.value)}
                                  className="form-control-sm d-inline-block w-auto ml-1"
                                >
                                  <option value="">All Roles</option>
                                  {getRoleOptions().map(option => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                            <div className="col-md-auto col-12">
                              <label>
                                Search:{' '}
                                <input
                                  type="text"
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  placeholder="Search by code, name, or mobile..."
                                  className="form-control-sm d-inline-block w-auto ml-1"
                                />
                              </label>
                            </div>
                          </div>
                          <table className="table table-bordered table-striped" style={{ width: '100%', tableLayout: 'fixed' }}>
                            <thead>
                              <tr>
                                <th><div style={{ textAlign: 'center' }}><input type="checkbox" checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0} onChange={(e) => handleSelectAll(e.target.checked)} /></div></th>
                                <th>SNO</th>
                                <th>CODE</th>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Parent</th>
                                <th>Deactivated On</th>
                                <th>Limit</th>
                                <th>Match</th>
                                <th>Session</th>
                                <th>Share</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedUsers.length === 0 && (<tr><td colSpan={12} style={{ textAlign: 'center' }}>No dead users found.</td></tr>)}
                              {paginatedUsers.map((user, idx) => (
                                <tr key={user.id} className={selectedUsers.includes(user.id) ? 'table-active' : ''}>
                                  <td><input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={(e) => handleSelectUser(user.id, e.target.checked)} /></td>
                                  <td style={{ verticalAlign: 'middle' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ fontWeight: 'bold' }}>{startIndex + idx + 1}</span>
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
                                          onClick={(e) => handleDropdownOpen(user.id, e)}
                                        >
                                          <i className="fas fa-chevron-down" style={{ color: '#ffffff', fontSize: '15px' }}></i>
                                        </button>
                                                                                 <PortalDropdown show={openDropdownId === user.id} anchorEl={dropdownAnchor} dropdownRef={dropdownRef}>
                                           <button className="dropdown-item" onClick={(e) => handleDropdownAction('activate', user, e)}>Activate</button>
                                           <button className="dropdown-item" onClick={() => handleDropdownAction('statement', user)}>Statement</button>
                                           <button className="dropdown-item" onClick={() => handleDropdownAction('downline', user)}>Downline</button>
                                           <button className="dropdown-item" onClick={() => handleDropdownAction('changePassword', user)}>Change Password</button>
                                         </PortalDropdown>
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ verticalAlign: 'middle' }}>{user.username}</td>
                                  <td style={{ verticalAlign: 'middle' }}>{user.name}</td>
                                  <td style={{ verticalAlign: 'middle' }}>
                                    <span className="badge badge-secondary">{getRoleDisplayName(user.role)}</span>
                                  </td>
                                  <td style={{ verticalAlign: 'middle' }}>
                                    {user.parentId ? (
                                      <div>
                                        <span className="text-muted">
                                          <i className="fa fa-link mr-1"></i>
                                          {user.parent?.username || 'Unknown'}
                                        </span>
                                        <br />
                                        <small className="text-info">
                                          <i className="fa fa-sitemap mr-1"></i>
                                          Cascade Deactivated
                                        </small>
                                      </div>
                                    ) : (
                                      <div>
                                        <span className="text-danger">
                                          <i className="fa fa-crown mr-1"></i>
                                          Top Level
                                        </span>
                                        <br />
                                        <small className="text-warning">
                                          <i className="fa fa-user-times mr-1"></i>
                                          Direct Deactivation
                                        </small>
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ verticalAlign: 'middle' }}>
                                    <span className="text-muted">
                                      {new Date(user.updatedAt).toLocaleDateString()}
                                      <br />
                                      <small>{new Date(user.updatedAt).toLocaleTimeString()}</small>
                                    </span>
                                  </td>
                                                                     <td style={{ verticalAlign: 'middle' }}>{user.creditLimit?.toLocaleString() || '0'}</td>
                                   <td style={{ verticalAlign: 'middle' }}>{user.UserCommissionShare?.matchcommission || '0'}</td>
                                   <td style={{ verticalAlign: 'middle' }}>{user.UserCommissionShare?.sessioncommission || '0'}</td>
                                   <td style={{ verticalAlign: 'middle' }}>{user.UserCommissionShare?.share || '0'}%</td>
                                  <td style={{ verticalAlign: 'middle' }}>
                                    <span className="badge badge-danger">Inactive</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="row">
                            <div className="col-sm-12 col-md-5">
                              <div className="dataTables_info" role="status" aria-live="polite">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} entries
                              </div>
                            </div>
                            <div className="col-sm-12 col-md-7">
                              <div className="dataTables_paginate paging_simple_numbers">
                                <ul className="pagination">
                                  <li className={`paginate_button page-item previous ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button
                                      onClick={() => setCurrentPage(currentPage - 1)}
                                      disabled={currentPage === 1}
                                      className="page-link"
                                    >
                                      Previous
                                    </button>
                                  </li>
                                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <li key={page} className={`paginate_button page-item ${currentPage === page ? 'active' : ''}`}>
                                      <button
                                        onClick={() => setCurrentPage(page)}
                                        className="page-link"
                                      >
                                        {page}
                                      </button>
                                    </li>
                                  ))}
                                  <li className={`paginate_button page-item next ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button
                                      onClick={() => setCurrentPage(currentPage + 1)}
                                      disabled={currentPage === totalPages}
                                      className="page-link"
                                    >
                                      Next
                                    </button>
                                  </li>
                                </ul>
                              </div>
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
    </>
  );
} 