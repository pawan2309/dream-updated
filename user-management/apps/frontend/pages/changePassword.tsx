import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { userId } = router.query;
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toast, setToast] = useState<{ message: string, show: boolean } | null>(null);
  const [changedUsername, setChangedUsername] = useState('');
  const toastTimeout = useRef<any>(null);
  // Add state for password visibility
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setToast(null);
    setChangedUsername('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirm password do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      let res;
      if (userId) {
        // Change password for another user
        res = await fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password: formData.newPassword })
        });
      } else {
        // Change password for current user
        res = await fetch('/api/users/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Ensure cookies are sent
          body: JSON.stringify({
            newPassword: formData.newPassword
          })
        });
      }
      const data = await res.json();
      if (data.success) {
        setSuccess(''); // Do not show success in form
        setFormData({
          newPassword: '',
          confirmPassword: ''
        });
        // Show toast with username if available
        let username = data.username;
        if (!username && userId) {
          try {
            const userRes = await fetch(`/api/users/${userId}`);
            const userData = await userRes.json();
            if (userData.success && userData.user && userData.user.username) {
              username = userData.user.username;
            }
          } catch {}
        }
        setChangedUsername(username || '');
        setToast({ message: `Password changed successfully for user ${username || ''}`, show: true });
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        // Redirect instantly
        setTimeout(() => {
          setToast(null);
          const returnUrl = router.query.returnUrl as string;
          if (returnUrl) {
            router.push(returnUrl);
          } else {
            // If no returnUrl, check if this is a self-password change or other user change
            if (userId) {
              // Changing another user's password but no returnUrl - go to user_details
              router.push('/user_details');
            } else {
              // Changing own password - go to profile
              router.push('/profile');
            }
          }
        }, 1500);
        return;
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (error) {
      setError('Error changing password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const returnUrl = router.query.returnUrl as string;
    if (returnUrl) {
      router.push(returnUrl);
    } else {
      // If no returnUrl, check if this is a self-password change or other user change
      if (userId) {
        // Changing another user's password but no returnUrl - go to user_details
        router.push('/user_details');
      } else {
        // Changing own password - go to profile
        router.push('/profile');
      }
    }
  };

  useEffect(() => {
    return () => {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
    };
  }, []);

  return (
    <Layout>
      <Head>
        <title>Change Password</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/fontawesome-free/css/all.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/dist/css/adminlte.min.css" />
      </Head>

      <section className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1>Change Password</h1>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item"><a href="/">Home</a></li>
                <li className="breadcrumb-item"><a href="/profile">Profile</a></li>
                <li className="breadcrumb-item active">Change Password</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="content">
        {/* Toast notification */}
        {toast && toast.show && (
          <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, minWidth: 300 }}>
            <div className="alert alert-success" style={{ marginBottom: 0 }}>
              {toast.message}
            </div>
          </div>
        )}
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card card-primary">
                <div className="card-header">
                  <h3 className="card-title">Change Password</h3>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="card-body">
                    {error && (
                      <div className="alert alert-danger">
                        {error}
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor="newPassword">New Password</label>
                      <div className="input-group">
                        <input
                          type={showNew ? 'text' : 'password'}
                          className="form-control"
                          id="newPassword"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          required
                          minLength={6}
                        />
                        <div className="input-group-append">
                          <button type="button" className="btn btn-outline-secondary" tabIndex={-1} onClick={() => setShowNew(v => !v)}>
                            <i className={`fa ${showNew ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm New Password</label>
                      <div className="input-group">
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          className="form-control"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                        />
                        <div className="input-group-append">
                          <button type="button" className="btn btn-outline-secondary" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}>
                            <i className={`fa ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card-footer">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Changing Password...' : 'Change Password'}
                    </button>
                    <button type="button" className="btn btn-secondary ml-2" onClick={handleCancel} disabled={loading}>Cancel</button>
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