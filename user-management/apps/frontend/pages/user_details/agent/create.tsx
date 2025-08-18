import React, { useState, useEffect } from 'react';
import Layout from '../../../components/Layout';
import { useRouter } from 'next/router';

const AgentCreatePage = () => {
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
          
          // Set parent's values for display - use proper state update
          const commissionShare = parentUserData.user.UserCommissionShare;
          
          // Update form state with new values
          setForm(prevForm => ({
            ...prevForm,
            myShare: commissionShare?.share || 0,
            myCasinoShare: commissionShare?.cshare || 0,
            myCasinoCommission: commissionShare?.casinocommission || 0,
            myMatchCommission: commissionShare?.matchcommission || 0,
            mySessionCommission: commissionShare?.sessioncommission || 0,
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
    const randomPassword = Math.floor(Math.random() * (9999999 - 1000000)) + 1000000;
    setForm(prev => ({ ...prev, password: randomPassword.toString() }));
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

      const res = await fetch('/api/users/role-based', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          creditLimit: Number(form.balance),
          role: 'AGENT',
          parentId: targetParentId, // Use the selected parent from hierarchy modal
          // Child's commission and share values
          share: form.share,
          casinoShare: form.casinoShare,
          casinoCommission: form.casinoCommission,
          matchCommission: form.matchCommission,
          sessionCommission: form.sessionCommission,
          commissionType: form.commissionType,
          casinoStatus: form.casinoStatus,
          // Parent's commission and share values
          myMatchCommission: form.myMatchCommission,
          mySessionCommission: form.mySessionCommission,
          myCasinoCommission: form.myCasinoCommission,
          myCasinoShare: form.myCasinoShare,
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Agent created successfully! Redirecting...');
        setTimeout(() => router.push('/user_details/agent'), 1500);
      } else {
        setError(data.message || 'Failed to create Agent');
      }
    } catch (err) {
      setError('Failed to create Agent');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="alert alert-danger">{error}</div></Layout>;
  if (!parentData) return <Layout><div>User not found</div></Layout>;

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
            <div className="col-sm-6"><h1 className="text-capitalize">Agent</h1></div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item"><a href="/">Home</a></li>
                <li className="breadcrumb-item active text-capitalize">New Agent</li>
              </ol>
            </div>
          </div>
        </div>
      </section>
      <section className="content">
        {loadingParent ? (
          <div className="text-center">
            <i className="fas fa-spinner fa-spin fa-2x"></i>
            <p>Loading parent data...</p>
          </div>
        ) : (
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
                    <div className="form-group"><label>Name</label><input type="text" name="name" className="form-control shadow-none" required value={form.name} onChange={handleChange} /></div>
                    <div className="form-group"><label>Reference</label><input type="text" name="reference" className="form-control shadow-none" required value={form.reference} onChange={handleChange} /></div>
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
                    <div className="form-group"><label>Balance</label><input type="number" name="balance" className="form-control shadow-none" value={form.balance} onChange={handleChange} /></div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card card-secondary">
                  <div className="bg-secondary px-2 cardHeaderOfCollection"><h3 className="card-title collectionTitle">Share and Commission</h3><div className="card-tools ms-auto"><button type="button" className="btn btn-tool" data-card-widget="collapse" data-toggle="tooltip" title="Collapse"><i className="fas fa-minus"></i></button></div></div>
                  <div className="card-body">
                    <div className="form-group row mb-0">
                      <div className="form-group col-md-6">
                        <label>Agent Share</label>
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
                            <label>Agent Casino Share</label>
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
                <button type="button" className="btn btn-secondary" onClick={() => router.push('/user_details/agent')}>Cancel</button>
                <button type="submit" className="btn btn-success float-right" disabled={loading}>
                  {loading ? 'Creating...' : 'Create New Agent'}
                </button>
              </div>
            </div>
            {success && <div className="alert alert-success mt-3">{success}</div>}
            {error && <div className="alert alert-danger mt-3">{error}</div>}
          </form>
        )}
      </section>
    </Layout>
  );
};

export default AgentCreatePage; 