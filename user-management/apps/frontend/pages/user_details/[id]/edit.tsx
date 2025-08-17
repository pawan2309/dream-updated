import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';

interface FormData {
  name: string;
  role: string;
  contactno: string;
  email: string;
  parentId: string;
}

interface User {
  id: string;
  username: string;
  name: string;
  code: string;
  role: string;
  contactno?: string;
  email?: string;
  parentId?: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const { id: userId } = router.query;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    role: '',
    contactno: '',
    email: '',
    parentId: ''
  });

  useEffect(() => {
    if (!userId) return;
    
    const fetchUser = async () => {
      try {
        setFetching(true);
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          setFormData({
            name: data.user.name || '',
            role: data.user.role || '',
            contactno: data.user.contactno || '',
            email: data.user.email || '',
            parentId: data.user.parentId || ''
          });
        } else {
          setError('Failed to fetch user details');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to fetch user details');
      } finally {
        setFetching(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users?isActive=true');
        const data = await res.json();
        if (data.success) {
          setUsers(data.users || []);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    fetchUser();
    fetchUsers();
  }, [userId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return;
    
    // Validation
    if (!formData.name || !formData.role) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('📡 Making API call to /api/users/[id]');
      const requestBody = {
        name: formData.name,
        role: formData.role,
        contactno: formData.contactno,
        email: formData.email,
        parentId: formData.parentId || null
      };
      console.log('📦 Request body:', requestBody);
      
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });
      
      console.log('📥 Response received:', res.status, res.statusText);
      const data = await res.json();
      console.log('📄 Response data:', data);
      
      if (data.success) {
        console.log('✅ User update successful');
        setSuccess('User updated successfully!');
        // Redirect to user list after a short delay
        setTimeout(() => {
          router.push('/user_details');
        }, 1500);
      } else {
        console.log('❌ User update failed:', data.message);
        setError(data.message || 'Failed to update user');
      }
    } catch (err) {
      console.log('❌ Network error:', err);
      setError('Network error while updating user');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
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

  if (!user) {
    return (
      <Layout>
        <div className="alert alert-danger">User not found</div>
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
                <h4 className="card-title">Edit User: {user.code} - {user.name}</h4>
                <div className="card-tools">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => router.push('/user_details')}
                  >
                    <i className="fas fa-arrow-left"></i> Back to Users
                  </button>
                </div>
              </div>
              <div className="card-body">
                {error && (
                  <div className="alert alert-danger">{error}</div>
                )}
                {success && (
                  <div className="alert alert-success">{success}</div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Username</label>
                        <input
                          type="text"
                          className="form-control"
                          value={user.username}
                          disabled
                        />
                        <small className="form-text text-muted">Username cannot be changed</small>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Role *</label>
                        <select
                          className="form-control"
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Role</option>
                          <option value="USER">User</option>
                          <option value="SUB">Sub</option>
                          <option value="AGENT">Agent</option>
                          <option value="MASTER">Master</option>
                          <option value="SUPER">Super</option>
                          <option value="ADMIN">Admin</option>
                          <option value="SUPER_ADMIN">Super Admin</option>
                          <option value="SUB_OWNER">Sub Owner</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Parent User</label>
                        <select
                          className="form-control"
                          name="parentId"
                          value={formData.parentId}
                          onChange={handleInputChange}
                        >
                          <option value="">No Parent</option>
                          {users.filter(u => u.id !== userId).map(user => (
                            <option key={user.id} value={user.id}>
                              {user.code} - {user.name} ({user.role})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Contact Number</label>
                        <input
                          type="text"
                          className="form-control"
                          name="contactno"
                          value={formData.contactno}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-group text-right">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Updating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save"></i> Update User
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

