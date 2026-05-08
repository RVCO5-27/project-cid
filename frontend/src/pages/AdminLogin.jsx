import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AdminLogin.css';

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function formatMmSs(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AdminLogin() {
  const { fetchProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [lockEndMs, setLockEndMs] = useState(null);
  const [lockSecondsRemaining, setLockSecondsRemaining] = useState(0);
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state;

  const locked = lockEndMs != null && lockSecondsRemaining > 0;

  useEffect(() => {
    if (lockEndMs == null) return undefined;
    const tick = () => {
      const s = Math.max(0, Math.ceil((lockEndMs - Date.now()) / 1000));
      setLockSecondsRemaining(s);
      if (s <= 0) {
        setLockEndMs(null);
        setError(null);
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [lockEndMs]);

  const dismissToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const pushSecurityToast = useCallback(
    (message) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      setToasts((t) => [...t, { id, message }]);
      window.setTimeout(() => dismissToast(id), 4000);
    },
    [dismissToast]
  );

  const submit = async (e) => {
    e.preventDefault();
    if (locked) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      if (res.data) {
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
        }
        if (res.data.mustChangePassword) {
          navigate('/admin/change-password', { replace: true });
          return;
        }
        await fetchProfile();
        const dest =
          locationState?.from && String(locationState.from).startsWith('/admin')
            ? locationState.from
            : '/admin/dashboard';
        navigate(dest, { replace: true });
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      const { status, data } = err.response || {};
      if (status === 429 && data?.retryAfterSeconds != null) {
        const secs = Number(data.retryAfterSeconds);
        const until = Date.now() + secs * 1000;
        setLockEndMs(until);
        setLockSecondsRemaining(secs);
        setError(data.message || 'Too many attempts. Please wait.');
      } else if (status === 403 && data?.code === 'ACCOUNT_BLOCKED') {
        setLockEndMs(null);
        setError(data.message || 'Account blocked.');
      } else {
        setError(data?.message || 'Login failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting || locked;

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <div className="admin-login-icon" aria-hidden="true">
            <UserIcon />
          </div>
          <h1 className="admin-login-title">Sign in</h1>
          <p className="admin-login-subtitle">
            Administrator access · SDO Cabuyao City
            <br />
            Building Futures · Strengthened SHS Implementation
          </p>
        </div>

        {error && (
          <div className="admin-login-error" role="alert">
            {error}
            {locked && (
              <div className="admin-login-lock-timer" aria-live="polite">
                Try again in {formatMmSs(lockSecondsRemaining)} ({lockSecondsRemaining}s)
              </div>
            )}
          </div>
        )}

        <form onSubmit={submit} noValidate>
          <div className="admin-login-field">
            <label htmlFor="admin-username" className="visually-hidden">
              Username
            </label>
            <div className="admin-login-row">
              <UserIcon />
              <input
                id="admin-username"
                className="admin-login-input"
                name="username"
                autoComplete="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="admin-login-field">
            <label htmlFor="admin-password" className="visually-hidden">
              Password
            </label>
            <div className="admin-login-row">
              <LockIcon />
              <input
                id="admin-password"
                className="admin-login-input"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={disabled}
              />
              <button
                type="button"
                className="admin-login-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-pressed={showPassword}
                disabled={disabled}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="admin-login-options">
            <label className="admin-login-remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={disabled}
              />
              Remember me
            </label>
          </div>

          <button type="submit" className="admin-login-submit" disabled={disabled}>
            {locked ? 'Temporarily locked' : submitting ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <p className="admin-login-footer">
          Visiting as a guest?{' '}
          <Link to="/home">Return to public portal</Link>
        </p>

        <p className="admin-login-secure-note">
          For security, there is no open password reset form. After repeated failed sign-ins, your
          account may be blocked and a one-time recovery link is sent to the recovery email saved in
          your profile. If you do not receive it, check Spam first, then contact ICT.
        </p>
      </div>

      <div className="admin-login-toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="admin-login-toast" role="status">
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
