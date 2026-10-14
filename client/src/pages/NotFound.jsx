import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';

export default function NotFound() {
  const { t } = useLang();

  return (
    <div className="not-found-page">
      <div className="gradient-text not-found-code">404</div>
      <h2>{t('notFound.heading')}</h2>
      <p className="subtitle">{t('notFound.message')}</p>
      <Link to="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', padding: '0.8rem 2rem', borderRadius: '8px' }}>
        {t('notFound.back')}
      </Link>
    </div>
  );
}
