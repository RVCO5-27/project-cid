import React, { useLayoutEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header.jsx';
import AdminHeader from '../AdminHeader.jsx';
import Sidebar from '../Sidebar.jsx';
import Footer from '../Footer/Footer.jsx';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

/**
 * Layout - Reusable layout with Header, Sidebar, Content, Footer
 * Header and Footer scroll with content (not fixed)
 */
const Layout = ({ children, variant = 'public' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const layoutRef = useRef(null);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useLayoutEffect(() => {
    const layoutEl = layoutRef.current;
    if (!layoutEl) return undefined;

    const updateHeaderHeight = () => {
      const brandingEl = layoutEl.querySelector('.layout__sidebar .branding');
      if (!brandingEl) return;
      const height = brandingEl.getBoundingClientRect().height;
      if (height > 0) {
        layoutEl.style.setProperty('--header-height', `${Math.round(height)}px`);
      }
    };

    updateHeaderHeight();

    const brandingEl = layoutEl.querySelector('.layout__sidebar .branding');
    let resizeObserver;
    if (brandingEl && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(updateHeaderHeight);
      resizeObserver.observe(brandingEl);
    }

    window.addEventListener('resize', updateHeaderHeight);
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className={`layout ${variant === 'admin' ? 'layout--admin' : ''}`} ref={layoutRef}>
      {/* Header - Scrolls with content */}
      <header className="layout__header" role="banner" id="Header">
        {variant === 'admin' ? (
          <AdminHeader user={user} onMenuToggle={toggleSidebar} />
        ) : (
          <Header onMenuToggle={toggleSidebar} />
        )}
      </header>

      {/* Main Container */}
      <div className="layout__container">
        {/* Sidebar - Fixed */}
        <aside className={`layout__sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
          <Sidebar isOpen={sidebarOpen} variant={variant} />
        </aside>
        
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="sidebar-overlay" 
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content - Scrollable */}
        <div className="layout__content">
          {children || <Outlet />}
        </div>
      </div>

      {/* Footer - Scrolls with content */}
<footer className="layout__footer" role="contentinfo" id="Footer">
        <Footer />
      </footer>
    </div>
  );
};

export default Layout;
