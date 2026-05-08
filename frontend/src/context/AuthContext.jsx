import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { friendlyHttpMessage } from '../utils/httpMessages';

const AuthContext = createContext(null);

let refreshAuthFn = null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    // Keep `loading` true while rehydrating auth on refresh.
    setLoading(true);
    try {
      const res = await api.get('/auth/profile');
      setUser(res.data);
    } catch (err) {
      const status = err.response?.status;
      // Unauthenticated is normal before login (HttpOnly cookie cannot be probed client-side).
      if (status !== 401 && status !== 403) {
        console.error('Failed to fetch profile:', err);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAuthFn = fetchProfile;
    return () => { refreshAuthFn = null; };
  }, []);

  useEffect(() => {
    // Always attempt to restore a session on first load.
    // Works for /admin routes and for deployments served from a sub-path (where pathname may not start with /admin).
    fetchProfile();
  }, []);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout failed:', err.friendlyMessage || err?.message || err);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      setUser(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/auth/profile', profileData);
      setUser(res.data.user || res.data); // Update local user state
      return res.data;
    } catch (err) {
      const msg = err.friendlyMessage || friendlyHttpMessage(err);
      err.friendlyMessage = msg;
      console.error('Update profile failed:', msg);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, fetchProfile, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const refreshAuth = async () => {
  if (refreshAuthFn) {
    await refreshAuthFn();
  }
};
