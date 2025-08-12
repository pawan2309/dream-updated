import React, { useState, useEffect } from 'react';
import Layout from '../../../components/Layout';
import { useRouter } from 'next/router';

const ClientCreatePage = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    code: 'Auto Generated',
    name: '',
    reference: '',
    password: '',
    contactno: '',
    balance: '',
    share: '',
    commissionType: '',
    casinoShare: '',
    casinoCommission: '',
    casinoStatus: false,
    matchCommission: '',
    sessionCommission: '',
    // Parent commission fields (editable)
    myShare: '',
    myCasinoShare: '',
    myCasinoCommission: '',
    myMatchCommission: '',
    mySessionCommission: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [parentData, setParentData] = useState<any>(null);
  const [loadingParent, setLoadingParent] = useState(true);

  // Fetch parent's (logged-in user's) commission and share data
  useEffect(() => {
    const fetchParentData = async () => {
      try {
        setLoadingParent(true);
        
        // Check if parentId is provided in query parameters (from hierarchy modal)
        const parentId = router.query.parentId as string || null;
        
        let targetParentId: string;
        
        if (parentId) {
          // Use the parentId from query parameters (selected from hierarchy modal)
          targetParentId = parentId;
        } else {
          // Get current user's session to get their ID (default behavior)
          const sessionRes = await fetch('/api/auth/session');
          const sessionData = await sessionRes.json();
          
          if (!sessionData.valid) {
            setError('Session expired. Please login again.');
            router.push('/login');
            return;
          }
          
          targetParentId = sessionData.user.id;
        }
        
        // Fetch parent's user data including commission shares
        const parentRes = await fetch(`/api/users/${targetParentId}`);
        const parentUserData = await parentRes.json();
        
        if (parentUserData.success) {
          setParentData(parentUserData.user);
          // Set parent's values for display
          setForm(prev => ({
            ...prev,
            myShare: parentUserData.user.userCommissionShare?.share || 0,
            myCasinoShare: parentUserData.user.userCommissionShare?.cshare || 0,
            myCasinoCommission: parentUserData.user.userCommissionShare?.casinocommission || 0,
            myMatchCommission: parentUserData.user.userCommissionShare?.matchcommission || 0,
            mySessionCommission: parentUserData.user.userCommissionShare?.sessioncommission || 0,
          }));
        } else {
          setError('Failed to fetch parent data');
        }
      } catch (err) {
        console.error('Error fetching parent data:', err);
        setError('Failed to fetch parent data');
      } finally {
        setLoadingParent(false);
      }
    };

    fetchParentData();
  }, [router, router.query.parentId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (target as HTMLInputElement).checked : value
    }));
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm(prev => ({ ...prev, password }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check if parentId is provided in query parameters (from hierarchy modal)
      const parentIdFromQuery = router.query.parentId as string || null;
      
      let targetParentId: string;
      
      if (parentIdFromQuery) {
        // Use the parentId from query parameters (selected from hierarchy modal)
        targetParentId = parentIdFromQuery;
      } else {
        // Get current user's session to get their ID (default behavior)
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        
        if (!sessionData.valid) {
          setError('Session expired. Please login again.');
          router.push('/login');
          return;
        }
        
        targetParentId = sessionData.user.id;
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'USER',
          name: form.name,
          password: form.password,
          contactno: form.contactno,
          reference: form.reference,
          share: form.share,
          casinoShare: form.casinoShare,
          casinoCommission: form.casinoCommission,
          matchCommission: form.matchCommission,
          sessionCommission: form.sessionCommission,
          commissionType: form.commissionType,
          casinoStatus: form.casinoStatus,
          creditLimit: form.balance,
          parentId: targetParentId, // Use the selected parent from hierarchy modal
          // Parent commission fields
          myShare: form.myShare,
          myCasinoShare: form.myCasinoShare,
          myCasinoCommission: form.myCasinoCommission,
          myMatchCommission: form.myMatchCommission,
          mySessionCommission: form.mySessionCommission,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Client created successfully!');
        setTimeout(() => {
          router.push('/user_details/client');
        }, 2000);
      } else {
        setError(data.message || 'Failed to create client');
      }
    } catch (err) {
      console.error('Error creating client:', err);
      setError('Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  if (loadingParent) {
    return (
      <Layout>
        <div className="content-wrapper">
          <div className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-sm-6">
                  <h1 className="m-0">Create Client</h1>
                </div>
              </div>
            </div>
          </div>
          <div className="content">
            <div className="container-fluid">
              <div className="text-center">
                <i className="fas fa-spinner fa-spin fa-2x"></i>
                <p>Loading parent data...</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="content-wrapper">
        <div className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="m-0">Create Client</h1>
              </div>
              <div className="col-sm-6">
                <ol className="breadcrumb float-sm-right">
                  <li className="breadcrumb-item"><a href="/">Home</a></li>
                  <li className="breadcrumb-item"><a href="/user_details/client">Client</a></li>
                  <li className="breadcrumb-item active">Create</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
        <div className="content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-12">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Create New Client</h3>
                  </div>
                  <form onSubmit={handleSubmit}>
                    <div className="card-body">
                      {error && <div className="alert alert-danger">{error}</div>}
                      {success && <div className="alert alert-success">{success}</div>}
                      
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Name <span className="text-danger">*</span></label>
                            <input type="text" name="name" className="form-control" required value={form.name} onChange={handleChange} />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Contact Number</label>
                            <input type="text" name="contactno" className="form-control" value={form.contactno} onChange={handleChange} />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Password <span className="text-danger">*</span></label>
                            <div className="input-group">
                              <input type="text" name="password" className="form-control" required value={form.password} onChange={handleChange} />
                              <div className="input-group-append">
                                <button type="button" className="btn btn-outline-secondary" onClick={generatePassword}>
                                  Generate
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Reference</label>
                            <input type="text" name="reference" className="form-control" value={form.reference} onChange={handleChange} />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Credit Limit</label>
                            <input type="number" name="balance" className="form-control" value={form.balance} onChange={handleChange} />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Commission Type</label>
                            <select name="commissionType" className="form-control" value={form.commissionType} onChange={handleChange}>
                              <option value="">Select Commission Type</option>
                              <option value="Percentage">Percentage</option>
                              <option value="Fixed">Fixed</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <hr />
                      <h5>Commission & Share Settings</h5>
                      
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Share (%) <span className="text-muted">(Max: {form.myShare || 100}%)</span></label>
                            <input type="number" min="0" max={form.myShare || 100} name="share" placeholder="Share" className="form-control shadow-none" step="0.01" required value={form.share} onChange={handleChange} />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Casino Share (%) <span className="text-muted">(Max: {form.myCasinoShare || 100}%)</span></label>
                            <input type="number" min="0" max={form.myCasinoShare || 100} name="casinoShare" placeholder="Casino Share" className="form-control shadow-none" step="0.01" required value={form.casinoShare} onChange={handleChange} />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Match Commission (%) <span className="text-muted">(Max: {form.myMatchCommission || 100}%)</span></label>
                            <input type="number" min="0" max={form.myMatchCommission || 100} name="matchCommission" className="form-control" placeholder="Match Commission" value={form.matchCommission || ''} onChange={handleChange} />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Session Commission (%) <span className="text-muted">(Max: {form.mySessionCommission || 100}%)</span></label>
                            <input type="number" min="0" max={form.mySessionCommission || 100} name="sessionCommission" className="form-control" placeholder="Session Commission" value={form.sessionCommission || ''} onChange={handleChange} />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Casino Commission (%) <span className="text-muted">(Max: {form.myCasinoCommission || 100}%)</span></label>
                            <input type="number" min="0" max={form.myCasinoCommission || 100} name="casinoCommission" className="form-control" placeholder="Casino Commission" value={form.casinoCommission || ''} onChange={handleChange} />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <div className="custom-control custom-switch">
                              <input type="checkbox" name="casinoStatus" className="custom-control-input" id="casinoStatus" checked={form.casinoStatus} onChange={handleChange} />
                              <label className="custom-control-label" htmlFor="casinoStatus">Casino Status</label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {parentData && (
                        <div className="alert alert-info">
                          <strong>Parent Information:</strong><br />
                          Name: {parentData.name}<br />
                          Code: {parentData.code}<br />
                          Share: {parentData.userCommissionShare?.share || 0}%<br />
                          Casino Share: {parentData.userCommissionShare?.cshare || 0}%<br />
                          Match Commission: {parentData.userCommissionShare?.matchcommission || 0}%<br />
                          Session Commission: {parentData.userCommissionShare?.sessioncommission || 0}%<br />
                          Casino Commission: {parentData.userCommissionShare?.casinocommission || 0}%
                        </div>
                      )}
                    </div>
                    <div className="card-footer">
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Create Client'}
                      </button>
                      <a href="/user_details/client" className="btn btn-secondary ml-2">Cancel</a>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ClientCreatePage; 