import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useRoleAccess } from '../../lib/hooks/useRoleAccess';

interface User {
  id: string;
  username: string;
  name: string;
  creditLimit: number;
  exposure: number;
  isActive: boolean;
  role: string;
  hierarchyLevel: number;
  canManage: boolean;
  parent?: {
    id: string;
    username: string;
    name: string;
    code: string;
    role: string;
  };
}

export default function ClientLimitUpdate() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const router = useRouter();
  
  // Use role-based access control
  const { user, canAccess, loading: roleLoading, error: roleError } = useRoleAccess();

  useEffect(() => {
    // Check if user can access client management
    if (!roleLoading && user && !canAccess('client_management')) {
      alert('Access denied: You do not have permission to manage clients.');
      router.push('/');
      return;
    }

    if (!roleLoading && user) {
      fetchUsers();
    }
  }, [roleLoading, user, canAccess, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Use the new filtered API that respects role hierarchy
      const response = await fetch('/api/users/filtered?role=USER');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.users) {
          setUsers(data.users);
        } else {
          setUsers([]);
        }
      } else {
        const errorData = await response.json();
        if (response.status === 403) {
          alert(`Access denied: ${errorData.message}`);
          router.push('/');
        } else {
          setUsers([]);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLimitUpdate = async (userId: string, amount: number, type: 'Add' | 'Minus') => {
    setUpdating(userId);
    try {
      const response = await fetch('/api/users/update-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          amount,
          type,
          role: 'USER'
        }),
      });

      if (response.ok) {
        alert(`${type === 'Add' ? 'Added' : 'Subtracted'} successfully!`);
        fetchUsers(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating limit:', error);
      alert('Error updating limit');
    } finally {
      setUpdating(null);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // Show loading state while checking role access
  if (roleLoading) {
    return (
      <Layout>
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body text-center">
                  <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                  <p className="mt-2">Checking permissions...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error state if role access failed
  if (roleError) {
    return (
      <Layout>
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body text-center">
                  <div className="alert alert-danger">
                    <h5>Access Error</h5>
                    <p>{roleError}</p>
                    <button className="btn btn-primary" onClick={() => window.location.reload()}>
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show access denied if user cannot manage clients
  if (!user || !canAccess('client_management')) {
    return (
      <Layout>
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body text-center">
                  <div className="alert alert-warning">
                    <h5>Access Denied</h5>
                    <p>You do not have permission to manage clients.</p>
                    <button className="btn btn-primary" onClick={() => router.push('/')}>
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body text-center">
                  <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                </div>
              </div>
            </div>
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
            <div className="card card-indigo">
              <div className="card-header">
                <h4>Client Coin Details</h4>
                <div>
                  <span className="badge badge-info mr-2">
                    Role: {user?.role}
                  </span>
                  <a href="/user_details/client" className="btn btn-secondary">
                    <i className="fa fa-arrow-left"></i> Back to Clients
                  </a>
                </div>
              </div>
              <div className="card-body">
                {/* Search Bar */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by username or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <div className="input-group-append">
                        <span className="input-group-text">
                          <i className="fas fa-search"></i>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 text-right">
                    <span className="text-muted">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} entries
                    </span>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>SNo</th>
                        <th>Client Name</th>
                        <th>Parent</th>
                        <th>Limit</th>
                        <th>Enter Limit</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentUsers.map((user, index) => (
                        <tr key={user.id}>
                          <td>{startIndex + index + 1}</td>
                          <td>
                            {user.username} {user.name}
                            <br />
                            <small className="text-muted">ID: {user.id}</small>
                          </td>
                          <td>
                            {user.parent ? (
                              <span>
                                {user.parent.code} {user.parent.name}
                                <br />
                                <small className="text-muted">({user.parent.role})</small>
                              </span>
                            ) : (
                              <span className="text-muted">No parent</span>
                            )}
                          </td>
                          <td>{user.creditLimit?.toFixed(2) || '0.00'}</td>
                          <td className="col-lg-4" style={{ minWidth: '120px' }}>
                            <input
                              type="number"
                              className="form-control"
                              step="0.01"
                              min="0"
                              id={`limit-${user.id}`}
                            />
                          </td>
                          <td style={{ minWidth: '150px' }}>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => {
                                const input = document.getElementById(`limit-${user.id}`) as HTMLInputElement;
                                const amount = parseFloat(input.value);
                                if (amount > 0) {
                                  handleLimitUpdate(user.id, amount, 'Add');
                                } else {
                                  alert('Please enter a valid amount');
                                }
                              }}
                              disabled={updating === user.id || !user.canManage}
                            >
                              {updating === user.id ? 'Updating...' : 'Add'}
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => {
                                const input = document.getElementById(`limit-${user.id}`) as HTMLInputElement;
                                const amount = parseFloat(input.value);
                                if (amount > 0) {
                                  handleLimitUpdate(user.id, amount, 'Minus');
                                } else {
                                  alert('Please enter a valid amount');
                                }
                              }}
                              disabled={updating === user.id || !user.canManage}
                            >
                              {updating === user.id ? 'Updating...' : 'Minus'}
                            </button>
                            {!user.canManage && (
                              <small className="text-muted d-block mt-1">
                                No permission to manage this user
                              </small>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="row">
                    <div className="col-md-6">
                      <div className="dataTables_info">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} entries
                      </div>
                    </div>
                    <div className="col-md-6">
                      <nav aria-label="Page navigation">
                        <ul className="pagination justify-content-end">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => goToPage(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </button>
                          </li>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                              <button
                                className="page-link"
                                onClick={() => goToPage(page)}
                              >
                                {page}
                              </button>
                            </li>
                          ))}
                          
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => goToPage(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 