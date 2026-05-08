import React from 'react';

/**
 * Header - Simple header for public pages
 * Contains: Title only
 * @param {function} onMenuToggle - Callback to toggle sidebar on mobile
 */
export function Header({ onMenuToggle }) {
  return (
    <header 
      className="header d-flex align-items-center px-4 py-3" 
      style={{ 
        position: 'relative', 
        zIndex: 10,
        width: '100%',
        boxSizing: 'border-box',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* Mobile menu toggle */}
      <button 
        className="btn btn-outline-primary d-lg-none me-3" 
        onClick={onMenuToggle}
        aria-label="Toggle menu"
        style={{ borderRadius: '8px' }}
      >
        ☰
      </button>
      
      {/* Page Title */}
      <h1 className="header__title mb-0" style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' }}>
        Building Futures: Strengthened SHS Implementation Dashboard
      </h1>
    </header>
  );
}

export default Header;

