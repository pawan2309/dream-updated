import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
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
}

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: '',
    contactno: '',
    email: '',
    parentId: ''
  });

  useEffect(() => {
    // Fetch users for parent selection
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
    fetchUsers();
  }, []);

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
    if (!formData.username || !formData.password || !formData.name || !formData.role) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('📡 Making API call to /api/users');
      const requestBody = {
        username: formData.username,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        contactno: formData.contactno,
        email: formData.email,
        parentId: formData.parentId || null
      };
      console.log('📦 Request body:', requestBody);
      
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });
      
      console.log('📥 Response received:', res.status, res.statusText);
      const data = await res.json();
      console.log('📄 Response data:', data);
      
      if (data.success) {
        console.log('✅ User creation successful');
        setSuccess('User created successfully!');
        // Reset form
        setFormData({
          username: '',
          password: '',
          confirmPassword: '',
          name: '',
          role: '',
          contactno: '',
          email: '',
          parentId: ''
        });
        // Redirect to user list after a short delay
        setTimeout(() => {
          router.push('/user_details');
        }, 1500);
      } else {
        console.log('❌ User creation failed:', data.message);
        setError(data.message || 'Failed to create user');
      }
    } catch (err) {
      console.log('❌ Network error:', err);
      setError('Network error while creating user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Create New User</h4>
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
                        <label>Username *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          required
                        />
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
                        <label>Password *</label>
                        <input
                          type="password"
                          className="form-control"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Confirm Password *</label>
                        <input
                          type="password"
                          className="form-control"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                          minLength={6}
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
                          {users.map(user => (
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
                          <i className="fas fa-spinner fa-spin"></i> Creating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-plus"></i> Create User
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

