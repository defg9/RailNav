import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../context/LangContext';

export default function Navbar({ station }) {
  const { lang, setLang, t } = useLang();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const toggleLang = () => setLang(lang === 'en' ? 'hi' : 'en');

  return (
    <nav className="navbar glass-navbar" role="navigation" aria-label={t('nav.mainNavigation')}>
      <div className="navbar-left">
        {isHome ? (
          <span className="navbar-brand gradient-text">{t('nav.appName')}</span>
        ) : (
          <>
            <Link to="/" className="back-link" aria-label={t('nav.backToStations')}>
              {t('nav.backToStations')}
            </Link>
            {station && (
              <div className="navbar-station">
                <span className="navbar-station-icon">🚉</span>
                <div className="navbar-station-text">
                  <span className="navbar-station-name">
                    {lang === 'hi' && station.name_hi ? station.name_hi : station.name}
                  </span>
                  {station.code && (
                    <span className="badge code-badge">{station.code}</span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="navbar-right">
        <button
          id="lang-toggle-btn"
          className="lang-toggle"
          onClick={toggleLang}
          aria-label={lang === 'en' ? t('nav.switchToHindi') : t('nav.switchToEnglish')}
          title={t('nav.langToggle')}
        >
          <span className="lang-icon">🌐</span>
          <span>{t('nav.langToggle')}</span>
        </button>
      </div>
    </nav>
  );
}
