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
        <div className="text-center">
          <i className="fas fa-spinner fa-spin fa-2x"></i>
          <p>Loading client data...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <style jsx>{`
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
          margin-left: 10px;
        }
        .toggle-input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-label {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 24px;
        }
        .toggle-label:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        .toggle-input:checked + .toggle-label {
          background-color: #2196F3;
        }
        .toggle-input:checked + .toggle-label:before {
          transform: translateX(26px);
        }
        .form-group label {
          display: flex;
          align-items: center;
          margin-bottom: 0;
        }
        .form-group label span {
          font-weight: 500;
          color: #333;
        }
      `}</style>
      <section className="content-header pb-2">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6"><h1 className="text-capitalize">Edit Client</h1></div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item"><a href="/">Home</a></li>
                <li className="breadcrumb-item"><a href="/user_details/client">Client</a></li>
                <li className="breadcrumb-item active text-capitalize">Edit</li>
              </ol>
            </div>
          </div>
        </div>
      </section>
      <section className="content">
        <form onSubmit={handleSubmit}>
          <div className="row g-0 g-sm-3">
            <div className="col-md-6">
              <div className="card tbaleCard card-primary">
                <div className="px-2 cardHeaderOfCollection bg-primary">
                  <h3 className="card-title collectionTitle">General</h3>
                  <div className="card-tools ms-auto">
                    <button type="button" className="btn btn-tool" data-card-widget="collapse" data-toggle="tooltip" title="Collapse"><i className="fas fa-minus"></i></button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="form-group"><label>Code</label><input type="text" className="form-control shadow-none" readOnly value={form.code} /></div>
                  <div className="form-group">
                    <label>Name <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      name="name" 
                      className={`form-control shadow-none ${validationErrors.name ? 'is-invalid' : ''}`} 
                      required 
                      value={form.name} 
                      onChange={handleChange} 
                    />
                    {validationErrors.name && <div className="invalid-feedback">{validationErrors.name}</div>}
                  </div>
                  <div className="form-group"><label>Reference</label><input type="text" name="reference" className="form-control shadow-none" value={form.reference} onChange={handleChange} /></div>
                  <div className="form-group"><label>Password</label><div className="input-group "><input type="text" name="password" className="form-control shadow-none" required value={form.password} onChange={handleChange} /><span className="input-group-append"><button type="button" className="generate-password btn btn-info btn-flat" onClick={generatePassword}>Generate Password</button></span></div></div>
                  <div className="form-group">
                    <label>Contact No</label>
                    <input 
                      type="text" 
                      name="contactno" 
                      className="form-control shadow-none" 
                      required 
                      value={form.contactno} 
                      onChange={handleChange}
                      placeholder="Enter contact number (numbers only)"
                    />
                  </div>
                  <div className="form-group">
                    <label>Parent Limit (Available)</label>
                    <input 
                      type="number" 
                      className="form-control shadow-none" 
                      readOnly 
                      value={parentData?.creditLimit || 0}
                      style={{ backgroundColor: '#f8f9fa', color: '#495057' }}
                    />
                    <small className="form-text text-muted">This shows how much limit the parent has available</small>
                  </div>
                  <div className="form-group"><label>Credit Limit</label><input type="number" name="balance" className="form-control shadow-none" value={form.balance} onChange={handleChange} /></div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card card-secondary">
                <div className="bg-secondary px-2 cardHeaderOfCollection"><h3 className="card-title collectionTitle">Share and Commission</h3><div className="card-tools ms-auto"><button type="button" className="btn btn-tool" data-card-widget="collapse" data-toggle="tooltip" title="Collapse"><i className="fas fa-minus"></i></button></div></div>
                <div className="card-body">
                  <div className="form-group row mb-0">
                    <div className="form-group col-md-6">
                      <label>Client Share</label>
                      <input type="number" min="0" max={form.myShare || 100} name="share" placeholder="Share" className="form-control shadow-none" step="0.01" required value={form.share} onChange={handleChange} />
                    </div>
                    <div className="form-group col-md-6">
                      <label>My Share (Parent)</label>
                      <input 
                        type="number" 
                        className="form-control shadow-none" 
                        readOnly 
                        value={form.myShare} 
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Commission Type</label>
                    <select name="commissionType" className="form-control shadow-none" value={form.commissionType} onChange={handleChange}>
                      <option value="NoCommission">No Commission</option>
                      <option value="BetByBet">Bet By Bet</option>
                    </select>
                  </div>
                  {form.commissionType === 'BetByBet' && (
                    <>
                      <div className="form-group row mb-0">
                        <div className="form-group col-md-6">
                          <label>Match Commission</label>
                          <input type="number" min="0" max={form.myMatchCommission || 100} name="matchCommission" className="form-control" placeholder="Match Commission" value={form.matchCommission || ''} onChange={handleChange} />
                        </div>
                        <div className="form-group col-md-6">
                          <label>My Match Commission (Parent)</label>
                          <input 
                            type="number" 
                            className="form-control" 
                            readOnly 
                            placeholder="Parent Match Commission" 
                            value={form.myMatchCommission || ''} 
                          />
                        </div>
                      </div>
                      <div className="form-group row mb-0">
                        <div className="form-group col-md-6">
                          <label>Session Commission</label>
                          <input type="number" min="0" max={form.mySessionCommission || 100} name="sessionCommission" className="form-control" placeholder="Session Commission" value={form.sessionCommission || ''} onChange={handleChange} />
                        </div>
                        <div className="form-group col-md-6">
                          <label>My Session Commission (Parent)</label>
                          <input 
                            type="number" 
                            className="form-control" 
                            readOnly 
                            placeholder="Parent Session Commission" 
                            value={form.mySessionCommission || ''} 
                          />
                        </div>
                      </div>
                    </>
                  )}
                  <div className="form-group">
                    <label>
                      <span>Casino Status</span>
                      <div className="toggle-switch">
                        <input
                          type="checkbox"
                          id="casinoStatus"
                          name="casinoStatus"
                          checked={form.casinoStatus}
                          onChange={(e) => setForm(prev => ({ ...prev, casinoStatus: e.target.checked }))}
                          className="toggle-input"
                        />
                        <label htmlFor="casinoStatus" className="toggle-label"></label>
                      </div>
                    </label>
                  </div>
                  {form.casinoStatus && (
                    <>
                      <div className="form-group row mb-0">
                        <div className="form-group col-md-6">
                          <label>Client Casino Share</label>
                          <input type="number" min="0" max={form.myCasinoShare || 100} name="casinoShare" placeholder="Share" className="form-control shadow-none" step="0.01" required value={form.casinoShare} onChange={handleChange} />
                        </div>
                        <div className="form-group col-md-6">
                          <label>My Casino Share (Parent)</label>
                          <input 
                            type="number" 
                            className="form-control shadow-none" 
                            readOnly 
                            placeholder="Parent Casino Share" 
                            value={form.myCasinoShare || ''} 
                          />
                        </div>
                      </div>
                      <div className="form-group row mb-0">
                        <div className="form-group col-md-6">
                          <label>Casino Commission</label>
                          <input type="number" min="0" max={form.myCasinoCommission || 100} name="casinoCommission" className="form-control shadow-none" required value={form.casinoCommission} onChange={handleChange} />
                        </div>
                        <div className="form-group col-md-6">
                          <label>My Casino Commission (Parent)</label>
                          <input 
                            type="number" 
                            className="form-control shadow-none" 
                            readOnly 
                            placeholder="Parent Casino Commission" 
                            value={form.myCasinoCommission || ''} 
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="row mx-0 ">
            <div className="col-12 subowner-cancel-create mb-4 px-0">
              <button type="button" className="btn btn-secondary" onClick={() => router.push('/user_details/client')}>Cancel</button>
              <button type="submit" className="btn btn-success float-right" disabled={loading}>
                {loading ? 'Updating...' : 'Update Client'}
              </button>
            </div>
          </div>
          {success && <div className="alert alert-success mt-3">{success}</div>}
          {error && <div className="alert alert-danger mt-3">{error}</div>}
        </form>
      </section>
    </Layout>
  );
};

export default ClientEditPage; 