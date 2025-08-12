import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch('/api/auth/profile');
        const data = await res.json();
        
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          router.replace('/login');
          return;
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  if (loading) {
    return (
      <Layout>
        <div className="content-wrapper">
          <div className="text-center" style={{ padding: '50px' }}>
            <i className="fas fa-spinner fa-spin fa-2x"></i>
            <p>Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="content-wrapper">
          <div className="alert alert-danger m-3">
            {error}
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>Profile</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/fontawesome-free/css/all.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/datatables-responsive/css/responsive.bootstrap4.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/dist/css/adminlte.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/overlayScrollbars/css/OverlayScrollbars.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/sweetalert2-theme-bootstrap-4/bootstrap-4.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/toastr/toastr.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/select2/css/select2.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/daterangepicker/daterangepicker.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/tempusdominus-bootstrap-4/css/tempusdominus-bootstrap-4.min.css" />
      </Head>

        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1>Profile</h1>
              </div>
              <div className="col-sm-6">
                <ol className="breadcrumb float-sm-right">
                  <li className="breadcrumb-item"><a href="/">Home</a></li>
                  <li className="breadcrumb-item active">Profile</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-lg-4">
                {/* Profile Image */}
                <div className="card card-primary card-outline">
                  <div className="card-body box-profile">
                    <div className="text-center">
                      {user.profileImage ? (
                        <img
                          className="profile-user-img img-fluid img-circle"
                          src={user.profileImage}
                          alt="User profile picture"
                        />
                      ) : (
                        <div
                          className="profile-user-img img-fluid img-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: 128,
                            height: 128,
                            background: '#007bff',
                            color: '#fff',
                            fontSize: 48,
                            fontWeight: 'bold',
                            margin: '0 auto',
                            textTransform: 'uppercase',
                          }}
                        >
                          {((user.name || user.username || '')
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .substring(0, 2)) || 'U'}
                        </div>
                      )}
                    </div>

                    <h3 className="profile-username text-center">
                      {user.username} {user.name}
                    </h3>

                    <p className="text-muted text-center">
                      {user.role === 'BOSS' && 'Boss'}
                      {user.role === 'MASTER' && 'Master Agent'}
                      {user.role === 'SUPER_AGENT' && 'Super Agent'}
                      {user.role === 'AGENT' && 'Agent'}
                      {user.role === 'SUB' && 'Sub Agent'}
                      {user.role === 'USER' && 'Client'}
                    </p>

                    <ul className="list-group list-group-unbordered mb-3">
                      <li className="list-group-item">
                        <b>Share</b> <a className="float-right">{user.userCommissionShare?.share || 0}%</a>
                      </li>
                      <li className="list-group-item">
                        <b>Match Commission</b> <a className="float-right">{user.userCommissionShare?.matchcommission || 0}%</a>
                      </li>
                      <li className="list-group-item">
                        <b>Session Commission</b> <a className="float-right">{user.userCommissionShare?.sessioncommission || 0}%</a>
                      </li>
                      <li className="list-group-item">
                        <b>Mobile Share</b> <a className="float-right">{user.mobileshare || 0}%</a>
                      </li>
                    </ul>

                    <a href="/changePassword" className="btn btn-primary btn-block">
                      <b>Change Password</b>
                    </a>
                  </div>
                </div>
              </div>

              {/* About Me Box */}
              <div className="col-lg-4">
                <div className="card card-primary">
                  <div className="card-header">
                    <h3 className="card-title">About Me</h3>
                  </div>
                  <div className="card-body">
                    <strong><i className="fas fa-id-card"></i> Profile</strong>
                    <p className="text-muted">{user.username} {user.name}</p>

                    <hr />

                    <strong><i className="fas fa-coins"></i> Current Limit</strong>
                    <p className="text-muted">{user.creditLimit?.toLocaleString() || '0'}</p>

                    <hr />

                    <strong><i className="fas fa-pencil-alt mr-1"></i> Contact No</strong>
                    <p className="text-muted">
                      <span className="tag tag-danger">{user.contactno || 'N/A'}</span>
                    </p>

                    <hr />

                    <strong><i className="far fa-file-alt mr-1"></i> Date Of Joining</strong>
                    <p className="text-muted">
                      {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
                    </p>

                    <hr />

                    <strong><i className="fas fa-code"></i> User Code</strong>
                    <p className="text-muted">{user.code || 'N/A'}</p>

                    <hr />

                    <strong><i className="fas fa-link"></i> Reference</strong>
                    <p className="text-muted">{user.reference || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="col-lg-4">
                <div className="card card-info">
                  <div className="card-header">
                    <h3 className="card-title">Commission Details</h3>
                  </div>
                  <div className="card-body">
                    <strong><i className="fas fa-chart-pie"></i> Commission Type</strong>
                    <p className="text-muted">{user.userCommissionShare?.session_commission_type || 'No Comm'}</p>

                    <hr />

                    <strong><i className="fas fa-percentage"></i> Casino Commission</strong>
                    <p className="text-muted">{user.userCommissionShare?.casinocommission || 0}%</p>

                    <hr />

                    <strong><i className="fas fa-share-alt"></i> Casino Share</strong>
                    <p className="text-muted">{user.userCommissionShare?.cshare || 0}%</p>

                    <hr />

                    <strong><i className="fas fa-gamepad"></i> Int. Casino Share</strong>
                    <p className="text-muted">{user.userCommissionShare?.icshare || 0}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

    </Layout>
  );
} 