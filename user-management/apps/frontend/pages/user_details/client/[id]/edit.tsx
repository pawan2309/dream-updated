import React, { useState, useEffect } from 'react';
import Layout from '../../../../components/Layout';
import { useRouter } from 'next/router';

const ClientEditPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState({
    code: '',
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
  const [loadingData, setLoadingData] = useState(true);
  const [parentData, setParentData] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Fetch client data and parent data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoadingData(true);
        
        // Fetch client data
        const clientRes = await fetch(`/api/users/${id}`);
        const clientData = await clientRes.json();
        
        if (!clientData.success) {
          setError('Failed to fetch client data');
          return;
        }
        
        const client = clientData.user;
        
        // Set form data
        setForm({
          code: client.code || '',
          name: client.name || '',
          reference: client.reference || '',
          password: client.password || '',
          contactno: client.contactno || '',
          balance: client.creditLimit?.toString() || '',
          share: client.userCommissionShare?.share?.toString() || '',
          commissionType: client.userCommissionShare?.commissionType || '',
          casinoShare: client.userCommissionShare?.cshare?.toString() || '',
          casinoCommission: client.userCommissionShare?.casinocommission?.toString() || '',
          casinoStatus: client.casinoStatus || false,
          matchCommission: client.userCommissionShare?.matchcommission?.toString() || '',
          sessionCommission: client.userCommissionShare?.sessioncommission?.toString() || '',
          // Parent commission fields (will be set when parent data is fetched)
          myShare: '',
          myCasinoShare: '',
          myCasinoCommission: '',
          myMatchCommission: '',
          mySessionCommission: '',
        });
        
        // Fetch parent data
        if (client.parentId) {
          const parentRes = await fetch(`/api/users/${client.parentId}`);
          const parentData = await parentRes.json();
          
          if (parentData.success) {
            setParentData(parentData.user);
            // Set parent's values for validation
            setForm(prev => ({
              ...prev,
              myShare: parentData.user.userCommissionShare?.share || 0,
              myCasinoShare: parentData.user.userCommissionShare?.cshare || 0,
              myCasinoCommission: parentData.user.userCommissionShare?.casinocommission || 0,
              myMatchCommission: parentData.user.userCommissionShare?.matchcommission || 0,
              mySessionCommission: parentData.user.userCommissionShare?.sessioncommission || 0,
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (target as HTMLInputElement).checked : value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm(prev => ({ ...prev, password }));
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!form.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!form.password.trim()) {
      errors.password = 'Password is required';
    }
    
    // Validate share and commission fields against parent limits
    if (form.share && parseFloat(form.share) > parseFloat(form.myShare || '100')) {
      errors.share = `Share cannot exceed parent's share (${form.myShare || 100}%)`;
    }
    
    if (form.casinoShare && parseFloat(form.casinoShare) > parseFloat(form.myCasinoShare || '100')) {
      errors.casinoShare = `Casino share cannot exceed parent's casino share (${form.myCasinoShare || 100}%)`;
    }
    
    if (form.matchCommission && parseFloat(form.matchCommission) > parseFloat(form.myMatchCommission || '100')) {
      errors.matchCommission = `Match commission cannot exceed parent's match commission (${form.myMatchCommission || 100}%)`;
    }
    
    if (form.sessionCommission && parseFloat(form.sessionCommission) > parseFloat(form.mySessionCommission || '100')) {
      errors.sessionCommission = `Session commission cannot exceed parent's session commission (${form.mySessionCommission || 100}%)`;
    }
    
    if (form.casinoCommission && parseFloat(form.casinoCommission) > parseFloat(form.myCasinoCommission || '100')) {
      errors.casinoCommission = `Casino commission cannot exceed parent's casino commission (${form.myCasinoCommission || 100}%)`;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Client updated successfully!');
        setTimeout(() => {
          router.push('/user_details/client');
        }, 2000);
      } else {
        setError(data.message || 'Failed to update client');
      }
    } catch (err) {
      console.error('Error updating client:', err);
      setError('Failed to update client');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Layout>
        <div className="content-wrapper">
          <div className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-sm-6">
                  <h1 className="m-0">Edit Client</h1>
                </div>
              </div>
            </div>
          </div>
          <div className="content">
            <div className="container-fluid">
              <div className="text-center">
                <i className="fas fa-spinner fa-spin fa-2x"></i>
                <p>Loading client data...</p>
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
                <h1 className="m-0">Edit Client</h1>
              </div>
              <div className="col-sm-6">
                <ol className="breadcrumb float-sm-right">
                  <li className="breadcrumb-item"><a href="/">Home</a></li>
                  <li className="breadcrumb-item"><a href="/user_details/client">Client</a></li>
                  <li className="breadcrumb-item active">Edit</li>
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
                    <h3 className="card-title">Edit Client</h3>
                  </div>
                  <form onSubmit={handleSubmit}>
                    <div className="card-body">
                      {error && <div className="alert alert-danger">{error}</div>}
                      {success && <div className="alert alert-success">{success}</div>}
                      
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Name <span className="text-danger">*</span></label>
                            <input 
                              type="text" 
                              name="name" 
                              className={`form-control ${validationErrors.name ? 'is-invalid' : ''}`} 
                              required 
                              value={form.name} 
                              onChange={handleChange} 
                            />
                            {validationErrors.name && <div className="invalid-feedback">{validationErrors.name}</div>}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Contact Number</label>
                            <input 
                              type="text" 
                              name="contactno" 
                              className="form-control" 
                              value={form.contactno} 
                              onChange={handleChange} 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Password <span className="text-danger">*</span></label>
                            <div className="input-group">
                              <input 
                                type="text" 
                                name="password" 
                                className={`form-control ${validationErrors.password ? 'is-invalid' : ''}`} 
                                required 
                                value={form.password} 
                                onChange={handleChange} 
                              />
                              <div className="input-group-append">
                                <button type="button" className="btn btn-outline-secondary" onClick={generatePassword}>
                                  Generate
                                </button>
                              </div>
                            </div>
                            {validationErrors.password && <div className="invalid-feedback">{validationErrors.password}</div>}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Reference</label>
                            <input 
                              type="text" 
                              name="reference" 
                              className="form-control" 
                              value={form.reference} 
                              onChange={handleChange} 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Credit Limit</label>
                            <input 
                              type="number" 
                              name="balance" 
                              className="form-control" 
                              value={form.balance} 
                              onChange={handleChange} 
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Commission Type</label>
                            <select 
                              name="commissionType" 
                              className="form-control" 
                              value={form.commissionType} 
                              onChange={handleChange}
                            >
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
                            <input 
                              type="number" 
                              min="0" 
                              max={form.myShare || 100} 
                              name="share" 
                              placeholder="Share" 
                              className={`form-control shadow-none ${validationErrors.share ? 'is-invalid' : ''}`} 
                              step="0.01" 
                              required 
                              value={form.share} 
                              onChange={handleChange} 
                            />
                            {validationErrors.share && <div className="invalid-feedback">{validationErrors.share}</div>}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Casino Share (%) <span className="text-muted">(Max: {form.myCasinoShare || 100}%)</span></label>
                            <input 
                              type="number" 
                              min="0" 
                              max={form.myCasinoShare || 100} 
                              name="casinoShare" 
                              placeholder="Casino Share" 
                              className={`form-control shadow-none ${validationErrors.casinoShare ? 'is-invalid' : ''}`} 
                              step="0.01" 
                              required 
                              value={form.casinoShare} 
                              onChange={handleChange} 
                            />
                            {validationErrors.casinoShare && <div className="invalid-feedback">{validationErrors.casinoShare}</div>}
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Match Commission (%) <span className="text-muted">(Max: {form.myMatchCommission || 100}%)</span></label>
                            <input 
                              type="number" 
                              min="0" 
                              max={form.myMatchCommission || 100} 
                              name="matchCommission" 
                              className={`form-control ${validationErrors.matchCommission ? 'is-invalid' : ''}`} 
                              placeholder="Match Commission" 
                              value={form.matchCommission || ''} 
                              onChange={handleChange} 
                            />
                            {validationErrors.matchCommission && <div className="invalid-feedback">{validationErrors.matchCommission}</div>}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Session Commission (%) <span className="text-muted">(Max: {form.mySessionCommission || 100}%)</span></label>
                            <input 
                              type="number" 
                              min="0" 
                              max={form.mySessionCommission || 100} 
                              name="sessionCommission" 
                              className={`form-control ${validationErrors.sessionCommission ? 'is-invalid' : ''}`} 
                              placeholder="Session Commission" 
                              value={form.sessionCommission || ''} 
                              onChange={handleChange} 
                            />
                            {validationErrors.sessionCommission && <div className="invalid-feedback">{validationErrors.sessionCommission}</div>}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Casino Commission (%) <span className="text-muted">(Max: {form.myCasinoCommission || 100}%)</span></label>
                            <input 
                              type="number" 
                              min="0" 
                              max={form.myCasinoCommission || 100} 
                              name="casinoCommission" 
                              className={`form-control ${validationErrors.casinoCommission ? 'is-invalid' : ''}`} 
                              placeholder="Casino Commission" 
                              value={form.casinoCommission || ''} 
                              onChange={handleChange} 
                            />
                            {validationErrors.casinoCommission && <div className="invalid-feedback">{validationErrors.casinoCommission}</div>}
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <div className="custom-control custom-switch">
                              <input 
                                type="checkbox" 
                                name="casinoStatus" 
                                className="custom-control-input" 
                                id="casinoStatus" 
                                checked={form.casinoStatus} 
                                onChange={handleChange} 
                              />
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
                        {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Update Client'}
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

export default ClientEditPage; 