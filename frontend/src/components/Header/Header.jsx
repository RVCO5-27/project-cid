import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FaBell, FaCog, FaUser, FaSignOutAlt, FaKey } from 'react-icons/fa';
import './Header.css';

export default function Header({ adminArea = false }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAvatarClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (!user) return null;

  const mockNotifications = [
    { id: 1, title: 'New User Registered', time: '2 mins ago', unread: true, icon: '👤' },
    { id: 2, title: 'Carousel Updated', time: '1 hour ago', unread: false, icon: '🖼️' },
    { id: 3, title: 'System Backup Complete', time: 'Yesterday', unread: false, icon: '💾' },
  ];

  const unreadCount = mockNotifications.filter(n => n.unread).length;

  return (
    <header className={`header ${adminArea ? 'admin-header' : ''}`} role="banner">
      <div className="header-left">
        <h1 className="header-title">
          Building Futures: Strengthened SHS Implementation Dashboard
          {adminArea && (
            <span className="header-admin-pill" title="Signed-in administrators only">
              Admin
            </span>
          )}
        </h1>
      </div>

      {adminArea && (
        <div className="header-right">
          {/* Always show container, placeholder if user not loaded */}
          {/* Notification System */}
          <div className="notification-container" ref={notifRef}>
            <div 
              className={`admin-notification ${user?.role === 'admin' || user?.role === 'SuperAdmin' ? 'main-admin' : ''} ${notifOpen ? 'active' : ''}`}
              onClick={() => {
                if (!user) return;
                setNotifOpen(!notifOpen);
                setIsDropdownOpen(false);
              }}
              title={user?.role === 'admin' || user?.role === 'SuperAdmin' ? 'Main Admin Notifications' : 'Notifications'}
              aria-label="Admin Notifications"
              role="button"
              tabIndex="0"
              onKeyDown={(e) => e.key === 'Enter' && setNotifOpen(!notifOpen)}
            >
              <span className="notification-icon">🔔</span>
              {unreadCount > 0 && (
                <span className="unread-dot" aria-hidden="true">{unreadCount}</span>
              )}
              {(user?.role === 'admin' || user?.role === 'SuperAdmin') && (
                <span className="admin-badge" aria-label="Main Admin Privileges">★</span>
              )}
            </div>

            {notifOpen && (
              <div className="notification-dropdown">
                <div className="dropdown-header">
                  <strong>Notifications</strong>
                  <span className="mark-read" role="button" tabIndex="0">Mark all as read</span>
                </div>
                <div className="dropdown-divider"></div>
                <div className="notification-list">
                  {mockNotifications.map(n => (
                    <div key={n.id} className={`notification-item ${n.unread ? 'unread' : ''}`}>
                      <div className="notification-icon-circle">{n.icon}</div>
                      <div className="notification-content">
                        <span className="notification-title">{n.title}</span>
                        <span className="notification-time">{n.time}</span>
                      </div>
                      {n.unread && <div className="unread-indicator-dot"></div>}
                    </div>
                  ))}
                </div>
                <div className="dropdown-divider"></div>
                <button className="view-all">View all notifications</button>
              </div>
            )}
          </div>

          {/* Quick Settings Shortcut */}
          <div 
            className="header-action-icon" 
            title="System Settings" 
            onClick={() => navigate('/admin/dashboard')}
            role="button"
            tabIndex="0"
          >
            <span>⚙️</span>
          </div>

          <div className="profile-container" ref={profileRef}>
            <div 
              className="user-profile-trigger" 
              onClick={() => {
                if (!user) return;
                setIsDropdownOpen(!isDropdownOpen);
                setNotifOpen(false);
              }}
              title={user ? `Logged in as ${user.full_name || user.username}` : 'Loading profile...'}
              aria-label="User Profile Menu"
              role="button"
              tabIndex="0"
              onKeyDown={(e) => e.key === 'Enter' && setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="user-info">
                <span className="user-name">{user ? (user.full_name || user.username) : '...'}</span>
                <span className="user-role">{user ? user.role : 'Admin'}</span>
              </div>
              <div className="user-initial-circle">
                {(user?.full_name || user?.username || 'A').charAt(0).toUpperCase()}
              </div>
            </div>
            
            {isDropdownOpen && (
              <div className={`profile-dropdown shadow-lg ${isDropdownOpen ? 'show' : ''}`} ref={dropdownRef}>
                <div className="dropdown-header">
                  <div className="user-profile-summary">
                    <div className="user-initial-small">
                      {(user?.full_name || user?.username || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="user-text-summary">
                      <strong>{user?.full_name || user?.username}</strong>
                      <span>{user?.email}</span>
                    </div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <ul className="list-unstyled mb-0 mt-2">
                  <li>
                    <Link to="/admin/profile" className="dropdown-item d-flex align-items-center py-2" onClick={() => setIsDropdownOpen(false)}>
                      <FaUser className="me-2" /> Edit Profile
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin/change-password" className="dropdown-item d-flex align-items-center py-2" onClick={() => setIsDropdownOpen(false)}>
                      <FaKey className="me-2" /> Change Password
                    </Link>
                  </li>
                  <div className="dropdown-divider"></div>
                  <li>
                    <button onClick={handleLogout} className="dropdown-item logout d-flex align-items-center py-2">
                      <FaSignOutAlt className="me-2" /> Log Out
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

    </header>
  );
}
