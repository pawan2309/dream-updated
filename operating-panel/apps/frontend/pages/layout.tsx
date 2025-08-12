import React, { useState, useEffect } from "react";
import Link from "next/link";

interface DropdownItem {
  label: string;
  href?: string;
}

interface SidebarItem {
  label: string;
  icon: string;
  href?: string;
  hasDropdown?: boolean;
  dropdownItems?: DropdownItem[];
}

const sidebarItems: SidebarItem[] = [
  { label: "Cricket Dashboard", icon: "📊", href: "/dashboard" },
  { label: "Undeclare Match BetList", icon: "💼", href: "/undeclareMatchBetList" },
  { label: "Website Settings", icon: "⚙️", href: "/websiteSetting" },
  {
    label: "Diamond Casino",
    icon: "💎",
    hasDropdown: true,
    dropdownItems: [
      { label: "Casino List", href: "/DiamondCasino/casinoList" },
      { label: "Declare Casino Result", href: "/DiamondCasino/declareCasinoResult" },
      { label: "Bet List", href: "/DiamondCasino/betList" },
      { label: "Undeclare Bet List", href: "/DiamondCasino/undeclareBetList" },
      { label: "Ledger Declare", href: "/DiamondCasino/ledgerDeclare" },
      { label: "Re-Declare Casino Result", href: "/DiamondCasino/reDeclareCasinoResult" },
    ],
  },
  { label: "Matka Settings", icon: "⚙️", hasDropdown: true, dropdownItems: [
    { label: "Matka List", href: "/matkaList" },
    { label: "Matka Result Declare", href: "/matkaResultDeclare" },
    { label: "Matka Game Type", href: "/matkaGameType" },
    { label: "Matka Bet List", href: "/matkaBetList" },
  ] },
  { label: "Show User Exposer", icon: "💵", href: "/userExposer" },
  { label: "Settings", icon: "🛡️", href: "/settings" },
];

const SIDEBAR_WIDTH = 280;
const COLLAPSED_WIDTH = 80;

export default function Layout({ children }: { children: React.ReactNode }) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Improved mobile detection with better breakpoint handling
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const mobile = width <= 768;
      
      console.log('📱 Responsive check:', { 
        width, 
        isMobile: mobile, 
        currentMobile: isMobile,
        isSidebarOpen,
        isCollapsed 
      });
      
      setIsMobile(mobile);
      
      // Reset sidebar state when switching between mobile and desktop
      if (mobile && !isMobile) {
        // Switching to mobile
        setIsSidebarOpen(false);
        setIsCollapsed(false);
      } else if (!mobile && isMobile) {
        // Switching to desktop
        setIsSidebarOpen(false);
        setIsCollapsed(false);
      }
    };

    // Initial check
    checkMobile();
    
    // Add resize listener with debouncing
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkMobile, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', checkMobile);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', checkMobile);
      clearTimeout(resizeTimeout);
    };
  }, [isMobile, isSidebarOpen, isCollapsed]);

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const toggleSidebar = () => {
    console.log('🍔 Hamburger clicked!', { 
      isMobile, 
      isSidebarOpen, 
      isCollapsed,
      windowWidth: window.innerWidth 
    });
    
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
      console.log('📱 Mobile: Setting sidebar to', !isSidebarOpen);
    } else {
      setIsCollapsed(!isCollapsed);
      console.log('💻 Desktop: Setting collapsed to', !isCollapsed);
    }
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const currentWidth = isMobile 
    ? (isSidebarOpen ? SIDEBAR_WIDTH : 0) 
    : (isCollapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH);

  const sidebarVisible = isMobile ? isSidebarOpen : true;

  return (
    <div style={{ minHeight: "100vh", fontFamily: "sans-serif" }}>
      {/* Fixed Top Bar */}
      <div style={{
        position: "fixed",
        top: 0,
        left: isMobile ? 0 : currentWidth,
        right: 0,
        height: isMobile ? "53px" : "70px",
        background: "#2d3131",
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 12px",
        zIndex: 1000,
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        transition: "left 0.3s ease",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 16,
          height: "100%",
          background: "rgba(0, 0, 0, 0.3)",
          padding: "0 12px",
          borderRadius: "0"
        }}>
          <button 
            onClick={toggleSidebar}
            style={{ 
              background: "none", 
              border: "none", 
              color: "#fff", 
              fontSize: 24,
              cursor: "pointer",
              padding: "12px",
              borderRadius: "4px",
              transition: "all 0.15s ease-in-out",
              minWidth: "48px",
              minHeight: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            onTouchStart={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)"}
            onTouchEnd={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            {isMobile ? (isSidebarOpen ? "✕" : "☰") : "☰"}
          </button>
          <span style={{ 
            fontSize: isMobile ? 16 : 20, 
            fontWeight: "600",
            display: isMobile ? "none" : "block",
            color: "#fff"
          }}>
            Operating Panel
          </span>
          {isMobile && (
            <span style={{ 
              fontSize: 12, 
              color: "#e5e7eb",
              marginLeft: 8
            }}>
              {isSidebarOpen ? "Open" : "Closed"}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16 }}>
          <div style={{ 
            padding: "8px 16px", 
            background: "rgba(255,255,255,0.1)", 
            borderRadius: "6px",
            fontSize: isMobile ? 12 : 14,
            color: "#e5e7eb",
            display: isMobile ? "none" : "block",
            fontWeight: "500"
          }}>
            {new Date().toLocaleDateString()}
          </div>
          <div style={{ 
            padding: isMobile ? "6px 12px" : "8px 16px", 
            background: "rgba(255,255,255,0.1)", 
            color: "#fff",
            borderRadius: "6px",
            fontSize: isMobile ? 12 : 14,
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "all 0.15s ease-in-out"
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
          >
            {isMobile ? "Owner" : "owner 01 ▼"}
          </div>
          <button
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login';
              } catch (error) {
                console.error('Logout error:', error);
                window.location.href = '/login';
              }
            }}
            style={{
              padding: isMobile ? "6px 12px" : "8px 16px",
              background: "rgba(220, 38, 38, 0.8)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: isMobile ? 12 : 14,
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.15s ease-in-out"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 1)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.8)"}
          >
            {isMobile ? "🚪" : "🚪 Logout"}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            cursor: "pointer"
          }}
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: currentWidth,
        zIndex: 1001,
        display: sidebarVisible ? "block" : "none"
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          width: currentWidth
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            overflowX: "hidden",
            overflowY: "auto",
            borderRight: "1px solid rgba(156, 163, 175, 0.2)"
          }}>
            {/* Header */}
            <div style={{
              height: isMobile ? "53px" : "70px",
              width: "100%",
              background: "#2d3131"
            }}>
              <div style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                height: isMobile ? "53px" : "70px",
                background: "rgba(0, 0, 0, 0.3)",
                padding: "0 12px"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: "12px",
                  height: isMobile ? "53px" : "70px",
                  padding: "8px 0",
                  width: "100%",
                  paddingLeft: isMobile ? "12px" : "16px"
                }}>
                  <button 
                    onClick={toggleSidebar}
                    style={{ 
                      background: "none", 
                      border: "none", 
                      color: "#fff", 
                      fontSize: 24,
                      cursor: "pointer",
                      padding: "12px",
                      borderRadius: "4px",
                      transition: "all 0.15s ease-in-out",
                      minWidth: "48px",
                      minHeight: "48px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    onTouchStart={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)"}
                    onTouchEnd={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    {isMobile ? (isSidebarOpen ? "✕" : "☰") : "☰"}
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav style={{
              flex: 1,
              background: "#1e3a8a",
              fontFamily: "system-ui, -apple-system, sans-serif"
            }}>
              <div style={{ marginTop: "8px" }}>
                {/* Dashboard */}
                <div style={{ marginTop: "8px" }}>
                  <Link href="/dashboard" style={{ textDecoration: "none", color: "inherit" }}>
                    <span style={{
                      cursor: "pointer",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: "16px",
                      padding: "8px 4px",
                      fontSize: "14px",
                      transition: "all 0.15s ease-in-out",
                      color: "white"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#fa8c15";
                      const iconDiv = e.currentTarget.querySelector('div') as HTMLElement;
                      const textSpan = e.currentTarget.querySelector('span') as HTMLElement;
                      if (iconDiv) iconDiv.style.color = "#fa8c15";
                      if (textSpan) textSpan.style.color = "#fa8c15";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "white";
                      const iconDiv = e.currentTarget.querySelector('div') as HTMLElement;
                      const textSpan = e.currentTarget.querySelector('span') as HTMLElement;
                      if (iconDiv) iconDiv.style.color = "white";
                      if (textSpan) textSpan.style.color = "white";
                    }}
                    onClick={() => isMobile && closeSidebar()}
                    >
                      <div style={{
                        marginLeft: isCollapsed ? "8px" : "32px",
                        color: "white",
                        transition: "all 0.15s ease-in-out"
                      }}>
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="25" width="25" xmlns="http://www.w3.org/2000/svg">
                          <path fill="none" d="M0 0h24v24H0V0z"></path>
                          <path d="M19 5v2h-4V5h4M9 5v6H5V5h4m10 8v6h-4v-6h4M9 17v2H5v-2h4M21 3h-8v6h8V3zM11 3H3v10h8V3zm10 8h-8v10h8V11zm-10 4H3v6h8v-6z"></path>
                        </svg>
                      </div>
                      <span style={{
                        fontSize: "14px",
                        fontWeight: isMobile ? "600" : "400",
                        transition: "all 0.15s ease-in-out",
                        display: isCollapsed ? "none" : "block"
                      }}>
                        Cricket Dashboard
                      </span>
                    </span>
                  </Link>
                </div>

                {/* Undeclare Match BetList */}
                <div style={{ marginTop: "8px" }}>
                  <Link href="/undeclareMatchBetList" style={{ textDecoration: "none", color: "inherit" }}>
                    <span style={{
                      cursor: "pointer",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: "16px",
                      padding: "8px 4px",
                      fontSize: "14px",
                      transition: "all 0.15s ease-in-out",
                      color: "white"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#fa8c15";
                      const iconDiv = e.currentTarget.querySelector('div') as HTMLElement;
                      const textSpan = e.currentTarget.querySelector('span') as HTMLElement;
                      if (iconDiv) iconDiv.style.color = "#fa8c15";
                      if (textSpan) textSpan.style.color = "#fa8c15";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "white";
                      const iconDiv = e.currentTarget.querySelector('div') as HTMLElement;
                      const textSpan = e.currentTarget.querySelector('span') as HTMLElement;
                      if (iconDiv) iconDiv.style.color = "white";
                      if (textSpan) textSpan.style.color = "white";
                    }}
                    onClick={() => isMobile && closeSidebar()}
                    >
                      <div style={{
                        marginLeft: isCollapsed ? "8px" : "32px",
                        color: "white",
                        transition: "all 0.15s ease-in-out"
                      }}>
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="23" width="23" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v1.384l7.614 2.03a1.5 1.5 0 0 0 .772 0L16 5.884V4.5A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1h-3zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5z"></path>
                          <path d="M0 12.5A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5V6.85L8.129 8.947a.5.5 0 0 1-.258 0L0 6.85v5.65z"></path>
                        </svg>
                      </div>
                      <span style={{
                        fontSize: "14px",
                        fontWeight: isMobile ? "600" : "400",
                        transition: "all 0.15s ease-in-out",
                        display: isCollapsed ? "none" : "block"
                      }}>
                        Undeclare Match BetList
                      </span>
                    </span>
                  </Link>
                </div>

                {/* Website Settings */}
                <div style={{ marginTop: "8px" }}>
                  <Link href="/websiteSetting" style={{ textDecoration: "none", color: "inherit" }}>
                    <span style={{
                      cursor: "pointer",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "8px 4px",
                      fontSize: "14px",
                      transition: "all 0.15s ease-in-out",
                      color: "white"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#fa8c15";
                      const iconDiv = e.currentTarget.querySelector('div') as HTMLElement;
                      const textSpan = e.currentTarget.querySelector('span') as HTMLElement;
                      if (iconDiv) iconDiv.style.color = "#fa8c15";
                      if (textSpan) textSpan.style.color = "#fa8c15";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "white";
                      const iconDiv = e.currentTarget.querySelector('div') as HTMLElement;
                      const textSpan = e.currentTarget.querySelector('span') as HTMLElement;
                      if (iconDiv) iconDiv.style.color = "white";
                      if (textSpan) textSpan.style.color = "white";
                    }}
                    onClick={() => isMobile && closeSidebar()}
                    >
                      <div style={{
                        marginLeft: isCollapsed ? "8px" : "32px",
                        color: "white",
                        transition: "all 0.15s ease-in-out"
                      }}>
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="25" width="25" xmlns="http://www.w3.org/2000/svg">
                          <path fill="none" d="M0 0h24v24H0V0z"></path>
                          <path d="M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46a.5.5 0 00-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65A.488.488 0 0014 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1a.566.566 0 00-.18-.03c-.17 0-.34.09-.43.25l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46a.5.5 0 00.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.06.02.12.03.18.03.17 0 .34-.09.43-.25l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zm-1.98-1.71c.04.31.05.52.05.73 0 .21-.02.43-.05.73l-.14 1.13.89.7 1.08.84-.7 1.21-1.27-.51-1.04-.42-.9.68c-.43.32-.84.56-1.25.73l-1.06.43-.16 1.13-.2 1.35h-1.4l-.19-1.35-.16-1.13-1.06-.43c-.43-.18-.83-.41-1.23-.71l-.91-.7-1.06.43-1.27.51-.7-1.21 1.08-.84.89-.7-.14-1.13c-.03-.31-.05-.54-.05-.74s.02-.43.05-.73l.14-1.13-.89-.7-1.08-.84.7-1.21 1.27.51 1.04.42.9-.68c.43-.32.84-.56 1.25-.73l1.06-.43.16-1.13.2-1.35h1.39l.19 1.35.16 1.13 1.06.43c.43.18.83.41 1.23.71l.91.7 1.06-.43 1.27-.51.7 1.21-1.07.85-.89.7.14 1.13zM12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"></path>
                        </svg>
                      </div>
                      <span style={{
                        fontSize: "14px",
                        fontWeight: isMobile ? "600" : "400",
                        transition: "all 0.15s ease-in-out",
                        display: isCollapsed ? "none" : "block"
                      }}>
                        Website Settings
                      </span>
                    </span>
                  </Link>
                </div>

                {/* Diamond Casino */}
                <div style={{ cursor: "pointer" }}>
                  <span style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 4px",
                    gap: "16px",
                    fontSize: "14px",
                    color: "white",
                    transition: "all 0.15s ease-in-out",
                    cursor: "pointer",
                    height: "36px"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#fa8c15";
                    const iconSpan = e.currentTarget.querySelector('span') as HTMLElement;
                    const lastChildSpan = e.currentTarget.querySelector('span:last-child') as HTMLElement;
                    const svgElement = e.currentTarget.querySelector('svg') as SVGSVGElement;
                    if (iconSpan) iconSpan.style.color = "#fa8c15";
                    if (lastChildSpan) lastChildSpan.style.color = "#fa8c15";
                    if (svgElement) svgElement.style.color = "#fa8c15";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "white";
                    const iconSpan = e.currentTarget.querySelector('span') as HTMLElement;
                    const lastChildSpan = e.currentTarget.querySelector('span:last-child') as HTMLElement;
                    const svgElement = e.currentTarget.querySelector('svg') as SVGSVGElement;
                    if (iconSpan) iconSpan.style.color = "white";
                    if (lastChildSpan) lastChildSpan.style.color = "white";
                    if (svgElement) svgElement.style.color = "white";
                  }}
                  onClick={() => handleDropdownToggle("Diamond Casino")}
                  >
                    <span style={{
                      marginLeft: isCollapsed ? "8px" : "32px",
                      color: "white",
                      transition: "all 0.15s ease-in-out"
                    }}>
                      <svg stroke="currentColor" fill="currentColor" strokeWidth="0" version="1.1" viewBox="0 0 32 32" height="23" width="23" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.456 27.25c6.215 0.848 12.319 1.682 18.544 2.532-2.121-3.531-4.187-6.972-6.27-10.441-4.081 2.63-8.124 5.235-12.273 7.909zM29.755 7.705c-0.548 0.823-1.097 1.645-1.644 2.468-1.879 2.827-3.758 5.654-5.635 8.482-0.105 0.158-0.24 0.283-0.093 0.525 1.814 2.995 3.613 5.999 5.417 9 0.285 0.474 0.572 0.946 0.941 1.401 0.364-7.284 0.729-14.568 1.094-21.852-0.027-0.008-0.054-0.016-0.080-0.023zM4.995 17.043c0.085 0.081 0.296 0.127 0.395 0.079 1.74-0.855 3.491-1.691 5.192-2.617 0.555-0.302 0.982-0.842 1.46-1.281 1.583-1.452 3.164-2.907 4.744-4.362 0.097-0.089 0.211-0.176 0.269-0.288 0.568-1.109 1.125-2.224 1.703-3.371-0.689-0.259-1.341-0.512-2.002-0.742-0.089-0.031-0.231 0.031-0.328 0.085-1.53 0.854-3.088 1.663-4.569 2.595-0.741 0.466-1.345 1.154-2.001 1.752-1.058 0.965-2.114 1.933-3.156 2.915-0.277 0.261-0.529 0.558-0.744 0.872-0.713 1.038-1.404 2.091-2.127 3.173 0.404 0.419 0.772 0.819 1.165 1.191zM11.353 15.625c-0.865 3.656-1.726 7.292-2.615 11.047 4.168-2.686 8.241-5.31 12.286-7.916-3.219-1.042-6.428-2.081-9.671-3.13zM28.692 7.74c-3.522 0.588-6.96 1.163-10.442 1.744 1.186 2.885 2.348 5.712 3.544 8.62 2.313-3.475 4.58-6.88 6.899-10.364zM11.498 14.877c3.172 1.030 6.28 2.039 9.479 3.077-1.188-2.894-2.335-5.687-3.506-8.538-1.995 1.824-3.959 3.62-5.973 5.461zM5.126 19.175c-1.125 2.689-2.211 5.286-3.317 7.93 2.126-0.063 4.187-0.124 6.318-0.187-1.001-2.582-1.982-5.114-3.001-7.744zM8.201 25.080c0.026-0.005 0.052-0.012 0.079-0.017 0.758-3.154 1.528-6.287 2.303-9.565-1.728 0.898-3.376 1.754-5.069 2.635 0.864 2.246 1.785 4.615 2.688 6.947zM27.417 7.229c-1.009-0.267-2.018-0.535-3.027-0.801-1.451-0.381-2.903-0.758-4.353-1.143-0.181-0.048-0.312-0.080-0.419 0.139-0.512 1.050-1.041 2.092-1.561 3.138-0.016 0.032-0.013 0.074-0.025 0.155 3.142-0.476 6.263-0.949 9.383-1.422 0.001-0.022 0.001-0.044 0.002-0.066zM21.564 4.841c2.709 0.75 5.419 1.499 8.223 2.275-0.472-1.344-0.909-2.59-1.359-3.872-2.303 0.511-4.577 1.015-6.852 1.519-0.004 0.026-0.008 0.051-0.012 0.077zM8.899 27.856c-1.019-0.117-2.064-0.009-3.097 0.008-0.849 0.015-1.697 0.047-2.545 0.073-0.088 0.003-0.175 0.020-0.262 0.114 7.015 0.649 14.030 1.297 21.044 1.946 0.005-0.031 0.009-0.063 0.014-0.094-2.249-0.307-4.497-0.614-6.746-0.921-2.802-0.383-5.599-0.803-8.408-1.127zM1.947 24.685c0.904-2.097 1.804-4.197 2.712-6.292 0.091-0.21 0.084-0.353-0.094-0.522-0.38-0.361-0.732-0.751-1.147-1.182-0.561 2.77-1.108 5.47-1.655 8.171 0.020 0.009 0.041 0.019 0.061 0.029 0.042-0.067 0.093-0.131 0.124-0.203zM19.763 4.287c1.524-0.393 3.071-0.701 4.608-1.044 0.099-0.022 0.197-0.055 0.295-0.083-0.005-0.025-0.010-0.050-0.015-0.075-2.165 0.291-4.331 0.583-6.606 0.889 0.62 0.271 1.098 0.473 1.718 0.314z"></path>
                      </svg>
                    </span>
                    <span style={{
                      fontSize: "14px",
                      fontWeight: isMobile ? "600" : "400",
                      transition: "all 0.15s ease-in-out",
                      display: isCollapsed ? "none" : "block"
                    }}>
                      Diamond Casino
                    </span>
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 20 20" aria-hidden="true" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" style={{ 
                      transition: "all 0.15s ease-in-out",
                      transform: openDropdown === "Diamond Casino" ? "rotate(180deg)" : "rotate(0deg)",
                      display: isCollapsed ? "none" : "block"
                    }}>
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                  </span>
                  
                  {/* Diamond Casino Dropdown */}
                  {openDropdown === "Diamond Casino" && (
                    <div style={{
                      marginLeft: "32px",
                      background: "rgba(0,0,0,0.1)",
                      borderRadius: "4px",
                      overflow: "hidden",
                      marginTop: "4px"
                    }}>
                      <Link href="/DiamondCasino/casinoList" style={{ textDecoration: "none", color: "inherit" }}>
                        <div style={{ 
                          padding: "8px 16px", 
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          color: "#e5e7eb"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#e5e7eb";
                        }}
                        onClick={() => isMobile && closeSidebar()}
                        >
                          Casino List
                        </div>
                      </Link>
                      <Link href="/DiamondCasino/declareCasinoResult" style={{ textDecoration: "none", color: "inherit" }}>
                        <div style={{ 
                          padding: "8px 16px", 
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          color: "#e5e7eb"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#e5e7eb";
                        }}
                        onClick={() => isMobile && closeSidebar()}
                        >
                          Declare Casino Result
                        </div>
                      </Link>
                      <Link href="/DiamondCasino/betList" style={{ textDecoration: "none", color: "inherit" }}>
                        <div style={{ 
                          padding: "8px 16px", 
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          color: "#e5e7eb"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#e5e7eb";
                        }}
                        onClick={() => isMobile && closeSidebar()}
                        >
                          Bet List
                        </div>
                      </Link>
                      <Link href="/DiamondCasino/undeclareBetList" style={{ textDecoration: "none", color: "inherit" }}>
                        <div style={{ 
                          padding: "8px 16px", 
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          color: "#e5e7eb"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#e5e7eb";
                        }}
                        onClick={() => isMobile && closeSidebar()}
                        >
                          Undeclare Bet List
                        </div>
                      </Link>
                      <Link href="/DiamondCasino/ledgerDeclare" style={{ textDecoration: "none", color: "inherit" }}>
                        <div style={{ 
                          padding: "8px 16px", 
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          color: "#e5e7eb"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#e5e7eb";
                        }}
                        onClick={() => isMobile && closeSidebar()}
                        >
                          Ledger Declare
                        </div>
                      </Link>
                      <Link href="/DiamondCasino/reDeclareCasinoResult" style={{ textDecoration: "none", color: "inherit" }}>
                        <div style={{ 
                          padding: "8px 16px", 
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          color: "#e5e7eb"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#e5e7eb";
                        }}
                        onClick={() => isMobile && closeSidebar()}
                        >
                          Re-Declare Casino Result
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Matka Settings */}
                <div style={{ cursor: "pointer" }}>
                  <span style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 4px",
                    gap: "16px",
                    fontSize: "14px",
                    color: "white",
                    transition: "all 0.15s ease-in-out",
                    cursor: "pointer",
                    height: "36px"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#fa8c15";
                    const iconSpan = e.currentTarget.querySelector('span') as HTMLElement;
                    const lastChildSpan = e.currentTarget.querySelector('span:last-child') as HTMLElement;
                    const svgElement = e.currentTarget.querySelector('svg') as SVGSVGElement;
                    if (iconSpan) iconSpan.style.color = "#fa8c15";
                    if (lastChildSpan) lastChildSpan.style.color = "#fa8c15";
                    if (svgElement) svgElement.style.color = "#fa8c15";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "white";
                    const iconSpan = e.currentTarget.querySelector('span') as HTMLElement;
                    const lastChildSpan = e.currentTarget.querySelector('span:last-child') as HTMLElement;
                    const svgElement = e.currentTarget.querySelector('svg') as SVGSVGElement;
                    if (iconSpan) iconSpan.style.color = "white";
                    if (lastChildSpan) lastChildSpan.style.color = "white";
                    if (svgElement) svgElement.style.color = "white";
                  }}
                  onClick={() => handleDropdownToggle("Matka Settings")}
                  >
                    <span style={{
                      marginLeft: "32px",
                      color: "white",
                      transition: "all 0.15s ease-in-out"
                    }}>
                      <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="25" width="25" xmlns="http://www.w3.org/2000/svg">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                        <path d="M12.501 20.93c-.866 .25 -1.914 -.166 -2.176 -1.247a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065c.426 -1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.074 .26 1.49 1.296 1.252 2.158"></path>
                        <path d="M19 22v-6"></path>
                        <path d="M22 19l-3 -3l-3 3"></path>
                        <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"></path>
                      </svg>
                    </span>
                    <span style={{
                      fontSize: "14px",
                      fontWeight: isMobile ? "600" : "400",
                      transition: "all 0.15s ease-in-out"
                    }}>
                      Matka Settings
                    </span>
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 20 20" aria-hidden="true" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" style={{ 
                      transition: "all 0.15s ease-in-out",
                      transform: openDropdown === "Matka Settings" ? "rotate(180deg)" : "rotate(0deg)"
                    }}>
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                  </span>
                  
                  {/* Matka Settings Dropdown */}
                  {openDropdown === "Matka Settings" && (
                    <div style={{
                      marginLeft: "32px",
                      background: "rgba(0,0,0,0.1)",
                      borderRadius: "4px",
                      overflow: "hidden",
                      marginTop: "4px"
                    }}>
                      <Link href="/matkaList" style={{ textDecoration: "none", color: "inherit" }}>
                        <div style={{ 
                          padding: "8px 16px", 
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          color: "#e5e7eb"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#e5e7eb";
                        }}
                        onClick={() => isMobile && closeSidebar()}
                        >
                          Matka List
                        </div>
                      </Link>
                      <Link href="/matkaResultDeclare" style={{ textDecoration: "none", color: "inherit" }}>
                        <div style={{ 
                          padding: "8px 16px", 
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          color: "#e5e7eb"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#e5e7eb";
                        }}
                        onClick={() => isMobile && closeSidebar()}
                        >
                          Matka Result Declare
                        </div>
                      </Link>
                      <Link href="/matkaGameType" style={{ textDecoration: "none", color: "inherit" }}>
                        <div style={{ 
                          padding: "8px 16px", 
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          color: "#e5e7eb"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#e5e7eb";
                        }}
                        onClick={() => isMobile && closeSidebar()}
                        >
                          Matka Game Type
                        </div>
                      </Link>
                      <Link href="/matkaBetList" style={{ textDecoration: "none", color: "inherit" }}>
                        <div style={{ 
                          padding: "8px 16px", 
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          color: "#e5e7eb"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#e5e7eb";
                        }}
                        onClick={() => isMobile && closeSidebar()}
                        >
                          Matka Bet List
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Show User Exposer */}
                <div style={{ marginTop: "8px" }}>
                  <Link href="/userExposer" style={{ textDecoration: "none", color: "inherit" }}>
                    <span style={{
                      cursor: "pointer",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "8px 4px",
                      fontSize: "14px",
                      transition: "all 0.15s ease-in-out",
                      color: "white"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#fa8c15";
                      const iconDiv = e.currentTarget.querySelector('div') as HTMLElement;
                      const textSpan = e.currentTarget.querySelector('span') as HTMLElement;
                      if (iconDiv) iconDiv.style.color = "#fa8c15";
                      if (textSpan) textSpan.style.color = "#fa8c15";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "white";
                      const iconDiv = e.currentTarget.querySelector('div') as HTMLElement;
                      const textSpan = e.currentTarget.querySelector('span') as HTMLElement;
                      if (iconDiv) iconDiv.style.color = "white";
                      if (textSpan) textSpan.style.color = "white";
                    }}
                    onClick={() => isMobile && closeSidebar()}
                    >
                      <div style={{
                        marginLeft: "32px",
                        color: "white",
                        transition: "all 0.15s ease-in-out"
                      }}>
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="22" width="22" xmlns="http://www.w3.org/2000/svg">
                          <path d="M0 112.5V422.3c0 18 10.1 35 27 41.3c87 32.5 174 10.3 261-11.9c79.8-20.3 159.6-40.7 239.3-18.9c23 6.3 48.7-9.5 48.7-33.4V89.7c0-18-10.1-35-27-41.3C462 15.9 375 38.1 288 60.3C208.2 80.6 128.4 100.9 48.7 79.1C25.6 72.8 0 88.6 0 112.5zM288 352c-44.2 0-80-43-80-96s35.8-96 80-96s80 43 80 96s-35.8 96-80 96zM64 352c35.3 0 64 28.7 64 64H64V352zm64-208c0 35.3-28.7 64-64 64V144h64zM512 304v64H448c0-35.3 28.7-64 64-64zM448 96h64v64c-35.3 0-64-28.7-64-64z"></path>
                        </svg>
                      </div>
                      <span style={{
                        fontSize: "14px",
                        fontWeight: isMobile ? "600" : "400",
                        transition: "all 0.15s ease-in-out"
                      }}>
                        Show User Exposer
                      </span>
                    </span>
                  </Link>
                </div>

                {/* Settings */}
                <div style={{ marginTop: "8px" }}>
                  <Link href="/settings" style={{ textDecoration: "none", color: "inherit" }}>
                    <span style={{
                      cursor: "pointer",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "8px 4px",
                      fontSize: "14px",
                      transition: "all 0.15s ease-in-out",
                      color: "white"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#fa8c15";
                      const iconDiv = e.currentTarget.querySelector('div') as HTMLElement;
                      const textSpan = e.currentTarget.querySelector('span') as HTMLElement;
                      if (iconDiv) iconDiv.style.color = "#fa8c15";
                      if (textSpan) textSpan.style.color = "#fa8c15";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "white";
                      const iconDiv = e.currentTarget.querySelector('div') as HTMLElement;
                      const textSpan = e.currentTarget.querySelector('span') as HTMLElement;
                      if (iconDiv) iconDiv.style.color = "white";
                      if (textSpan) textSpan.style.color = "white";
                    }}
                    onClick={() => isMobile && closeSidebar()}
                    >
                      <div style={{
                        marginLeft: "32px",
                        color: "white",
                        transition: "all 0.15s ease-in-out"
                      }}>
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="25" width="25" xmlns="http://www.w3.org/2000/svg">
                          <path fill="none" d="M0 0h24v24H0V0z"></path>
                          <path d="M17 11c.34 0 .67.04 1 .09V6.27L10.5 3 3 6.27v4.91c0 4.54 3.2 8.79 7.5 9.82.55-.13 1.08-.32 1.6-.55-.69-.98-1.1-2.17-1.1-3.45 0-3.31 2.69-6 6-6z"></path>
                          <path d="M17 13c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 1.38c.62 0 1.12.51 1.12 1.12s-.51 1.12-1.12 1.12-1.12-.51-1.12-1.12.5-1.12 1.12-1.12zm0 5.37c-.93 0-1.74-.46-2.24-1.17.05-.72 1.51-1.08 2.24-1.08s2.19.36 2.24 1.08c-.5.71-1.31 1.17-2.24 1.17z"></path>
                        </svg>
                      </div>
                      <span style={{
                        fontSize: "14px",
                        fontWeight: isMobile ? "600" : "400",
                        transition: "all 0.15s ease-in-out"
                      }}>
                        Settings
                      </span>
                    </span>
                  </Link>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main style={{ 
        marginLeft: isMobile ? 0 : currentWidth, 
        marginTop: isMobile ? "53px" : "70px",
        background: "#f8fafc", 
        minHeight: isMobile ? "calc(100vh - 53px)" : "calc(100vh - 70px)",
        transition: "margin-left 0.3s ease",
        width: isMobile ? "100%" : `calc(100% - ${currentWidth}px)`,
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
        <section style={{ padding: "2px" }}>
          <div>{children}</div>
        </section>
      </main>
    </div>
  );
} 