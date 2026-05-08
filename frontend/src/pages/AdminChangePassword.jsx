import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { passwordChecks, strengthLevel } from '../utils/passwordStrength';
import { parseJwtPayload } from '../utils/jwtPayload';
import './AdminLogin.css';
import './AdminChangePassword.css';

function CheckRow({ ok, label }) {
  return (
    <div className={`admin-pw-check ${ok ? 'admin-pw-check--ok' : ''}`}>
      <span aria-hidden="true">{ok ? '✔' : '○'}</span> {label}
    </div>
  );
}

export default function AdminChangePassword() {
  const { fetchProfile } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const payload = useMemo(() => parseJwtPayload(token), [token]);
  const mustChange = payload?.mustChangePassword === true;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const checks = passwordChecks(newPassword);
  const level = strengthLevel(newPassword);
  const barClass =
    level === 0 ? 'admin-pw-bar__fill--weak' : level === 1 ? 'admin-pw-bar__fill--medium' : 'admin-pw-bar__fill--strong';

  if (!token) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <p className="admin-login-error">You need to sign in first.</p>
          <Link to="/admin/login">Go to sign-in</Link>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirm) {
      setError('New password and confirmation do not match.');
      return;
    }
    const allOk = checks.length && checks.upper && checks.lower && checks.number && checks.symbol && checks.notBanned;
    if (!allOk) {
      setError('Please meet all password requirements below.');
      return;
    }
    setSubmitting(true);
    try {
      const body = mustChange ? { newPassword } : { currentPassword, newPassword };
      const res = await api.post('/auth/change-password', body);
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
        await fetchProfile();
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Could not update password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card" style={{ maxWidth: 440 }}>
        <h1 className="admin-login-title" style={{ textAlign: 'center' }}>
          {mustChange ? 'Create a new password' : 'Change password'}
        </h1>
        <p className="admin-login-subtitle" style={{ textAlign: 'center' }}>
          {mustChange
            ? 'Your account requires a strong password before you can use the admin console.'
            : 'Use a strong passphrase that you do not reuse elsewhere.'}
        </p>

        {error && (
          <div className="admin-login-error" role="alert">
            {error}
          </div>
        )}

        <div className="admin-pw-strength" aria-live="polite">
          <div className="admin-pw-bar">
            <div className={`admin-pw-bar__fill ${barClass}`} style={{ width: `${((level + 1) / 3) * 100}%` }} />
          </div>
          <span className="admin-pw-strength-label">
            {level === 0 && 'Weak'}
            {level === 1 && 'Medium'}
            {level === 2 && 'Strong'}
          </span>
        </div>

        <div className="admin-pw-checklist">
          <CheckRow ok={checks.length} label="8–12 characters" />
          <CheckRow ok={checks.upper} label="Uppercase letter" />
          <CheckRow ok={checks.lower} label="Lowercase letter" />
          <CheckRow ok={checks.number} label="Number" />
          <CheckRow ok={checks.symbol} label="Symbol" />
          <CheckRow ok={checks.notBanned} label="Not a common password" />
        </div>

        <form onSubmit={submit} className="admin-pw-form">
          {!mustChange && (
            <div className="admin-login-field">
              <label htmlFor="cur-pw" className="visually-hidden">
                Current password
              </label>
              <div className="admin-login-row">
                <input
                  id="cur-pw"
                  className="admin-login-input"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          )}
          <div className="admin-login-field">
            <label htmlFor="new-pw" className="visually-hidden">
              New password
            </label>
            <div className="admin-login-row">
              <input
                id="new-pw"
                className="admin-login-input"
                type="password"
                autoComplete="new-password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>
          <div className="admin-login-field">
            <label htmlFor="cf-pw" className="visually-hidden">
              Confirm new password
            </label>
            <div className="admin-login-row">
              <input
                id="cf-pw"
                className="admin-login-input"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>
          <button type="submit" className="admin-login-submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Update password'}
          </button>
        </form>

        <p className="admin-login-footer">
          <Link
            to="/admin/login"
            onClick={() => {
              localStorage.removeItem('token');
            }}
          >
            Sign out and return to login
          </Link>
        </p>
      </div>
    </div>
  );
}
