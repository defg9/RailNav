import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { loginAdmin } from '../api';

export default function AdminLogin() {
  const { isAuthenticated, login, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError(t('admin.invalidCredentials'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await loginAdmin({ username: username.trim(), password });
      if (res.data?.token) {
        login(res.data.token);
        navigate('/admin', { replace: true });
      } else {
        setError(t('admin.invalidCredentials'));
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || t('admin.invalidCredentials');
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-card glass-panel">
        <div className="admin-card-header">
          <span className="admin-badge">🔐</span>
          <h1 className="admin-title gradient-text">{t('admin.loginTitle')}</h1>
          <p className="admin-subtitle">{t('admin.loginSubtitle')}</p>
        </div>

        {isAuthenticated ? (
          <div className="admin-session-active">
            <div className="success-banner">
              <span>✓</span> {t('admin.alreadyLoggedIn')}
            </div>
            <div className="admin-btn-group">
              <Link to="/admin" className="btn-primary admin-btn">
                {t('admin.goToDashboard')} →
              </Link>
              <button
                id="admin-logout-btn"
                type="button"
                className="btn-danger admin-btn"
                onClick={logout}
              >
                {t('admin.logoutBtn')}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="admin-form" id="admin-login-form">
            {error && (
              <div className="error-message admin-error" id="admin-login-error" role="alert">
                <span className="error-icon">⚠️</span> {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="admin-username">{t('admin.usernameLabel')}</label>
              <input
                id="admin-username"
                type="text"
                className="form-input"
                placeholder={t('admin.usernamePlaceholder')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-password">{t('admin.passwordLabel')}</label>
              <input
                id="admin-password"
                type="password"
                className="form-input"
                placeholder={t('admin.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </div>

            <div className="admin-form-actions">
              <button
                id="admin-login-btn"
                type="submit"
                className="btn-primary admin-btn"
                disabled={loading}
              >
                {loading ? t('admin.loggingIn') : t('admin.loginBtn')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
