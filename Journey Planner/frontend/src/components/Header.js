import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';

const Header = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const [hoveredLink, setHoveredLink] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const hasShownToast = sessionStorage.getItem('welcomeToastShown');
      if (!hasShownToast) {
        setShowToast(true);
        sessionStorage.setItem('welcomeToastShown', 'true');
        const timer = setTimeout(() => setShowToast(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    sessionStorage.removeItem('welcomeToastShown');
    logout();
    window.location.href = '/';
  };

  const getLinkStyle = (isHovered) => ({
    ...styles.link,
    backgroundColor: isHovered ? '#f1f5f9' : 'transparent',
    borderColor: isHovered ? '#3b82f6' : 'transparent',
    transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
    color: isHovered ? '#3b82f6' : '#475569'
  });

  const getButtonStyle = (isHovered) => ({
    ...styles.button,
    backgroundColor: isHovered ? '#dc2626' : '#ef4444',
    transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
    boxShadow: isHovered ? '0 4px 8px rgba(239, 68, 68, 0.4)' : '0 2px 4px rgba(239, 68, 68, 0.3)'
  });

  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.logoContainer}>
          <img src="/logo.png" alt="Journey Planner" style={styles.logoImage} />
          <h1 style={styles.logo}>Journey Planner</h1>
        </div>
        <nav style={isAuthenticated ? styles.nav : styles.navLoggedOut}>
          {isAuthenticated ? (
            <>
              <div style={styles.navLinks}>
                {isAdmin ? (
                  <a 
                    href="/admin" 
                    style={getLinkStyle(hoveredLink === 'admin')}
                    onMouseEnter={() => setHoveredLink('admin')}
                    onMouseLeave={() => setHoveredLink(null)}
                  >
                    Admin Panel
                  </a>
                ) : (
                  <>
                    <a 
                      href="/" 
                      style={getLinkStyle(hoveredLink === 'home')}
                      onMouseEnter={() => setHoveredLink('home')}
                      onMouseLeave={() => setHoveredLink(null)}
                    >
                      Home
                    </a>
                    <a 
                      href="/places" 
                      style={getLinkStyle(hoveredLink === 'places')}
                      onMouseEnter={() => setHoveredLink('places')}
                      onMouseLeave={() => setHoveredLink(null)}
                    >
                      Explore Places
                    </a>
                    <a 
                      href="/budget" 
                      style={getLinkStyle(hoveredLink === 'budget')}
                      onMouseEnter={() => setHoveredLink('budget')}
                      onMouseLeave={() => setHoveredLink(null)}
                    >
                      Budget Planner
                    </a>
                    <a 
                      href="/trips" 
                      style={getLinkStyle(hoveredLink === 'trips')}
                      onMouseEnter={() => setHoveredLink('trips')}
                      onMouseLeave={() => setHoveredLink(null)}
                    >
                      My Trips
                    </a>
                  </>
                )}
              </div>
              <button 
                onClick={handleLogout} 
                style={getButtonStyle(hoveredButton)}
                onMouseEnter={() => setHoveredButton(true)}
                onMouseLeave={() => setHoveredButton(false)}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a 
                href="/" 
                style={getLinkStyle(hoveredLink === 'home')}
                onMouseEnter={() => setHoveredLink('home')}
                onMouseLeave={() => setHoveredLink(null)}
              >
                Home
              </a>
              <a 
                href="/login" 
                style={getLinkStyle(hoveredLink === 'login')}
                onMouseEnter={() => setHoveredLink('login')}
                onMouseLeave={() => setHoveredLink(null)}
              >
                Login
              </a>
              <a 
                href="/register" 
                style={getLinkStyle(hoveredLink === 'register')}
                onMouseEnter={() => setHoveredLink('register')}
                onMouseLeave={() => setHoveredLink(null)}
              >
                Register
              </a>
            </>
          )}
        </nav>
      </div>
      {showToast && (
        <div style={styles.toast}>
          Welcome back, {user?.name}!
        </div>
      )}
    </header>
    </>
  );
};

const styles = {
  header: {
    backgroundColor: '#f8fafc',
    color: '#1e293b',
    padding: '1rem 0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    borderBottom: '1px solid #e2e8f0'
  },
  container: {
    maxWidth: '100%',
    margin: '0',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  logoImage: {
    height: '40px',
    width: 'auto'
  },
  logo: {
    fontSize: '2rem',
    fontWeight: '800',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.025em',
    margin: 0
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    marginLeft: '1rem'
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  navLoggedOut: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  welcome: {
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#64748b',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  link: {
    color: '#475569',
    textDecoration: 'none',
    padding: '0.75rem 1.25rem',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    fontSize: '0.95rem',
    fontWeight: '600',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    border: '1px solid transparent'
  },
  button: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.25rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
  },
  toast: {
    position: 'fixed',
    top: '100px',
    right: '20px',
    backgroundColor: '#10b981',
    color: 'white',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    fontSize: '0.9rem',
    fontWeight: '500',
    animation: 'slideIn 0.3s ease-out'
  }
};

export default Header;