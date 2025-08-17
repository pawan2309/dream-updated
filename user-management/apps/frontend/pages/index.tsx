// ===================== Imports =====================
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { GetServerSideProps } from 'next';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { requireAuth } from '../lib/requireAuth';
import { useRouter } from 'next/router';
import { getRoleBasedNavigation } from '../lib/hierarchyUtils';

// Removed server-side auth check to prevent redirect loops
export const getServerSideProps = async () => {
  return { props: {} };
};

// ===================== Main Homepage Component =====================
const IndexPage = () => {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    setIsLoading(false);
  }, []);

  // Show loading state during SSR and initial client render
  if (!isClient || isLoading) {
    return (
      <Layout>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          fontSize: '18px',
          color: '#666'
        }}>
          Loading...
        </div>
      </Layout>
    );
  }

  return <ClientIndexPage />;
};

// Separate client-side component that uses hooks
const ClientIndexPage = () => {
  console.log('🔵 IndexPage component rendering - Client side');
  const router = useRouter();
  
  // -------- State Definitions --------
  const [siteName, setSiteName] = useState(''); // Site hostname
  const [brandName, setBrandName] = useState(''); // Brand name for header
  const [user, setUser] = useState<any>(null); // User info
  const [isLoading, setIsLoading] = useState(true); // Loading spinner
  const [sidebarLinks, setSidebarLinks] = useState<any>({}); // Sidebar navigation links
  const [modalContent, setModalContent] = useState<React.ReactNode>(null); // Content for modal popups
  const [showModal, setShowModal] = useState(false); // Modal visibility

  // -------- Set Site Name and Brand on Mount --------
  useEffect(() => {
    const hostname = window.location.hostname;
    const site = hostname.split('.')[1]?.toUpperCase() || 'SITE';
    setSiteName(hostname);
    setBrandName(site);
    document.title = site;
  }, []);

  // -------- Get User Data from Session --------
  useEffect(() => {
    const getUserData = async () => {
      console.log('Index page: Fetching user data...');
      try {
        const res = await fetch('/api/auth/session');
        console.log('Session API response status:', res.status);
        const data = await res.json();
        console.log('Session API response data:', data);
        if (data.valid && data.user) {
          console.log('Session valid, setting user data');
          setUser(data.user);
          
          // Get role-based navigation
          const navigation = getRoleBasedNavigation(data.user.role);
          setSidebarLinks(navigation);
        } else {
          console.log('Session invalid, but middleware should have handled this');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    getUserData();
  }, []);

  // -------- Logout Handler --------
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/login');
    }
  };

  // -------- Modal Logic for Dashboard Cards --------
  const showModel = (key: string) => {
    const items = sidebarLinks[key] || [];
    const content = items.map((item: any, i: number) => (
      <div className="col-lg-6 col-12" key={item.href}>
        <div 
          className="small-box bg-primary"
          style={{ cursor: 'pointer' }}
          onClick={() => handleItemClick(item.href, item.label)}
        >
          <div className="inner" style={{ padding: 12 }}>
            <h3>{i + 1}</h3>
            <p>{item.label}</p>
          </div>
          <div className="icon">
            <i className={`${item.icon}`}></i>
          </div>
          <span className="small-box-footer">More Info <i className="fas fa-arrow-circle-right"></i></span>
        </div>
      </div>
    ));
    setModalContent(content);
    setShowModal(true);
  };

  // -------- Handle Navigation --------
  const handleItemClick = (href: string, label: string) => {
    // Navigate to the selected page
    window.location.href = href;
  };

  // -------- Show Loading While Fetching User Data --------
  if (isLoading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  // ===================== Main Render =====================
  return (
    <Layout>
      <Head>
        <title>{brandName || 'Load'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      
      <section className="content" style={{ paddingTop: '20px' }}>
        <div className="container-fluid">
         
          <div className="row">
            <div className="col-lg-3 col-6" onClick={() => showModel('USER DETAILS')}>
              <div className="small-box bg-primary" style={{ cursor: 'pointer' }}>
                <div className="inner">
                  <h3>1</h3>
                  <p>User Details</p>
                </div>
                <div className="icon">
                  <i className="fas fa-users"></i>
                </div>
                <span className="small-box-footer">More Info <i className="fas fa-arrow-circle-right"></i></span>
              </div>
            </div>
            <div className="col-lg-3 col-6" onClick={() => showModel('GAMES')}>
              <div className="small-box bg-success" style={{ cursor: 'pointer' }}>
                <div className="inner">
                  <h3>2</h3>
                  <p>Games Details</p>
                </div>
                <div className="icon">
                  <i className="fas fa-gamepad"></i>
                </div>
                <span className="small-box-footer">More Info <i className="fas fa-arrow-circle-right"></i></span>
              </div>
            </div>
            <div className="col-lg-3 col-6" onClick={() => showModel('CASH TRANSACTION')}>
              <div className="small-box bg-warning" style={{ cursor: 'pointer' }}>
                <div className="inner">
                  <h3>3</h3>
                  <p>Cash Transaction</p>
                </div>
                <div className="icon">
                  <i className="fas fa-money-bill-wave"></i>
                </div>
                <span className="small-box-footer">More Info <i className="fas fa-arrow-circle-right"></i></span>
              </div>
            </div>
            <div className="col-lg-3 col-6" onClick={() => showModel('LEDGER')}>
              <div className="small-box bg-danger" style={{ cursor: 'pointer' }}>
                <div className="inner">
                  <h3>4</h3>
                  <p>Ledger Details</p>
                </div>
                <div className="icon">
                  <i className="fas fa-book"></i>
                </div>
                <span className="small-box-footer">More Info <i className="fas fa-arrow-circle-right"></i></span>
              </div>
            </div>
          </div>
          {/* Modal Section */}
          {showModal && (
            <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ background: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Details</h5>
                    <button type="button" className="close" onClick={() => setShowModal(false)}>
                      <span>&times;</span>
                    </button>
                  </div>
                  <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <div className="row">
                      {modalContent}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default IndexPage; 