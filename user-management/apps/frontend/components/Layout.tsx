import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getRoleBasedNavigation } from '../lib/hierarchyUtils';
import ErrorBoundary from './ErrorBoundary';
import EnhancedLoadingWrapper from './EnhancedLoadingWrapper';

// Custom styles to override Bootstrap navbar defaults
const navbarStyles = `
  #fixed-navbar {
    background-color: #023E8A !important;
    color: #CAF0F8 !important;
  }
  #fixed-navbar.navbar {
    background-color: #023E8A !important;
    color: #CAF0F8 !important;
  }
  #fixed-navbar.navbar-white {
    background-color: #023E8A !important;
    color: #CAF0F8 !important;
  }
  #fixed-navbar.navbar-light {
    background-color: #023E8A !important;
    color: #CAF0F8 !important;
  }
  .main-header.navbar {
    background-color: #023E8A !important;
    color: #CAF0F8 !important;
  }
  .navbar-white {
    background-color: #023E8A !important;
    color: #CAF0F8 !important;
  }
  .navbar-light {
    background-color: #023E8A !important;
    color: #CAF0F8 !important;
  }
  /* Force navbar background override */
  nav#fixed-navbar {
    background-color: #023E8A !important;
    color: #CAF0F8 !important;
  }
  /* Override any Bootstrap navbar classes */
  .navbar {
    background-color: #023E8A !important;
    color: #CAF0F8 !important;
  }
  /* Sidebar heading styles */
  .nav-header {
    background-color: #023E8A !important;
    color: #CAF0F8 !important;
    border-bottom: 2px solid rgba(202,240,248,0.3) !important;
  }
  .main-sidebar .nav-header {
    background-color: #023E8A !important;
    color: #CAF0F8 !important;
  }
  .sidebar .nav-header {
    background-color: #023E8A !important;
    color: #CAF0F8 !important;
  }
  /* Force sidebar heading colors */
  li.nav-header {
    background-color: #023E8A !important;
    color: #CAF0F8 !important;
  }
  .nav-sidebar .nav-header {
    background-color: #023E8A !important;
    color: #CAF0F8 !important;
  }
  /* Override any AdminLTE or Bootstrap sidebar styles */
  .main-sidebar li.nav-header,
  .sidebar li.nav-header,
  .nav-sidebar li.nav-header {
    background-color: #023E8A !important;
    color: #CAF0F8 !important;
    border-bottom: 2px solid rgba(202,240,248,0.3) !important;
  }
`;

// ===================== Layout Component =====================
// This component provides the sidebar, navbar, footer, and main content wrapper
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isClient, setIsClient] = useState(false);
  const [isLayoutLoading, setIsLayoutLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    setIsLayoutLoading(false);
  }, []);

  // Show loading state during SSR and initial client render
  if (!isClient || isLayoutLoading) {
    return (
      <div className="hold-transition sidebar-mini">
        <div className="wrapper">
          <div className="content-wrapper" style={{
            marginTop: '64px',
            marginLeft: '250px',
            minHeight: 'calc(100vh - 64px)',
            padding: '2px',
            boxSizing: 'border-box',
          }}>
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
          </div>
        </div>
      </div>
    );
  }
  
  return <ClientLayout>{children}</ClientLayout>;
};

// Separate client-side component that uses hooks
const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  try {
    console.log('🔵 Layout component rendering - Client side');
    const router = useRouter();
  
    // -------- All State Declarations (must come first) --------
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
    const [isLayoutLoading, setIsLayoutLoading] = useState(true);
  const [sidebarLinks, setSidebarLinks] = useState<any>({});
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
      // Initialize as closed by default
      if (typeof document !== 'undefined') {
        // Check localStorage for saved state, default to true (closed)
        const savedState = localStorage.getItem('sidebarCollapsed');
        const isCollapsed = savedState !== null ? JSON.parse(savedState) : true;
        return isCollapsed;
      }
      return true; // Default to closed
    });
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // -------- Toggle Sidebar Section --------
  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
        
        // Save expanded sections to localStorage
        localStorage.setItem('expandedSections', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  // -------- Sync Sidebar State on Mount --------
  useEffect(() => {
    if (typeof document !== 'undefined') {
        // Check localStorage for saved state, default to true (closed)
        const savedState = localStorage.getItem('sidebarCollapsed');
        const isCollapsed = savedState !== null ? JSON.parse(savedState) : true;
      setSidebarCollapsed(isCollapsed);
        
        // Apply the state to body class
        if (isCollapsed) {
          document.body.classList.add('sidebar-collapse');
        } else {
          document.body.classList.remove('sidebar-collapse');
        }
        
        // Load expanded sections from localStorage
        const savedExpandedSections = localStorage.getItem('expandedSections');
        if (savedExpandedSections) {
          try {
            const expandedArray = JSON.parse(savedExpandedSections);
            if (Array.isArray(expandedArray)) {
              setExpandedSections(new Set(expandedArray));
            }
          } catch (error) {
            console.warn('Failed to load expanded sections:', error);
          }
        }
    }
  }, []);

  // -------- Get User Data and Role-Based Navigation on Mount --------
  useEffect(() => {
    console.log('🔵 Layout useEffect - getUserData started');
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('🔴 getUserData timeout - setting fallback navigation');
        setIsLayoutLoading(false);
        setSidebarLinks({
          'USER DETAILS': [
            { label: 'Navigation Timeout', href: '#', icon: 'fas fa-clock', role: 'USER' }
          ]
        });
      }, 10000); // 10 second timeout
      
    const getUserData = async () => {
      try {
        console.log('🔵 Fetching user session data...');
                  const res = await fetch('/api/auth/session', {
          credentials: 'include'
        });
        const data = await res.json();
        console.log('🔵 Session response:', data);
        
        if (data.valid && data.user) {
          console.log('🔵 User data received:', data.user);
          setUser(data.user);
          
          // Get role-based navigation
          console.log('🔵 Getting navigation for role:', data.user.role);
          const navigation = getRoleBasedNavigation(data.user.role);
          console.log('🔵 Navigation result:', navigation);
            console.log('🔵 Navigation keys:', Object.keys(navigation));
            console.log('🔵 Navigation length:', Object.keys(navigation).length);
            
            if (Object.keys(navigation).length === 0) {
              console.warn('🔴 No navigation items found for role:', data.user.role);
              // Set a default navigation to prevent loading state
              setSidebarLinks({
                'USER DETAILS': [
                  { label: 'Loading...', href: '#', icon: 'fas fa-spinner fa-spin', role: 'USER' }
                ]
              });
            } else {
          setSidebarLinks(navigation);
            }
          
            // Expand all sections by default (only if no saved state exists)
          const sections = Object.keys(navigation);
          console.log('🔵 Expanding sections:', sections);
            
            // Check if we have saved expanded sections, otherwise expand all
            const savedExpandedSections = localStorage.getItem('expandedSections');
            if (savedExpandedSections) {
              try {
                const expandedArray = JSON.parse(savedExpandedSections);
                if (Array.isArray(expandedArray)) {
                  setExpandedSections(new Set(expandedArray));
                } else {
          setExpandedSections(new Set(sections));
                }
              } catch (error) {
                console.warn('Failed to load expanded sections, expanding all:', error);
                setExpandedSections(new Set(sections));
              }
            } else {
              setExpandedSections(new Set(sections));
            }
        } else {
          console.log('🔵 Session invalid or no user data');
          // Don't redirect here, let individual pages handle session validation
          // Session invalid in Layout, but not redirecting
        }
      } catch (error) {
        console.error('🔴 Error fetching user data:', error);
          // Set default navigation on error to prevent infinite loading
          setSidebarLinks({
            'USER DETAILS': [
              { label: 'Error Loading Navigation', href: '#', icon: 'fas fa-exclamation-triangle', role: 'USER' }
            ]
          });
      } finally {
          console.log('🔵 Setting isLayoutLoading to false');
          setIsLayoutLoading(false);
          clearTimeout(timeoutId); // Clear timeout on success
      }
    };
    getUserData();
      
      // Cleanup function
      return () => {
        clearTimeout(timeoutId);
      };
  }, []);

  // -------- Handle Navigation State --------
  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;

    const handleRouteChangeStart = () => {
      // Save current scroll position
      sessionStorage.setItem('scrollPosition', window.scrollY.toString());
        
        // Save current sidebar state
        sessionStorage.setItem('sidebarState', JSON.stringify({
          collapsed: sidebarCollapsed,
          expandedSections: Array.from(expandedSections)
        }));

        // DO NOT set loading state here - let individual pages handle their own loading
        // setIsContentLoading(true); // REMOVED - causes layout refresh
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
      
        // Restore sidebar state
        const savedSidebarState = sessionStorage.getItem('sidebarState');
        if (savedSidebarState) {
          try {
            const state = JSON.parse(savedSidebarState);
            if (state.collapsed !== undefined && typeof document !== 'undefined') {
              if (state.collapsed) {
          document.body.classList.add('sidebar-collapse');
          setSidebarCollapsed(true);
              } else {
          document.body.classList.remove('sidebar-collapse');
          setSidebarCollapsed(false);
        }
      }
            
            if (state.expandedSections && Array.isArray(state.expandedSections)) {
              setExpandedSections(new Set(state.expandedSections));
            }
          } catch (error) {
            console.warn('Failed to restore sidebar state:', error);
          }
        }

        // DO NOT manage content loading here - let pages handle themselves
        // setTimeout(() => {
        //   setIsContentLoading(false);
        // }, 300); // REMOVED - causes layout refresh
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
    }, [router, sidebarCollapsed, expandedSections]);

             // -------- Sidebar Toggle Handler --------
           const toggleSidebar = () => {
             if (typeof document === 'undefined') return;

             const body = document.body;
             const newCollapsedState = !sidebarCollapsed;

             if (newCollapsedState) {
               body.classList.add('sidebar-collapse');
             } else {
               body.classList.remove('sidebar-collapse');
             }

             // Save state to localStorage
             localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsedState));
             setSidebarCollapsed(newCollapsedState);
           };

  // -------- Scroll to Top Function --------
  const scrollToTop = () => {
    if (typeof window === 'undefined') return;
    
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // -------- Handle Mobile Detection --------
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 992);
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
    if (typeof document === 'undefined') return;
    
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

  console.log('🔵 Layout: Rendering main layout');
  console.log('🔵 Current state:', {
    user: user ? { id: user.id, name: user.name, role: user.role } : null,
    sidebarLinks: sidebarLinks,
       sidebarLinksKeys: Object.keys(sidebarLinks),
       sidebarLinksLength: Object.keys(sidebarLinks).length,
    expandedSections: Array.from(expandedSections),
       isLayoutLoading,
    sidebarCollapsed,
    isMobile
  });

  return (
    <div className="hold-transition sidebar-mini">
        <style dangerouslySetInnerHTML={{ __html: navbarStyles }} />
      <div className="wrapper">
        {/* ===================== Navbar ===================== */}
                 <nav 
           id="fixed-navbar"
            className="main-header navbar navbar-expand"
           style={{ 
             position: 'fixed', 
             top: 0,
             left: (isMobile || isTablet) ? 0 : (sidebarCollapsed ? 0 : 250),
             width: (isMobile || isTablet) ? '100%' : (sidebarCollapsed ? '100%' : 'calc(100% - 250px)'),
             zIndex: 1030,
             minHeight: '64px',
             height: '64px',
             transition: 'left 0.5s cubic-bezier(.4,0,.2,1), width 0.3s cubic-bezier(.4,0,.2,1)',
              backgroundColor: '#023E8A !important',
              color: '#CAF0F8 !important',
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
              border: 'none',
              outline: 'none',
           }}
         >
          {/* Left navbar links */}
          <ul className="navbar-nav">
            <li className="nav-item">
              <div
                style={{
                    position: 'fixed',
                  top: 0,
                    left: (isMobile || isTablet) ? 0 : (sidebarCollapsed ? 0 : 255),
                  height: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'left 0.3s cubic-bezier(.4,0,.2,1)',
                  zIndex: 1100,
                }}
              >
                <a className="nav-link" href="#" role="button" onClick={(e) => {
                  e.preventDefault();
                  if (isMobile || isTablet) {
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
                  padding: '0 15px 0 15px',
                  color: '#808080',
                  textDecoration: 'none',
                  marginRight: '10px',
                  cursor: 'pointer'
                }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #CAF0F8 0%, #90E0EF 100%)',
                  color: '#03045E',
                  fontSize: 16,
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                  textTransform: 'uppercase',
                  boxShadow: '0 2px 8px rgba(202,240,248,0.3)',
                  border: '1px solid rgba(202,240,248,0.5)'
                }}>
                  {(() => {
                    const displayName = user?.name || user?.username || '';
                    if (!displayName) return 'U';
                    const initials = displayName.split(' ').map((n: string) => n[0]).join('');
                    return initials.substring(0, 2) || 'U';
                  })()}
                </div>
                                 <span style={{
                   whiteSpace: 'nowrap',
                   overflow: 'hidden',
                   textOverflow: 'ellipsis',
                   fontWeight: 600,
                   fontSize: 18,
                   display: 'flex',
                   alignItems: 'center',
                    }} className="d-none d-md-inline">
                      {isLayoutLoading ? 'Loading...' : (user ? (user.name || user.username || 'User') : 'User')}
                    </span>
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
                <li className="user-header" style={{ 
                  background: '#03045E', 
                  color: '#CAF0F8', 
                  borderTopLeftRadius: 12, 
                  borderTopRightRadius: 12, 
                  padding: '20px 20px 16px 20px', 
                  textAlign: 'center',
                  borderBottom: '2px solid rgba(202,240,248,0.3)'
                }}>
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #CAF0F8 0%, #90E0EF 100%)',
                      color: '#03045E',
                      fontSize: 32,
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px auto',
                      textTransform: 'uppercase',
                      boxShadow: '0 4px 12px rgba(202,240,248,0.3)',
                      border: '2px solid rgba(202,240,248,0.5)'
                    }}
                  >
                    {(() => {
                      const displayName = user?.name || user?.username || '';
                      if (!displayName) return 'U';
                      const initials = displayName.split(' ').map((n: string) => n[0]).join('');
                      return initials.substring(0, 2) || 'U';
                    })()}
                  </div>
                  <div style={{ 
                    fontSize: 13, 
                    color: '#CAF0F8', 
                    marginBottom: 6, 
                    fontWeight: '500',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                  }}>
                        Name: {isLayoutLoading ? 'Loading...' : (user ? (user.name || user.username || '-') : 'Loading...')}
                  </div>
                  <div style={{ 
                    fontSize: 13, 
                    color: '#CAF0F8', 
                    marginBottom: 6, 
                    fontWeight: '500',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                  }}>
                        ID: {isLayoutLoading ? 'Loading...' : (user ? (user.username || user.id || '-') : 'Loading...')}
                  </div>
                  <div style={{ 
                    fontSize: 12, 
                    color: '#CAF0F8', 
                    marginBottom: 4, 
                    fontWeight: '500',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                  }}>
                                                  Role: {isLayoutLoading ? 'Loading...' : (user ? (user.role || '-') : 'Loading...')}
                  </div>
                </li>
                <li className="user-footer" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '16px 20px', 
                  borderBottomLeftRadius: 12, 
                  borderBottomRightRadius: 12, 
                  background: '#03045E',
                  borderTop: '2px solid rgba(202,240,248,0.3)'
                }}>
                  <Link href="/profile" className="btn btn-default btn-flat" style={{ 
                    width: '48%',
                        background: 'linear-gradient(135deg, #CAF0F8 0%, #0077B6 100%)',
                    color: '#03045E',
                        border: '2px solid #0077B6',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    padding: '10px 15px',
                    transition: 'all 0.3s ease',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #0077B6 0%, #CAF0F8 100%)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,119,182,0.4)';
                  }}
                  onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #CAF0F8 0%, #0077B6 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                    Profile
                  </Link>
                  <a href="#" className="btn btn-default btn-flat float-right" style={{ 
                    width: '48%',
                        background: 'linear-gradient(135deg, #CAF0F8 0%, #0077B6 100%)',
                    color: '#03045E',
                        border: '2px solid #0077B6',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    padding: '10px 15px',
                    transition: 'all 0.3s ease',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #0077B6 0%, #CAF0F8 100%)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,119,182,0.4)';
                  }}
                  onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #CAF0F8 0%, #0077B6 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                                                    await fetch('/api/auth/logout', { 
                          method: 'POST',
                          credentials: 'include'
                        });
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
                  background: '#03045E',
                  boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
                  transition: 'left 0.4s cubic-bezier(.4,0,.2,1)',
                  boxSizing: 'border-box',
                }}
              >
                {/* Brand Logo */}
                <Link href="/" className="brand-link" style={{
                  display: 'flex',
                  alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 20px',
                  height: '80px',
                  borderBottom: '2px solid rgba(202,240,248,0.3)',
                  flexShrink: 0,
                  backgroundColor: '#03045E',
                  color: '#CAF0F8',
                  position: 'relative'
                }}>
                  <img 
                    src="/images/IMG_0813.PNG" 
                    alt="3X BAT Logo"
                    className="brand-image" 
                    style={{ 
                      marginRight: '20px',
                      width: '65px',
                      height: 'auto',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                    }}
                  />
                  <span 
                      className="brand-text font-weight-bold" 
                    id="brandName"
                    style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      color: '#CAF0F8',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.4)',
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                        lineHeight: '1.2'
                    }}
                  >
                    3X BAT
                  </span>
                </Link>
                {/* Sidebar Navigation Menu */}
                <div className="sidebar" style={{ marginTop: '0', flex: 1, overflowY: 'auto', marginLeft: 0, paddingLeft: 0 }}>
                  <nav>
                    <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
                                             {(() => {
                         console.log('🔵 Mobile sidebar: Rendering navigation, sidebarLinks:', sidebarLinks);
                         if (sidebarLinks && Object.keys(sidebarLinks).length > 0) {
                           console.log('🔵 Mobile sidebar: Rendering sections:', Object.keys(sidebarLinks));
                           return Object.entries(sidebarLinks).map(([section, links]) => {
                             const isExpanded = expandedSections.has(section);
                             console.log('🔵 Mobile sidebar: Rendering section:', section, 'expanded:', isExpanded, 'links:', links);
                             return (
                               <React.Fragment key={section}>
                                  <li className="nav-header" style={{ 
                                    cursor: 'pointer',
                                    padding: '15px 20px',
                                    color: '#CAF0F8',
                                    fontSize: '15px',
                                    fontWeight: '700',
                                    borderBottom: '2px solid rgba(202,240,248,0.3)',
                                    backgroundColor: '#023E8A',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                                  }} onClick={() => toggleSection(section)}>
                                   {section}
                                    <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} float-right`} style={{ 
                                      fontSize: '14px', 
                                      marginTop: '3px', 
                                      color: '#CAF0F8',
                                      transition: 'transform 0.2s ease'
                                    }}></i>
                                 </li>
                                 {isExpanded && Array.isArray(links) && links.map((link: any) => (
                                   <li className="nav-item" key={link.label}>
                                      <Link href={link.href} className={`nav-link ${router.pathname === link.href ? 'active' : ''}`} style={{ 
                                        padding: '10px 20px', 
                                        fontSize: '13px',
                                        color: '#CAF0F8',
                                        textDecoration: 'none',
                                        borderLeft: router.pathname === link.href ? '3px solid #0077B6' : '3px solid transparent',
                                        backgroundColor: router.pathname === link.href ? '#0077B6' : 'transparent',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer'
                                      }}
                                        onMouseEnter={(e) => {
                                          if (router.pathname !== link.href) {
                                            e.currentTarget.style.backgroundColor = '#023E8A';
                                            e.currentTarget.style.borderLeft = '3px solid #CAF0F8';
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (router.pathname !== link.href) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.borderLeft = '3px solid transparent';
                                          }
                                        }}
                                        onClick={() => {
                                          setMobileSidebarOpen(false);
                                          // Preserve sidebar state when navigating
                                          const currentState = localStorage.getItem('sidebarCollapsed');
                                          if (currentState !== null) {
                                            localStorage.setItem('sidebarCollapsed', currentState);
                                          }
                                        }}
                                      >
                                        <i className={`nav-icon ${link.icon}`} style={{ 
                                          fontSize: '14px', 
                                          marginRight: '10px',
                                          color: '#CAF0F8',
                                          width: '20px',
                                          textAlign: 'center'
                                        }}></i>
                                        <p style={{ 
                                          margin: '0', 
                                          fontSize: '13px',
                                          fontWeight: '500'
                                        }}>{link.label}</p>
                                     </Link>
                                   </li>
                                 ))}
                               </React.Fragment>
                             );
                           });
                         } else {
                           console.log('🔵 Mobile sidebar: No sidebarLinks, showing loading');
                           return (
                             <li className="nav-item">
                                 <div style={{ 
                                   padding: '15px', 
                                   textAlign: 'center', 
                                   color: '#CAF0F8',
                                   fontSize: '13px',
                                   fontStyle: 'italic'
                                 }}>
                                   {isLayoutLoading && Object.keys(sidebarLinks).length === 0 ? (
                                     <>
                                       <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                                 Loading navigation...
                                     </>
                                   ) : (
                                     <>
                                       <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px', color: '#ffc107' }}></i>
                                       Navigation not available
                                     </>
                                   )}
                               </div>
                             </li>
                           );
                         }
                       })()}
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
              left: (isTablet || sidebarCollapsed) ? '-250px' : 0,
              height: '100vh',
              zIndex: 1031,
              display: 'flex',
              flexDirection: 'column',
              width: '250px',
              maxWidth: '100vw',
              minWidth: '250px',
              background: '#03045E',
              boxShadow: undefined,
              transition: 'left 0.4s cubic-bezier(.4,0,.2,1)',
              boxSizing: 'border-box',
              marginLeft: 0,
              paddingLeft: 0,
            }}
          >
            {/* Brand Logo */}
            <Link href="/" className="brand-link" style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 15px',
                height: '60px',
                borderBottom: '1px solid rgba(202,240,248,0.2)',
              flexShrink: 0,
              backgroundColor: '#03045E',
                color: '#CAF0F8'
            }}>
                  <img 
                    src="/images/IMG_0813.PNG" 
                    alt="3X BAT Logo"
                    className="brand-image" 
                    style={{ 
                    marginRight: '15px',
                    width: '60px',
                    height: 'auto'
                    }}
                  />
                  <span 
                  className="brand-text font-weight-bold" 
                    id="brandName"
                    style={{
                    fontSize: '32px',
                      fontWeight: '700',
                      color: '#CAF0F8',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                    letterSpacing: '2px',
                      textTransform: 'uppercase',
                    background: 'linear-gradient(135deg, #CAF0F8 0%, #90E0EF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                    }}
                  >
                    3X BAT
                  </span>
                </Link>
                {/* Sidebar Navigation Menu */}
                <div className="sidebar" style={{ marginTop: '0', flex: 1, overflowY: 'auto', marginLeft: 0, paddingLeft: 0 }}>
                  <nav>
                    <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
                      {(() => {
                        console.log('🔵 Desktop sidebar: Rendering navigation, sidebarLinks:', sidebarLinks);
                        if (sidebarLinks && Object.keys(sidebarLinks).length > 0) {
                          console.log('🔵 Desktop sidebar: Rendering sections:', Object.keys(sidebarLinks));
                          return Object.entries(sidebarLinks).map(([section, links]) => {
                            const isExpanded = expandedSections.has(section);
                            console.log('🔵 Desktop sidebar: Rendering section:', section, 'expanded:', isExpanded, 'links:', links);
                            return (
                              <React.Fragment key={section}>
                              <li className="nav-header" style={{ 
                                cursor: 'pointer',
                                padding: '15px 20px',
                                color: '#CAF0F8',
                                fontSize: '15px',
                                fontWeight: '700',
                                borderBottom: '2px solid rgba(202,240,248,0.3)',
                                backgroundColor: '#023E8A',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                              }} onClick={() => toggleSection(section)}>
                                  {section}
                                                                  <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} float-right`} style={{ 
                                    fontSize: '14px', 
                                    marginTop: '3px', 
                                    color: '#CAF0F8',
                                    transition: 'transform 0.2s ease'
                                  }}></i>
                                </li>
                                {isExpanded && Array.isArray(links) && links.map((link: any) => (
                                  <li className="nav-item" key={link.label}>
                                  <Link href={link.href} className={`nav-link ${router.pathname === link.href ? 'active' : ''}`} style={{ 
                                    padding: '10px 20px', 
                                    fontSize: '13px',
                                    color: '#CAF0F8',
                                    textDecoration: 'none',
                                    borderLeft: router.pathname === link.href ? '3px solid #0077B6' : '3px solid transparent',
                                    backgroundColor: router.pathname === link.href ? '#0077B6' : 'transparent',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                  }}
                                    onMouseEnter={(e) => {
                                      if (router.pathname !== link.href) {
                                        e.currentTarget.style.backgroundColor = '#023E8A';
                                        e.currentTarget.style.borderLeft = '3px solid #CAF0F8';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (router.pathname !== link.href) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.borderLeft = '3px solid transparent';
                                      }
                                    }}
                                    onClick={() => {
                                      // Preserve sidebar state when navigating
                                      const currentState = localStorage.getItem('sidebarCollapsed');
                                      if (currentState !== null) {
                                        localStorage.setItem('sidebarCollapsed', currentState);
                                      }
                                    }}
                                  >
                                    <i className={`nav-icon ${link.icon}`} style={{ 
                                      fontSize: '14px', 
                                      marginRight: '10px',
                                      color: '#CAF0F8',
                                      width: '20px',
                                      textAlign: 'center'
                                    }}></i>
                                    <p style={{ 
                                      margin: '0', 
                                      fontSize: '13px',
                                      fontWeight: '500'
                                    }}>{link.label}</p>
                                    </Link>
                                  </li>
                                ))}
                              </React.Fragment>
                            );
                          });
                        } else {
                          console.log('🔵 Desktop sidebar: No sidebarLinks, showing loading');
                          return (
                            <li className="nav-item">
                               <div style={{ 
                                 padding: '15px', 
                                 textAlign: 'center', 
                                 color: '#CAF0F8',
                                 fontSize: '13px',
                                 fontStyle: 'italic'
                               }}>
                                 {isLayoutLoading && Object.keys(sidebarLinks).length === 0 ? (
                                   <>
                                     <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                                Loading navigation...
                                   </>
                                   ) : (
                                   <>
                                     <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px', color: '#ffc107' }}></i>
                                     Navigation not available
                                   </>
                                 )}
                              </div>
                            </li>
                          );
                        }
                      })()}
                    </ul>
                  </nav>
                </div>
              </aside>
            )}

                 {/* ===================== Main Content Wrapper ===================== */}
         <div className="content-wrapper" style={{
           marginTop: '64px',
           width: (isMobile || isTablet) ? '100%' : (sidebarCollapsed ? '100%' : 'calc(100% - 250px)'),
           marginLeft: (isMobile || isTablet) ? '0' : (sidebarCollapsed ? '0' : '250px'),
           minHeight: 'calc(100vh - 64px)',
           transition: 'margin-left 0.3s ease-in-out, width 0.3s ease-in-out',
           padding: '2px',
           boxSizing: 'border-box',
           overflowX: 'hidden',
           maxWidth: '100%',
           display: 'flex',
           flexDirection: 'column',
           alignItems: 'stretch',
           backgroundColor: '#F8F9FA',
         }}>
          {/* This is where the page content is rendered */}
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>

        {/* ===================== Footer ===================== */}
        <footer className="main-footer">
          <strong>Copyright &copy; 2025 <a href="#" id="siteName">3X BAT</a>.</strong>
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
  } catch (error) {
    console.error('🔴 Layout component error:', error);
    return (
      <div className="hold-transition sidebar-mini">
        <div className="wrapper">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            fontSize: '18px',
            color: '#ff0000'
          }}>
            Error loading layout: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </div>
      </div>
    );
  }
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