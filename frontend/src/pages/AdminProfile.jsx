import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './AdminProfile.css';

const AdminProfile = () => {
  const { user, setUser, fetchProfile } = useAuth();
  const [profile, setProfile] = useState({
    username: '',
    full_name: '',
    email: '',
    role: '',
    avatar: null, // NEW: store avatar base64
  });
  const [avatarPreview, setAvatarPreview] = useState(null); // NEW: for image preview
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [sendingRecoveryTest, setSendingRecoveryTest] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        username: user.username || '',
        full_name: user.full_name || '',
        email: user.email || '',
        role: user.role || 'Admin',
        avatar: user.avatar || null,
      });
      // Set initial preview if avatar exists
      if (user.avatar) {
        setAvatarPreview(user.avatar);
      }
      setLoading(false);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // NEW: Handle avatar image upload using FormData
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file (JPG, PNG, etc.)' });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' });
      return;
    }

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('avatar', file);

      // Do not set Content-Type — axios must add multipart boundary automatically
      const response = await api.post('/auth/avatar', formData);

      // Update profile with the returned avatar URL
      if (response.data && response.data.avatarUrl) {
        const url = response.data.avatarUrl;
        setProfile((prev) => ({ ...prev, avatar: url }));
        setAvatarPreview(url);
        setUser((prev) => (prev ? { ...prev, avatar: url } : prev));
        setMessage({ type: 'success', text: 'Profile photo updated.' });
        await fetchProfile();
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      const errorMsg = error.response?.data?.message || 'Error uploading avatar. Please try again.';
      setMessage({ type: 'error', text: errorMsg });
    }
  };

  // NEW: Remove avatar
  const handleRemoveAvatar = () => {
    setProfile((prev) => ({ ...prev, avatar: null }));
    setAvatarPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await api.put('/auth/profile', {
        full_name: profile.full_name,
        email: profile.email,
        // Note: avatar is now handled separately via dedicated upload endpoint
      });
      
      if (response.data && response.data.user) {
        setUser(response.data.user);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (error) {
      console.error('Profile Update Error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update profile. Please try again.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const sendRecoveryTest = async () => {
    setSendingRecoveryTest(true);
    setMessage(null);
    try {
      const res = await api.post('/auth/recovery/test');
      setMessage({ type: 'success', text: res.data?.message || 'Test recovery email sent.' });
    } catch (error) {
      const errorMsg = error.friendlyMessage || error.response?.data?.message || 'Could not send test email.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSendingRecoveryTest(false);
    }
  };

  if (loading) return (
    <div className="profile-loading">
      <div className="loading-spinner-large"></div>
      <p>Loading your profile...</p>
    </div>
  );

  return (
    <div className="admin-profile-container">
      <div className="admin-profile-card">
        <header className="profile-header">
          <div className="header-content">
            <h2>Admin Profile Settings</h2>
            <p>Manage your account information and preferences.</p>
          </div>
        </header>

        {message && (
          <div className={`profile-message-container ${message.type}`}>
            <div className="message-icon">
              {message.type === 'success' ? '✅' : '❌'}
            </div>
            <div className="message-text">{message.text}</div>
            <button className="message-close" onClick={() => setMessage(null)}>✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">

          {/* NEW: Avatar Upload Section */}
          <div className="section-divider">
            <span>Profile Picture</span>
          </div>

          <div className="avatar-upload-section" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '24px', 
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            {/* Avatar Preview */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '12px'
            }}>
              <div 
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  backgroundColor: '#0f3a7d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  overflow: 'hidden',
                  border: '2px solid #e2e8f0',
                  backgroundImage: avatarPreview ? `url(${avatarPreview})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {!avatarPreview && profile.full_name?.charAt(0).toUpperCase()}
              </div>
              <button 
                type="button" 
                onClick={handleRemoveAvatar}
                disabled={!avatarPreview}
                style={{
                  backgroundColor: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: avatarPreview ? 'pointer' : 'not-allowed',
                  opacity: avatarPreview ? 1 : 0.5,
                  fontSize: '0.85rem'
                }}
              >
                Remove Image
              </button>
            </div>

            {/* Upload Controls */}
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                marginBottom: '12px',
                fontWeight: '600',
                color: '#0f172a'
              }}>
                Choose Image
              </label>
              <input 
                type="file" 
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{
                  display: 'block',
                  marginBottom: '12px',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  cursor: 'pointer'
                }}
              />
              <p style={{
                fontSize: '0.85rem',
                color: '#64748b',
                margin: '8px 0'
              }}>
                Supported formats: JPG, PNG, GIF, WebP, BMP
              </p>
            </div>
          </div>

          <div className="section-divider">
            <span>Account Information</span>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Username</label>
              <div className="input-wrapper disabled">
                <span className="input-icon">👤</span>
                <input type="text" value={profile.username} disabled className="disabled-input" />
              </div>
              <p className="field-hint">Username cannot be changed.</p>
            </div>

            <div className="form-group">
              <label>Role</label>
              <div className="input-wrapper disabled">
                <span className="input-icon">🛡️</span>
                <input type="text" value={profile.role} disabled className="disabled-input" />
              </div>
              <p className="field-hint">Your administrative role level.</p>
            </div>

            <div className="form-group">
              <label htmlFor="full_name">Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon">📝</span>
                <input 
                  type="text" 
                  id="full_name" 
                  name="full_name" 
                  value={profile.full_name || ''} 
                  onChange={handleChange} 
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">DepEd email (account recovery)</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={profile.email || ''} 
                  onChange={handleChange} 
                  placeholder="your.name@deped.gov.ph"
                  autoComplete="email"
                  required
                />
              </div>
              <p className="field-hint">
                This address is used if you are locked out or need a password reset link. Use your official DepEd email when possible.
              </p>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-save-modern" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner-small"></span>
                  Saving Changes...
                </>
              ) : (
                'Save Profile Changes'
              )}
            </button>
            {user?.role === 'SuperAdmin' && (
              <button
                type="button"
                className="btn-save-modern"
                onClick={sendRecoveryTest}
                disabled={sendingRecoveryTest}
                style={{ marginTop: 10, background: '#f1f5f9', color: '#0f172a' }}
              >
                {sendingRecoveryTest ? 'Sending test email…' : 'Send test recovery email'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;
