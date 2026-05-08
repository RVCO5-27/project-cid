import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdminLogin.css';

export default function CreateAdmin() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/create-admin/status');
        if (cancelled) return;
        if (!data?.available) {
          navigate('/admin/login', { replace: true });
          return;
        }
        setReady(true);
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/create-admin', { username, email, password, role: 'admin' });
      navigate('/admin/login', { replace: true, state: { fromBootstrap: true } });
    } catch (err) {
      const { status, data } = err.response || {};
      if (!err.response && err.message) {
        setError(
          err.code === 'ERR_NETWORK' || err.message === 'Network Error'
            ? 'Cannot reach the server. Start the API (port 5000) and keep this page on the same dev URL.'
            : err.message
        );
      } else if (status === 403) {
        setError(data?.message || 'Setup is already done. Sign in below.');
      } else if (status === 422 && data?.errors) {
        // Handle express-validator array of error objects
        const messages = Array.isArray(data.errors) 
          ? data.errors.map(e => typeof e === 'string' ? e : e.msg).join('; ')
          : 'Validation failed';
        setError(messages);
      } else if (status === 422 && data?.message) {
        setError(data.message);
      } else if (status === 409 && data?.message) {
        setError(data.message);
      } else if (status === 503 && data?.message) {
        setError(data.message);
      } else {
        setError(data?.message || 'Something went wrong');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <p className="admin-login-subtitle" style={{ margin: 0, textAlign: 'center' }}>
            Checking…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <h1 className="admin-login-title">First-time admin</h1>
          <p className="admin-login-subtitle">
            Only shown when no admin exists. Password: 8+ characters with upper, lower, and a number.
          </p>
        </div>

        {error && (
          <div className="admin-login-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={submit} noValidate>
          <div className="admin-login-field">
            <div className="admin-login-row">
              <input
                className="admin-login-input"
                name="username"
                autoComplete="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="admin-login-field">
            <div className="admin-login-row">
              <input
                className="admin-login-input"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="admin-login-field">
            <div className="admin-login-row">
              <input
                className="admin-login-input"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
            <label className="admin-login-remember" style={{ marginTop: '0.5rem' }}>
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                disabled={submitting}
              />
              <span>Show password</span>
            </label>
          </div>

          <button type="submit" className="admin-login-submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create admin'}
          </button>
        </form>

        <p className="admin-login-footer" style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/admin/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
