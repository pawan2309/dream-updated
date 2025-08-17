import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

const SESSION_COOKIE = 'betx_session';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [siteName, setSiteName] = useState('SITE');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Set site name on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const site = hostname.split('.')[1]?.toUpperCase() || 'SITE';
      setSiteName(site);
      document.title = site;
      const titleBox = document.getElementById('titleBox');
      if (titleBox) {
        titleBox.innerHTML = `<a href=\"#\"> </b>BetX Boss Admin</a>`;
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Login form submitted with username:', username);
    console.log('🔍 Form event:', e);
    console.log('📝 Username:', username);
    console.log('🔒 Password length:', password.length);
    
    setError('');
    setLoading(true);
    
    try {
      console.log('📡 About to send fetch to /api/auth/login');
      const requestBody = JSON.stringify({ username, password });
      console.log('📦 Request body:', requestBody);
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody
      });
      
      console.log('📥 Response received, status:', res.status);
      console.log('📥 Response headers:', res.headers);
      
      const data = await res.json();
      console.log('📄 Response data:', data);
      
      if (!data.success && data.message === 'Contact admin') {
        console.log('❌ Login failed: Contact admin');
        setError('Contact admin');
      } else if (!data.success && data.message === 'Password wrong') {
        console.log('❌ Login failed: Password wrong');
        setError('Password wrong');
      } else if (data.success) {
        console.log('✅ Login successful');
        setError('');
        
        // Check if user is OWNER and redirect to operating panel
        if (data.user && data.user.role === 'OWNER') {
          console.log('👑 OWNER detected, redirecting to operating panel');
          // Redirect to operating panel (adjust port as needed)
          window.location.href = 'http://localhost:3001'; // Change this port if needed
        } else {
          console.log('👤 Regular user, redirecting to main dashboard');
          // Use router.push for client-side navigation
          router.push('/');
        }
      } else {
        console.log('❌ Login failed: Unknown error');
        setError('Unknown error.');
      }
    } catch (err) {
      console.error('💥 Login error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{siteName}</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="_csrf" content="4c1e546e-781f-4a8f-9f6a-1f695a383a1e" />
        <meta name="_csrf_header" content="X-CSRF-TOKEN" />
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback" />
        <link rel="stylesheet" type="text/css" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/fontawesome-free/css/all.min.css" />
        <link rel="stylesheet" type="text/css" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/icheck-bootstrap/icheck-bootstrap.min.css" />
        <link rel="stylesheet" type="text/css" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/dist/css/adminlte.min.css" />
      </Head>
      <div className="hold-transition login-page" style={{ minHeight: '100vh' }}>
        <div className="login-box">
          <div className="login-logo" id="titleBox">
            {/* Site name will be set by useEffect */}
          </div>
          <div className="card">
            <div className="card-body login-card-body">
              <p className="login-box-msg">Sign in to start your session</p>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <form autoComplete="off" onSubmit={handleSubmit}>
                <input type="hidden" name="_csrf" value="4c1e546e-781f-4a8f-9f6a-1f695a383a1e" />
                <div className="input-group mb-3 margin-top">
                  <input
                    type="text"
                    className="form-control"
                    autoComplete="username"
                    placeholder="username"
                    autoFocus
                    required
                    id="username"
                    name="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                  <div className="input-group-append">
                    <div className="input-group-text">
                      <span className="fas fa-envelope"></span>
                    </div>
                  </div>
                </div>
                <div className="input-group mb-3">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="password"
                    required
                    id="password"
                    name="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <div className="input-group-append" style={{ cursor: 'pointer' }} onClick={() => setShowPassword(!showPassword)}>
                    <div className="input-group-text">
                      <span className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'} title={showPassword ? 'Hide password' : 'Show password'}></span>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-8">
                    <div className="icheck-primary">
                      <input
                        type="checkbox"
                        id="remember_me"
                        name="remember_me"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                      />
                      <label htmlFor="remember_me">
                        Remember Me
                      </label>
                    </div>
                  </div>
                </div>
                <div className="social-auth-links text-center mb-3">
                  <button
                    type="submit"
                    name="submit"
                    className="form-control btn btn-info btn-block"
                    disabled={loading}
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage; 