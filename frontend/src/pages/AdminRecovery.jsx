import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import './AdminLogin.css';

export default function AdminRecovery() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = params.get('token');
    if (!token || token.length !== 64) {
      setLoading(false);
      setError('Invalid recovery link. Contact ICT if you need a new one.');
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await api.post('/auth/recovery/consume', { token });
        if (cancelled) return;
        if (res.data?.token) {
          localStorage.setItem('token', res.data.token);
          navigate('/admin/change-password', { replace: true });
        }
      } catch (err) {
        if (cancelled) return;
        setLoading(false);
        setError(err.response?.data?.message || 'This link is invalid or has expired.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, navigate]);

  return (
    <div className="admin-login-page">
      <div className="admin-login-card" style={{ maxWidth: 440 }}>
        <h1 className="admin-login-title" style={{ textAlign: 'center' }}>
          Account recovery
        </h1>
        <p className="admin-login-subtitle" style={{ textAlign: 'center' }}>
          Securing your administrator access · SDO Cabuyao SHS Portal
        </p>
        {loading && !error && (
          <p className="admin-login-secure-note" style={{ border: 'none', marginTop: '1rem' }}>
            Verifying your secure link…
          </p>
        )}
        {error && (
          <div className="admin-login-error" role="alert">
            {error}
          </div>
        )}
        <p className="admin-login-footer">
          <Link to="/admin/login">Back to sign-in</Link>
          {' · '}
          <Link to="/home">Public portal</Link>
        </p>
      </div>
    </div>
  );
}
