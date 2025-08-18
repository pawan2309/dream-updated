import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../../components/Layout';

const EditSubAgent = () => {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState<any>(null);
  const [parentUser, setParentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingParent, setLoadingParent] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<any>({});
  const [validationErrors, setValidationErrors] = useState<any>({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setLoadingParent(true);
    
    const fetchData = async () => {
      try {
        // Fetch user data
        const userRes = await fetch(`/api/users/${id}`);
        const userData = await userRes.json();
        
        if (userData.success) {
          setUser(userData.user);
          setForm({
            code: userData.user.code || '',
            name: userData.user.name || '',
            reference: userData.user.reference || '',
            password: userData.user.password || '',
            contactno: userData.user.contactno || '',
            // Current user's commission and share values from UserCommissionShare
            share: userData.user.userCommissionShare?.share || '',
            commissionType: userData.user.userCommissionShare?.commissionType || 'NoCommission',
            matchCommission: userData.user.userCommissionShare?.matchcommission || '',
            sessionCommission: userData.user.userCommissionShare?.sessioncommission || '',
            casinoShare: userData.user.userCommissionShare?.cshare || '',
            casinoCommission: userData.user.userCommissionShare?.casinocommission || '',
            cshare: userData.user.userCommissionShare?.cshare || '',
            icshare: userData.user.userCommissionShare?.icshare || '',
            casinoStatus: userData.user.casinoStatus || false,
            // Parent values will be set after fetching parent data
            myShare: '',
            myCasinoShare: '',
            myCasinoCommission: '',
            myMatchCommission: '',
            mySessionCommission: '',
          });

          // Fetch parent user data using the same logic as create pages
          if (userData.user.parentId) {
            const parentRes = await fetch(`/api/users/${userData.user.parentId}`);
            const parentData = await parentRes.json();
            
            if (parentData.success) {
              setParentUser(parentData.user);
              // Set parent's values for display - use proper state update
              const commissionShare = parentData.user.UserCommissionShare;
              
              // Update form state with new values
              setForm(prevForm => ({
                ...prevForm,
                myShare: commissionShare?.share || 0,
                myCasinoShare: commissionShare?.cshare || 0,
                myCasinoCommission: commissionShare?.casinocommission || 0,
                myMatchCommission: commissionShare?.matchcommission || 0,
                mySessionCommission: commissionShare?.sessioncommission || 0,
              }));
            }
          }
        } else {
          setError('Failed to fetch user');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
        setLoadingParent(false);
      }
    };

    fetchData();
  }, [id]);

  const validateShare = (fieldName: string, value: number) => {
    if (!parentUser || !parentUser.userCommissionShare) return null;

    const parentShare = parentUser.userCommissionShare[fieldName] || 0;
    if (value > parentShare) {
      return `Cannot exceed parent's ${fieldName} (${parentShare}%)`;
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev: any) => ({ ...prev, [name]: null }));
    }

    // Validate share fields
    if (['share', 'casinoShare'].includes(name)) {
      const numValue = parseFloat(value) || 0;
      const error = validateShare(name, numValue);
      if (error) {
        setValidationErrors((prev: any) => ({ ...prev, [name]: error }));
      }
    }
  };

  const generatePassword = () => {
    const randomPassword = Math.floor(Math.random() * (9999999 - 1000000)) + 1000000;
    setForm((prev: any) => ({ ...prev, password: randomPassword.toString() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    const errors: any = {};
    if (form.share) {
      const shareError = validateShare('share', parseFloat(form.share));
      if (shareError) errors.share = shareError;
    }
    if (form.cshare) {
      const cshareError = validateShare('cshare', parseFloat(form.cshare));
      if (cshareError) errors.cshare = cshareError;
    }
    if (form.icshare) {
      const icshareError = validateShare('icshare', parseFloat(form.icshare));
      if (icshareError) errors.icshare = icshareError;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please fix the validation errors before submitting.');
      return;
    }

    try {
      const res = await fetch(`/api/users/role-based`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: id,
          name: form.name,
          reference: form.reference,
          password: form.password,
          contactno: form.contactno,
          commissionType: form.commissionType,
          casinoStatus: form.casinoStatus,
          share: form.share,
          cshare: form.cshare,
          icshare: form.icshare,
          matchcommission: form.commissionType === 'BetByBet' ? form.matchCommission : 0, // Fixed: matchCommission -> matchcommission
          sessioncommission: form.commissionType === 'BetByBet' ? form.sessionCommission : 0, // Fixed: sessionCommission -> sessioncommission
          casinoShare: form.casinoShare,
          casinoCommission: form.casinoCommission,
          session_commission_type: form.commissionType === 'BetByBet' ? 'BetByBet' : 'No Comm',
          // Parent's commission and share values
          myMatchCommission: form.myMatchCommission,
          mySessionCommission: form.mySessionCommission,
          myCasinoCommission: form.myCasinoCommission,
          myCasinoShare: form.myCasinoShare,
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('User updated successfully!');
        router.push('/user_details/sub');
      } else setError(data.message || 'Failed to update user');
    } catch {
      setError('Failed to update user');
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="alert alert-danger">{error}</div></Layout>;
  if (!user) return <Layout><div>User not found</div></Layout>;

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
            <div className="col-sm-6"><h1 className="text-capitalize">Edit Sub Agent</h1></div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item"><a href="/">Home</a></li>
                <li className="breadcrumb-item active text-capitalize">Edit Sub Agent</li>
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
                    <div className="form-group"><label>Password</label><div className="input-group "><input type="text" name="password" className="form-control shadow-none" value={form.password} onChange={handleChange} /><span className="input-group-append"><button type="button" className="generate-password btn btn-info btn-flat" onClick={generatePassword}>Generate Password</button></span></div></div>
                    <div className="form-group"><label>Contact No</label><input type="number" name="contactno" className="form-control shadow-none" required value={form.contactno} onChange={handleChange} /></div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card card-secondary">
                  <div className="bg-secondary px-2 cardHeaderOfCollection"><h3 className="card-title collectionTitle">Share and Commission</h3><div className="card-tools ms-auto"><button type="button" className="btn btn-tool" data-card-widget="collapse" data-toggle="tooltip" title="Collapse"><i className="fas fa-minus"></i></button></div></div>
                  <div className="card-body">
                    <div className="form-group row mb-0">
                      <div className="form-group col-md-6">
                        <label>Sub Agent Share</label>
                        <input type="number" min="0" max={form.myShare || 100} name="share" placeholder="Share" className={`form-control shadow-none ${validationErrors.share ? 'is-invalid' : ''}`} step="0.01" required value={form.share} onChange={handleChange} />
                        {validationErrors.share && (
                          <div className="invalid-feedback">{validationErrors.share}</div>
                        )}
                      </div>
                      <div className="form-group col-md-6">
                        <label>My Share (Parent)</label>
                        <input
                          type="number"
                          className="form-control shadow-none"
                          readOnly
                          value={form.myShare || 0}
                          style={{ backgroundColor: '#f8f9fa', color: '#495057' }}
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
                              value={form.myMatchCommission || 0}
                              style={{ backgroundColor: '#f8f9fa', color: '#495057' }}
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
                              value={form.mySessionCommission || 0}
                              style={{ backgroundColor: '#f8f9fa', color: '#495057' }}
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
                            <label>Sub Agent Casino Share</label>
                            <input type="number" min="0" max={form.myCasinoShare || 100} name="casinoShare" placeholder="Share" className={`form-control shadow-none ${validationErrors.cshare ? 'is-invalid' : ''}`} step="0.01" required value={form.casinoShare} onChange={handleChange} />
                            {validationErrors.cshare && (
                              <div className="invalid-feedback">{validationErrors.cshare}</div>
                            )}
                          </div>
                          <div className="form-group col-md-6">
                            <label>My Casino Share (Parent)</label>
                            <input
                              type="number"
                              className="form-control shadow-none"
                              readOnly
                              value={form.myCasinoShare || 0}
                              style={{ backgroundColor: '#f8f9fa', color: '#495057' }}
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
                              value={form.myCasinoCommission || 0}
                              style={{ backgroundColor: '#f8f9fa', color: '#495057' }}
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
                <button type="button" className="btn btn-secondary" onClick={() => router.push('/user_details/sub')}>Cancel</button>
                <button type="submit" className="btn btn-success float-right" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Sub Agent'}
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

export default EditSubAgent; 