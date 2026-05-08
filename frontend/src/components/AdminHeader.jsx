import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminHeader.css';

/**
 * AdminHeader - Header component for admin pages
 * Includes: title and profile dropdown
 * @param {object} user - User object for display
 * @param {function} onMenuToggle - Callback to toggle sidebar on mobile
 */
export function AdminHeader({ user, onMenuToggle }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  
  // Provide default user object if not passed
  const displayUser = user || { full_name: 'Admin User', role: 'Administrator', email: 'admin@example.com' };
  
  // Handle navigation
  const handleNavigate = (path) => {
    navigate(path);
    setDropdownOpen(false);
  };
  
  return (
    <header 
      className="admin-header d-flex align-items-center justify-content-between px-4 py-3" 
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
      {/* Left - Title */}
      <div className="d-flex align-items-center" style={{ flex: 1 }}>
        {/* Mobile menu toggle */}
        <button 
          className="btn btn-outline-primary d-lg-none me-3" 
          onClick={onMenuToggle}
          aria-label="Toggle menu"
          style={{ borderRadius: '8px' }}
        >
          ☰
        </button>
        
        {/* Page Title — sizing from AdminHeader.css (.admin-header__title) */}
        <h1 className="admin-header__title mb-0">
          Building Futures: Strengthened SHS Implementation Dashboard
        </h1>
      </div>
      
      {/* Right - Profile */}
      <div className="d-flex align-items-center gap-3" style={{ marginLeft: 'auto', position: 'relative' }}>
        {/* Admin Profile Dropdown */}
        <div className="dropdown position-relative">
          <button 
            className="btn d-flex align-items-center" 
            type="button" 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            style={{ 
              borderRadius: '8px', 
              border: 'none', 
              background: 'transparent', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              cursor: 'pointer',
              padding: '6px 0'
            }}
          >
            <div style={{ lineHeight: '1.3', textAlign: 'right' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a' }}>
                {displayUser.full_name || 'User'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>
                {displayUser.role || 'User'}
              </div>
            </div>
            <div 
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
              style={{ 
                width: '44px', 
                height: '44px', 
                fontSize: '1.1rem', 
                fontWeight: 'bold', 
                flexShrink: 0,
                backgroundImage: displayUser.avatar ? `url(${displayUser.avatar})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                overflow: 'hidden'
              }}
            >
              {!displayUser.avatar && displayUser.full_name?.charAt(0).toUpperCase()}
            </div>
          </button>
          
          {/* Profile Dropdown Menu */}
          {dropdownOpen && (
            <div 
              className="dropdown-menu show shadow-lg" 
              style={{ 
                borderRadius: '12px', 
                padding: '0.5rem', 
                minWidth: '220px', 
                position: 'absolute', 
                top: '100%', 
                right: 0, 
                zIndex: 1000, 
                marginTop: '8px', 
                backgroundColor: '#fff', 
                border: '1px solid #e2e8f0'
              }}
            >
              {/* User Info Header */}
              <div className="px-3 py-2 border-bottom">
                <strong>{displayUser.full_name || 'User'}</strong>
                <br />
                <small className="text-muted">{displayUser.email || 'user@example.com'}</small>
              </div>
              
              {/* Profile Option */}
              <button 
                className="dropdown-item py-2" 
                onClick={() => handleNavigate('/admin/profile')}
                style={{ 
                  border: 'none', 
                  background: 'none', 
                  cursor: 'pointer', 
                  textDecoration: 'none',
                  display: 'block',
                  width: '100%',
                  textAlign: 'left'
                }}
              >
                👤 Profile
              </button>
              
              {/* Change Password Option */}
              <button 
                className="dropdown-item py-2" 
                onClick={() => handleNavigate('/admin/change-password')}
                style={{ 
                  border: 'none', 
                  background: 'none', 
                  cursor: 'pointer', 
                  textDecoration: 'none',
                  display: 'block',
                  width: '100%',
                  textAlign: 'left'
                }}
              >
                🔐 Change Password
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
