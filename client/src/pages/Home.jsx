import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStations } from '../api';
import { useLang } from '../context/LangContext';

export default function Home() {
  const { lang, t } = useLang();
  const [stations, setStations] = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Clear station-bridge so Navbar shows nothing on the home page
  useEffect(() => { window.__railnavStation = null; }, []);

  useEffect(() => {
    getStations()
      .then(res => setStations(res.data))
      .catch(() => setError(t('home.loadError')))
      .finally(() => setLoading(false));
  }, []); // only on mount; lang changes re-render but don't refetch

  const filtered = stations.filter(s => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.name_hi && s.name_hi.includes(search)) ||
      (s.code  && s.code.toLowerCase().includes(q)) ||
      (s.city  && s.city.toLowerCase().includes(q))
    );
  });

  const stationLabel = (s) => (lang === 'hi' && s.name_hi ? s.name_hi : s.name);

  return (
    <div className="home-page">
      {/* Hero */}
      <header className="hero-section glass-panel">
        <h1 className="gradient-text hero-title">{t('home.title')}</h1>
        <p className="hero-sub">{t('home.subtitle')}</p>

        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            id="station-search"
            type="text"
            placeholder={t('home.searchPlaceholder')}
            className="search-bar"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoComplete="off"
            lang={lang}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        <p className="search-hint">
          {t(filtered.length === 1 ? 'home.stationsFound_one' : 'home.stationsFound_other', { count: filtered.length })}
        </p>
      </header>

      {/* Loading */}
      {loading && (
        <div className="state-message">
          <span className="spinner large" />
          <p>{t('home.loading')}</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="error-message centered">
          <span className="error-icon">⚠️</span> {t('home.loadError')}
        </div>
      )}

      {/* Grid */}
      {!loading && !error && (
        <div className="station-grid">
          {filtered.map(st => (
            <Link
              key={st.id}
              to={`/station/${st.id}`}
              className="station-card glass-panel interactive"
            >
              <div className="card-top">
                <span className="station-icon">🚉</span>
                <span className="badge code-badge">{st.code}</span>
              </div>
              <h2 className="card-name">{stationLabel(st)}</h2>
              {/* Show the alternate-language name below */}
              {lang === 'hi' && st.name_hi
                ? <p className="card-name-secondary">{st.name}</p>
                : st.name_hi && <p className="card-name-hi">{st.name_hi}</p>
              }
              <p className="subtitle">{st.city}</p>
              <div className="card-footer">
                <span className="nav-arrow">{t('home.navigate')}</span>
              </div>
            </Link>
          ))}

          {filtered.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">🔎</span>
              <p>{t('home.noResults')} "<strong>{search}</strong>"</p>
              <button className="btn-small" onClick={() => setSearch('')}>
                {t('home.clearSearch')}
              </button>
            </div>
          )}
        </div>
      )}

      <footer className="home-footer">
        <p>
          {t('home.footer')}
          <span className="footer-separator"> · </span>
          <Link to="/admin" className="admin-footer-link" id="admin-footer-link">
            {t('admin.link')}
          </Link>
        </p>
      </footer>
    </div>
  );
}
