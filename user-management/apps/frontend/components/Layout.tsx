import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getRoleBasedNavigation } from '../lib/hierarchyUtils';

// ===================== Layout Component =====================
// This component provides the sidebar, navbar, footer, and main content wrapper
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  
  // -------- Sidebar Section Expand/Collapse State --------
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  // -------- User State --------
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarLinks, setSidebarLinks] = useState<any>({});

  // -------- Toggle Sidebar Section --------
  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  // -------- Sync Sidebar State on Mount --------
  useEffect(() => {
    const isCollapsed = document.body.classList.contains('sidebar-collapse');
    setSidebarCollapsed(isCollapsed);
  }, []);

  // -------- Get User Data and Role-Based Navigation on Mount --------
  useEffect(() => {
    const getUserData = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.valid && data.user) {
          setUser(data.user);
          
          // Get role-based navigation
          const navigation = getRoleBasedNavigation(data.user.role);
          setSidebarLinks(navigation);
          
          // Expand all sections by default
          setExpandedSections(new Set(Object.keys(navigation)));
        } else {
          // Don't redirect here, let individual pages handle session validation
          // Session invalid in Layout, but not redirecting
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    getUserData();
  }, []);

  // -------- Handle Navigation State --------
  useEffect(() => {
    const handleRouteChangeStart = () => {
      // Save current scroll position
      sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    };

    const handleRouteChangeComplete = () => {
      // Restore scroll position after a short delay
      const preventScrollReset = () => {
        const savedPosition = sessionStorage.getItem('scrollPosition');
        if (savedPosition) {
          window.scrollTo(0, parseInt(savedPosition));
          sessionStorage.removeItem('scrollPosition');
        }
      };
      
      setTimeout(preventScrollReset, 5);
      
      // Restore navbar state
      const savedNavbarState = sessionStorage.getItem('navbarState');
      if (savedNavbarState) {
        const state = JSON.parse(savedNavbarState);
        if (state.sidebarCollapsed) {
          document.body.classList.add('sidebar-collapse');
          setSidebarCollapsed(true);
        } else {
          document.body.classList.remove('sidebar-collapse');
          setSidebarCollapsed(false);
        }
      }
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router]);

  // -------- Sidebar State --------
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Initialize based on current body class
    if (typeof window !== 'undefined') {
      return document.body.classList.contains('sidebar-collapse');
    }
    return false;
  });

  // -------- Sidebar Toggle Handler --------
  const toggleSidebar = () => {
    const body = document.body;
    const newCollapsedState = !sidebarCollapsed;
    
    if (newCollapsedState) {
      body.classList.add('sidebar-collapse');
    } else {
      body.classList.remove('sidebar-collapse');
    }
    
    setSidebarCollapsed(newCollapsedState);
  };

  // -------- Scroll to Top Function --------
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // -------- Mobile Sidebar State --------
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // -------- Profile Dropdown State --------
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // -------- Handle Mobile Detection --------
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // -------- Close Mobile Sidebar on Route Change --------
  useEffect(() => {
    if (isMobile) setMobileSidebarOpen(false);
    // eslint-disable-next-line
  }, [router.asPath]);

  // -------- Close Profile Dropdown on Click Outside --------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu')) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  return (
    <div className="hold-transition sidebar-mini">
      <div className="wrapper">
        {/* ===================== Navbar ===================== */}
                 <nav 
           id="fixed-navbar"
           className="main-header navbar navbar-expand navbar-white navbar-light" 
           style={{ 
             position: 'fixed', 
             top: 0,
             left: isMobile ? 0 : (sidebarCollapsed ? 0 : 250),
             width: isMobile ? '100%' : (sidebarCollapsed ? '100%' : 'calc(100% - 250px)'),
             zIndex: 1030,
             minHeight: '64px',
             height: '64px',
             transition: 'left 0.5s cubic-bezier(.4,0,.2,1), width 0.3s cubic-bezier(.4,0,.2,1)',
             backgroundColor: '#673ab7',
             color: '#fff',
             boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
             marginTop: 0,
             marginBottom: 0,
             transform: 'none',
             willChange: 'auto',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'space-between',
                           paddingLeft: 0,
              paddingRight: 0,
             boxSizing: 'border-box',
           }}
         >
          {/* Left navbar links */}
          <ul className="navbar-nav">
            <li className="nav-item">
              <div
                style={{
                  position: 'fixed', // changed from absolute to fixed for flush alignment
                  top: 0,
                  left: isMobile ? 0 : (sidebarCollapsed ? 0 : 255), // 250px sidebar - 5px
                  height: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'left 0.3s cubic-bezier(.4,0,.2,1)',
                  zIndex: 1100,
                }}
              >
                <a className="nav-link" href="#" role="button" onClick={(e) => {
                  e.preventDefault();
                  if (isMobile) {
                    setMobileSidebarOpen(true);
                  } else {
                    toggleSidebar();
                  }
                }} style={{ 
                  minWidth: '40px',
                  height: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  margin: 0,
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                }}>
                  <i className="fas fa-bars" style={{ fontSize: 24, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}></i>
                </a>
              </div>
            </li>
          </ul>

                     {/* Right navbar links */}
                       <ul className="navbar-nav ml-auto">
              <li className="nav-item dropdown user-menu">
                <a href="#" className="nav-link dropdown-toggle" onClick={(e) => {
                  e.preventDefault();
                  setProfileDropdownOpen(!profileDropdownOpen);
                }} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '0 0 0 15px',
                  color: '#808080',
                  textDecoration: 'none',
                  marginRight: '0',
                  cursor: 'pointer'
                }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#007bff',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                  textTransform: 'uppercase',
                }}>
                  {((user?.name || user?.username || '')
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .substring(0, 2)) || 'U'}
                </div>
                <span style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontWeight: 600,
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                }} className="d-none d-md-inline">{user?.name || user?.username || 'User'}</span>
              </a>
                             {profileDropdownOpen && (
                 <ul className="dropdown-menu dropdown-menu-lg dropdown-menu-right" style={{ 
                   minWidth: 260, 
                   padding: 0, 
                   borderRadius: 12, 
                   boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                   position: 'absolute',
                   top: '100%',
                   right: 0,
                   zIndex: 1000,
                   display: 'block'
                 }}>
                <li className="user-header" style={{ background: '#e0e0e0', color: '#222', borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 15, textAlign: 'center' }}>
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      background: '#007bff',
                      color: '#fff',
                      fontSize: 32,
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px auto',
                      textTransform: 'uppercase',
                    }}
                  >
                    {((user?.name || user?.username || '')
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .substring(0, 2)) || 'U'}
                  </div>
                                     <div style={{ fontSize: 13, color: '#555', marginBottom: 2 }}>Name: {user?.name || user?.username || '-'}</div>
                  <div style={{ fontSize: 13, color: '#555', marginBottom: 2 }}>ID: {user?.username || user?.id || '-'}</div>
                  <div style={{ fontSize: 13, color: '#555' }}>Role: {user?.role || '-'}</div>
                </li>
                <li className="user-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: 16, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, background: '#fff' }}>
                  <Link href="/profile" className="btn btn-default btn-flat" style={{ width: '48%' }}>Profile</Link>
                                     <a href="#" className="btn btn-default btn-flat float-right" style={{ width: '48%' }}
                     onClick={async (e) => {
                       e.preventDefault();
                       try {
                         await fetch('/api/auth/logout', { method: 'POST' });
                         router.push('/login');
                       } catch (error) {
                         console.error('Logout error:', error);
                         router.push('/login');
                       }
                     }}>
                     Sign out
                   </a>
                 </li>
               </ul>
               )}
            </li>
          </ul>
        </nav>

        {/* ===================== Sidebar ===================== */}
        {isMobile ? (
          mobileSidebarOpen && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 1031,
              margin: 0,
              padding: 0,
              pointerEvents: 'auto',
            }}>
              {/* Sidebar */}
              <aside
                className="main-sidebar sidebar-light-indigo elevation-4"
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  margin: 0,
                  padding: 0,
                  height: '100vh',
                  display: 'flex',
                  flexDirection: 'column',
                  width: '80vw',
                  maxWidth: '100vw',
                  minWidth: 0,
                  background: '#fff',
                  boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
                  transition: 'left 0.4s cubic-bezier(.4,0,.2,1)',
                  boxSizing: 'border-box',
                }}
              >
                {/* Brand Logo */}
                <Link href="/" className="brand-link bg-indigo text-white" style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 15px',
                  height: '60px',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  flexShrink: 0
                }}>
                  <img 
                    src="https://adminlte.io/themes/v3/dist/img/AdminLTELogo.png" 
                    alt="AdminLTE Logo"
                    className="brand-image img-circle elevation-3" 
                    style={{ opacity: '.8', marginRight: '10px' }}
                  />
                  <span className="brand-text font-weight-light" id="brandName">BETX</span>
                </Link>
                {/* Sidebar Navigation Menu */}
                <div className="sidebar" style={{ marginTop: '0', flex: 1, overflowY: 'auto', marginLeft: 0, paddingLeft: 0 }}>
                  <nav>
                    <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
                      {Object.entries(sidebarLinks).map(([section, links]) => {
                        const isExpanded = expandedSections.has(section);
                        return (
                          <React.Fragment key={section}>
                            <li className="nav-header" style={{ cursor: 'pointer' }} onClick={() => toggleSection(section)}>
                              {section}
                              <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} float-right`} style={{ fontSize: '12px', marginTop: '3px' }}></i>
                            </li>
                            {isExpanded && (links as any[]).map((link: any) => (
                              <li className="nav-item" key={link.label}>
                                <Link href={link.href} className={`nav-link ${router.pathname === link.href ? 'active' : ''}`} style={{ padding: '8px 15px', fontSize: '13px' }}
                                  onClick={() => setMobileSidebarOpen(false)}
                                >
                                  <i className={`nav-icon ${link.icon}`} style={{ fontSize: '12px', marginRight: '8px' }}></i>
                                  <p style={{ margin: '0', fontSize: '13px' }}>{link.label}</p>
                                </Link>
                              </li>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </ul>
                  </nav>
                </div>
              </aside>
              {/* Overlay */}
              <div
                onClick={() => setMobileSidebarOpen(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  background: 'rgba(0,0,0,0.5)',
                  zIndex: 1030,
                  margin: 0,
                  padding: 0,
                }}
              />
            </div>
          )
        ) : (
          // Desktop/Tablet Sidebar
          <aside
            className="main-sidebar sidebar-light-indigo elevation-4"
            style={{
              position: 'fixed',
              top: 0,
              left: sidebarCollapsed ? '-250px' : 0,
              height: '100vh',
              zIndex: 1031,
              display: 'flex',
              flexDirection: 'column',
              width: '250px',
              maxWidth: '100vw',
              minWidth: '250px',
              background: '#fff',
              boxShadow: undefined,
              transition: 'left 0.4s cubic-bezier(.4,0,.2,1)',
              boxSizing: 'border-box',
              marginLeft: 0,
              paddingLeft: 0,
            }}
          >
            {/* Brand Logo */}
            <Link href="/" className="brand-link bg-indigo text-white" style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 15px',
              height: '60px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              flexShrink: 0
            }}>
              <img 
                src="https://adminlte.io/themes/v3/dist/img/AdminLTELogo.png" 
                alt="AdminLTE Logo"
                className="brand-image img-circle elevation-3" 
                style={{ opacity: '.8', marginRight: '10px' }}
              />
              <span className="brand-text font-weight-light" id="brandName">BETX</span>
            </Link>
            {/* Sidebar Navigation Menu */}
            <div className="sidebar" style={{ marginTop: '0', flex: 1, overflowY: 'auto', marginLeft: 0, paddingLeft: 0 }}>
              <nav>
                <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
                  {Object.entries(sidebarLinks).map(([section, links]) => {
                    const isExpanded = expandedSections.has(section);
                    return (
                      <React.Fragment key={section}>
                        <li className="nav-header" style={{ cursor: 'pointer' }} onClick={() => toggleSection(section)}>
                          {section}
                          <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} float-right`} style={{ fontSize: '12px', marginTop: '3px' }}></i>
                        </li>
                        {isExpanded && (links as any[]).map((link: any) => (
                          <li className="nav-item" key={link.label}>
                            <Link href={link.href} className={`nav-link ${router.pathname === link.href ? 'active' : ''}`} style={{ padding: '8px 15px', fontSize: '13px' }}>
                              <i className={`nav-icon ${link.icon}`} style={{ fontSize: '12px', marginRight: '8px' }}></i>
                              <p style={{ margin: '0', fontSize: '13px' }}>{link.label}</p>
                            </Link>
                          </li>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </aside>
        )}

                 {/* ===================== Main Content Wrapper ===================== */}
         <div className="content-wrapper" style={{
           marginTop: '64px',
           width: isMobile ? '100%' : (sidebarCollapsed ? '100%' : 'calc(100% - 250px)'),
           marginLeft: isMobile ? '0' : (sidebarCollapsed ? '0' : '250px'),
           minHeight: 'calc(100vh - 64px)',
           transition: 'margin-left 0.3s ease-in-out, width 0.3s ease-in-out',
           padding: '2px',
           boxSizing: 'border-box',
           overflowX: 'hidden',
           maxWidth: '100%',
           display: 'flex',
           flexDirection: 'column',
           alignItems: 'stretch',
         }}>
          {/* This is where the page content is rendered */}
          {children}
        </div>

        {/* ===================== Footer ===================== */}
        <footer className="main-footer">
          <strong>Copyright &copy; 2025 <a href="#" id="siteName">BETX.com</a>.</strong>
          All rights reserved.
          <div className="float-right d-none d-sm-inline-block">
            <b>Version</b> 2.0.2
          </div>
        </footer>

        {/* ===================== Control Sidebar (optional) ===================== */}
        <aside className="control-sidebar control-sidebar-dark">
          {/* Control sidebar content goes here */}
        </aside>

        {/* ===================== Scroll to Top Button ===================== */}
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
};

export function BackArrow() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn btn-link d-block d-sm-none p-0 mr-2"
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: '#f0f0f0',
        border: '1px solid #007bff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '1.7rem',
        lineHeight: 1,
        color: '#007bff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      }}
      onClick={() => router.back()}
      aria-label="Back"
    >
      <i className="fas fa-arrow-circle-left"></i>
    </button>
  );
}

export default Layout; 