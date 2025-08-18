import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { useRouter } from 'next/router';
import { config } from '../../lib/config';

// Removed server-side auth check to prevent redirect loops
export const getServerSideProps = async () => {
  return { props: {} };
};

const UserCreatePage = () => {
  const router = useRouter();
  const { role, parentId } = router.query; // Get role and parentId from URL query parameter
  
  const [formData, setFormData] = useState({
    code: 'Auto Generated',
    name: '',
    reference: '',
    password: '',
    contactno: '',
    balance: '',
    share: 0.0,
    cshare: 0.0,
    icshare: 0.0,
    mobileshare: 100.0,
    session_commission_type: 'No Comm',
    matchcommission: 0.0,
    sessioncommission: 0.0,
    casinocommission: 0.0,
    commissionType: 'NoCommission',
    casinoShare: 0.0,
    casinoCommission: 0.0,
    casinoStatus: false,
    // Parent commission fields (editable)
    myShare: '',
    myCasinoShare: '',
    myCasinoCommission: '',
    myMatchCommission: '',
    mySessionCommission: '',
  });

  // Constants for commission calculations - now using config
  const [commissionConstants] = useState({
    mc: config.commission.matchCommission,
    sc: config.commission.sessionCommission,  
    cc: config.commission.casinoCommission
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [parentInfo, setParentInfo] = useState<{ name: string; code: string; role: string } | null>(null);
  const [parentData, setParentData] = useState<any>(null);
  const [loadingParent, setLoadingParent] = useState(true);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'SUB_OWNER': return 'Sub Owner';
      case 'SUB': return 'Sub Agent';
      case 'MASTER': return 'Master Agent';
      case 'SUPER_AGENT': return 'Super Agent';
      case 'AGENT': return 'Agent';
      case 'USER': return 'Client';
      default: return 'User';
    }
  };

  // Get redirect path based on role
  const getRedirectPath = (role: string) => {
    switch (role) {
      case 'SUB': return '/user_details/sub';
      case 'MASTER': return '/user_details/master';
      case 'SUPER_AGENT': return '/user_details/super';
      case 'AGENT': return '/user_details/agent';
      case 'USER': return '/user_details/client';
      default: return '/user_details/sub';
    }
  };

  // Add role selector state
  const [selectedRole, setSelectedRole] = useState<string>((role as string) || 'SUB');

  // Check session validity on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session', {
          credentials: 'include'
        });
        const data = await res.json();
        if (data.valid) {
          setIsSessionValid(true);
          setCurrentUserRole(data.user.role);
          
          // Fetch parent's commission and share data
          await fetchParentData(data.user.id);
        } else {
          // Small delay to prevent immediate redirect
          setTimeout(() => {
            router.replace('/login');
          }, 100);
          return;
        }
      } catch (error) {
        console.error('Session check error:', error);
        setTimeout(() => {
          router.replace('/login');
        }, 100);
        return;
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [router]);

  // Fetch parent's (logged-in user's) commission and share data
  const fetchParentData = async (parentId: string) => {
    try {
      setLoadingParent(true);
      
      // Fetch parent's user data including commission shares
      const parentRes = await fetch(`/api/users/${parentId}`, {
        credentials: 'include'
      });
      const parentUserData = await parentRes.json();
      
      if (parentUserData.success) {
        setParentData(parentUserData.user);
        // Set parent's values for display
        setFormData(prev => ({
          ...prev,
          myShare: parentUserData.user.UserCommissionShare?.share || 0,
          myCasinoShare: parentUserData.user.UserCommissionShare?.cshare || 0,
          myCasinoCommission: parentUserData.user.UserCommissionShare?.casinocommission || 0,
          myMatchCommission: parentUserData.user.UserCommissionShare?.matchcommission || 0,
          mySessionCommission: parentUserData.user.UserCommissionShare?.sessioncommission || 0,
        }));
      } else {
        console.error('Failed to fetch parent data');
      }
    } catch (err) {
      console.error('Error fetching parent data:', err);
    } finally {
      setLoadingParent(false);
    }
  };

  const fetchParentInfo = async () => {
    if (parentId) {
      try {
        const res = await fetch(`/api/users/${router.query.parentId}`, {
          credentials: 'include'
        });
        const data = await res.json();
        if (data.success && data.user) {
          setParentInfo({
            name: data.user.name || '',
            code: data.user.code || '',
            role: data.user.role || ''
          });
        }
      } catch (error) {
        console.error('Error fetching parent info:', error);
      }
    }
  };

  useEffect(() => {
    fetchParentInfo();
  }, [parentId, router.query.parentId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear validation error for this field when user types
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const generatePassword = () => {
    const randomPassword = Math.floor(Math.random() * (9999999 - 1000000)) + 1000000;
    setFormData(prev => ({ ...prev, password: randomPassword.toString() }));
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    }
    
    if (!formData.reference.trim()) {
      errors.reference = 'Reference is required';
    }
    
    // Validate contact number - allow any numerical input but must be numbers only
    if (formData.contactno && !/^\d+$/.test(formData.contactno)) {
      errors.contactno = 'Contact number must contain only numbers';
    }
    
    // Validate share values
    if (formData.share < 0 || formData.share > 100) {
      errors.share = 'Share must be between 0 and 100';
    }
    
    if (formData.casinoShare < 0 || formData.casinoShare > 100) {
      errors.casinoShare = 'Casino share must be between 0 and 100';
    }
    
    // Validate commission values
    if (formData.matchcommission < 0 || formData.matchcommission > 10) {
      errors.matchcommission = 'Match commission must be between 0 and 10';
    }
    
    if (formData.sessioncommission < 0 || formData.sessioncommission > 10) {
      errors.sessioncommission = 'Session commission must be between 0 and 10';
    }
    
    if (formData.casinoCommission < 0 || formData.casinoCommission > 10) {
      errors.casinoCommission = 'Casino commission must be between 0 and 10';
    }
    
    // Set validation errors
    setValidationErrors(errors);
    
    // Return true if no errors, false if there are errors
    return Object.keys(errors).length === 0;
  };

  const handleCommissionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const commissionType = e.target.value;
    setFormData(prev => ({
      ...prev,
      commissionType,
      session_commission_type: commissionType === 'BetByBet' ? 'BetByBet' : 'No Comm'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return; // Stop submission if validation fails
    }
    
    setIsLoading(true);

    try {
      const userRole = selectedRole;
      let finalParentId = parentId as string;

      if (parentId) {
        // If parentId is provided in URL, use it
        await createUser(userRole, parentId as string);
      } else {
        // Otherwise, use current user as parent (for direct subordinates)
        await createUser(userRole, currentUserRole === 'BOSS' ? null : currentUserRole);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert('Error creating user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async (userRole: string, parentId?: string | null) => {
    try {
      // Get current user's session to determine parentId if not provided
      const sessionRes = await fetch('/api/auth/session', {
        credentials: 'include'
      });
      const sessionData = await sessionRes.json();
      
      if (!sessionData.valid) {
        alert('Session expired. Please login again.');
        router.push('/login');
        return;
      }

      // Fallback to session user if no parentId provided
      let finalParentId = parentId;
      if (!finalParentId) {
        finalParentId = sessionData.user.id; // Use the actual user ID, not the role
      }

      // Prepare user data for API
      const userData = {
        ...formData,
        role: userRole,
        parentId: finalParentId,
        creditLimit: 0, // Add default credit limit
        // Child's commission and share values
        share: formData.share,
        casinoShare: formData.casinoShare,
        casinoCommission: formData.casinoCommission,
        matchCommission: formData.matchcommission,
        sessionCommission: formData.sessioncommission,
        commissionType: formData.commissionType,
        casinoStatus: formData.casinoStatus,
        // Parent's commission and share values
        myMatchCommission: formData.myMatchCommission,
        mySessionCommission: formData.mySessionCommission,
        myCasinoCommission: formData.myCasinoCommission,
        myCasinoShare: formData.myCasinoShare,
      };

      console.log('Creating user with data:', userData);

      // Creating user with data
      const res = await fetch('/api/users/role-based', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      const data = await res.json();
      if (data.success) {
        alert('User created successfully!');
        router.push(getRedirectPath(userRole));
      } else {
        const errorMessage = data.message || 'Failed to create user';
        console.error('User creation failed:', data);
        alert('Failed to create user: ' + errorMessage);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user. Please try again.');
    }
  };

  if (isCheckingSession) {
    return (
      <Layout>
        <div className="text-center">
          <i className="fas fa-spinner fa-spin fa-2x"></i>
          <p>Checking session...</p>
        </div>
      </Layout>
    );
  }

  if (!isSessionValid) {
    return (
      <Layout>
        <div className="text-center">
          <p>Session invalid. Redirecting to login...</p>
        </div>
      </Layout>
    );
  }

  const userRole = (role as string) || 'SUB';
  const roleDisplayName = getRoleDisplayName(userRole);

  return (
    <Layout>
      <Head>
        <title>Create New {roleDisplayName}</title>
      </Head>
      
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
            <div className="col-sm-6">
              <h1 className="text-capitalize">Create New {roleDisplayName}</h1>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item"><a href="/">Home</a></li>
                <li className="breadcrumb-item"><a href={getRedirectPath(userRole)}>{getRoleDisplayName(userRole)}</a></li>
                <li className="breadcrumb-item active">New {getRoleDisplayName(userRole)}</li>
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
                    <div className="form-group">
                      <label>Code</label>
                      <input type="text" className="form-control shadow-none" readOnly value={formData.code} />
                    </div>
                    <div className="form-group">
                      <label>Name</label>
                      <input 
                        type="text" 
                        name="name" 
                        className={`form-control shadow-none ${validationErrors.name ? 'is-invalid' : ''}`} 
                        required 
                        value={formData.name} 
                        onChange={handleInputChange} 
                      />
                      {validationErrors.name && (
                        <div className="invalid-feedback">
                          {validationErrors.name}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Reference</label>
                      <input 
                        type="text" 
                        name="reference" 
                        className={`form-control shadow-none ${validationErrors.reference ? 'is-invalid' : ''}`} 
                        required 
                        value={formData.reference} 
                        onChange={handleInputChange} 
                      />
                      {validationErrors.reference && (
                        <div className="invalid-feedback">
                          {validationErrors.reference}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Password</label>
                      <div className="input-group">
                        <input 
                          type="text" 
                          name="password" 
                          className={`form-control shadow-none ${validationErrors.password ? 'is-invalid' : ''}`} 
                          required 
                          value={formData.password} 
                          onChange={handleInputChange} 
                        />
                        <span className="input-group-append">
                          <button type="button" className="generate-password btn btn-info btn-flat" onClick={generatePassword}>Generate Password</button>
                        </span>
                      </div>
                      {validationErrors.password && (
                        <div className="invalid-feedback">
                          {validationErrors.password}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Contact No</label>
                      <input 
                        type="text" 
                        name="contactno" 
                        className={`form-control shadow-none ${validationErrors.contactno ? 'is-invalid' : ''}`} 
                        required 
                        value={formData.contactno} 
                        onChange={handleInputChange}
                        placeholder="Enter contact number (numbers only)"
                      />
                      {validationErrors.contactno && (
                        <div className="invalid-feedback">
                          {validationErrors.contactno}
                        </div>
                      )}
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
                    <div className="form-group"><label>Balance</label><input type="number" name="balance" className="form-control shadow-none" value={formData.balance} onChange={handleInputChange} /></div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card card-secondary">
                  <div className="bg-secondary px-2 cardHeaderOfCollection">
                    <h3 className="card-title collectionTitle">Share and Commission</h3>
                    <div className="card-tools ms-auto">
                      <button type="button" className="btn btn-tool" data-card-widget="collapse" data-toggle="tooltip" title="Collapse"><i className="fas fa-minus"></i></button>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="form-group row mb-0">
                      <div className="form-group col-md-6">
                        <label htmlFor="share">{getRoleDisplayName(userRole)} Share</label>
                        <input 
                          type="number" 
                          min="0" 
                          max="98.5" 
                          name="share" 
                          placeholder="Share" 
                          className={`form-control shadow-none ${validationErrors.share ? 'is-invalid' : ''}`} 
                          step="0.01" 
                          required 
                          value={formData.share} 
                          onChange={handleInputChange} 
                        />
                        {validationErrors.share && (
                          <div className="invalid-feedback">
                            {validationErrors.share}
                          </div>
                        )}
                      </div>
                      <div className="form-group col-md-6">
                        <label>My Share (Parent)</label>
                        <input 
                          type="number" 
                          className="form-control shadow-none" 
                          readOnly 
                          value={formData.myShare} 
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Commission Type</label>
                      <select name="commissionType" className="form-control shadow-none" value={formData.commissionType} onChange={handleCommissionTypeChange}>
                        <option value="NoCommission">No Commission</option>
                        <option value="BetByBet">Bet By Bet</option>
                      </select>
                    </div>
                    {formData.commissionType === 'BetByBet' && (
                      <>
                        <div className="form-group row mb-0">
                          <div className="form-group col-md-6">
                            <label>Match Commission</label>
                            <input type="number" min="0" max={formData.myMatchCommission || 100} name="matchcommission" className="form-control" placeholder="Match Commission" value={formData.matchcommission || ''} onChange={handleInputChange} />
                          </div>
                          <div className="form-group col-md-6">
                            <label>My Match Commission (Parent)</label>
                            <input 
                              type="number" 
                              className="form-control" 
                              readOnly 
                              placeholder="Parent Match Commission" 
                              value={formData.myMatchCommission || ''} 
                            />
                          </div>
                        </div>
                        <div className="form-group row mb-0">
                          <div className="form-group col-md-6">
                            <label>Session Commission</label>
                            <input type="number" min="0" max={formData.mySessionCommission || 100} name="sessioncommission" className="form-control" placeholder="Session Commission" value={formData.sessioncommission || ''} onChange={handleInputChange} />
                          </div>
                          <div className="form-group col-md-6">
                            <label>My Session Commission (Parent)</label>
                            <input 
                              type="number" 
                              className="form-control" 
                              readOnly 
                              placeholder="Parent Session Commission" 
                              value={formData.mySessionCommission || ''} 
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
                            checked={formData.casinoStatus}
                            onChange={handleInputChange}
                            className="toggle-input"
                          />
                          <label htmlFor="casinoStatus" className="toggle-label"></label>
                        </div>
                      </label>
                    </div>
                    {formData.casinoStatus && (
                      <>
                        <div className="form-group row mb-0">
                          <div className="form-group col-md-6">
                            <label>User Casino Share</label>
                            <input type="number" min="0" max={formData.myCasinoShare || 100} name="casinoShare" placeholder="Share" className="form-control shadow-none" step="0.01" required value={formData.casinoShare || ''} onChange={handleInputChange} />
                          </div>
                          <div className="form-group col-md-6">
                            <label>My Casino Share (Parent)</label>
                            <input 
                              type="number" 
                              className="form-control shadow-none" 
                              readOnly 
                              placeholder="Parent Casino Share" 
                              value={formData.myCasinoShare || ''} 
                            />
                          </div>
                        </div>
                        <div className="form-group row mb-0">
                          <div className="form-group col-md-6">
                            <label>Casino Commission</label>
                            <input type="number" min="0" max={formData.myCasinoCommission || 100} name="casinoCommission" className="form-control shadow-none" required value={formData.casinoCommission || ''} onChange={handleInputChange} />
                          </div>
                          <div className="form-group col-md-6">
                            <label>My Casino Commission (Parent)</label>
                            <input 
                              type="number" 
                              className="form-control shadow-none" 
                              readOnly 
                              placeholder="Parent Casino Commission" 
                              value={formData.myCasinoCommission || ''} 
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="row mx-0">
              <div className="col-12 subowner-cancel-create mb-4 px-0">
                <a href={getRedirectPath(userRole)} className="btn btn-secondary">Cancel</a>
                <button type="submit" className="btn btn-success float-right" disabled={isLoading}>
                  <i className="fas fa-save"></i> Create New {getRoleDisplayName(userRole)}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>
    </Layout>
  );
};

export default UserCreatePage; 