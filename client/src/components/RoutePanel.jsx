import React, { useState, useMemo } from 'react';
import { useLang } from '../context/LangContext';

const NEAREST_TYPES = [
  { type: 'restroom', icon: '🚻' },
  { type: 'food',     icon: '🍔' },
  { type: 'helpdesk', icon: 'ℹ️' },
  { type: 'ticket',   icon: '🎫' },
  { type: 'lift',     icon: '🛗' },
  { type: 'entrance', icon: '🚪' },
  { type: 'waiting',  icon: '💺' },
];

export default function RoutePanel({
  nodes,
  onFindRoute,
  onNearest,
  routeResult,
  loading,
  error,
  activeStep,
  setActiveStep,
}) {
  const { lang, t } = useLang();

  const [from, setFrom]         = useState('');
  const [to, setTo]             = useState('');
  const [accessible, setAccessible] = useState(false);
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch]     = useState('');

  // Node display label: prefer name_hi when Hindi is active
  const nodeLabel = (n) => (lang === 'hi' && n.name_hi ? n.name_hi : n.name);

  // Filtered lists for dropdowns
  const filteredFrom = useMemo(() =>
    nodes.filter(n => {
      const q = fromSearch.toLowerCase();
      return n.name.toLowerCase().includes(q) ||
             (n.name_hi && n.name_hi.includes(fromSearch));
    }), [nodes, fromSearch]);

  const filteredTo = useMemo(() =>
    nodes.filter(n => {
      const q = toSearch.toLowerCase();
      return n.name.toLowerCase().includes(q) ||
             (n.name_hi && n.name_hi.includes(toSearch));
    }), [nodes, toSearch]);

  const fromNode = nodes.find(n => n.id === parseInt(from));
  const toNode   = nodes.find(n => n.id === parseInt(to));

  const handleRoute = (e) => {
    e.preventDefault();
    if (from && to) onFindRoute(from, to, accessible);
  };

  // Directions language key from locale
  const dirLangKey = t('panel.results.dirLang'); // 'en' or 'hi'

  return (
    <div className="route-panel glass-panel">
      <h2 className="panel-title">
        <span className="panel-title-icon">🧭</span> {t('panel.title')}
      </h2>

      <form onSubmit={handleRoute} className="route-form">
        {/* FROM */}
        <div className="input-group">
          <label htmlFor="from-search">{t('panel.fromLabel')}</label>
          <input
            id="from-search"
            type="text"
            placeholder={t('panel.fromPlaceholder')}
            value={fromNode ? nodeLabel(fromNode) : fromSearch}
            onChange={e => { setFromSearch(e.target.value); setFrom(''); }}
            className="node-search"
            autoComplete="off"
            lang={lang}
          />
          {fromSearch && !from && (
            <ul className="node-dropdown" role="listbox">
              {filteredFrom.length === 0 && (
                <li className="node-dropdown-empty">{t('panel.noResults')}</li>
              )}
              {filteredFrom.map(n => (
                <li
                  key={n.id}
                  role="option"
                  className="node-dropdown-item"
                  onClick={() => { setFrom(String(n.id)); setFromSearch(''); }}
                >
                  <span className="dd-name">{nodeLabel(n)}</span>
                  {n.name_hi && lang === 'en' && <span className="dd-hi">{n.name_hi}</span>}
                  {lang === 'hi' && <span className="dd-hi">{n.name}</span>}
                  <span className="dd-floor">
                    {n.floor === 0 ? t('map.ground') : `${t('map.floor')} ${n.floor}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {from && (
            <button type="button" className="clear-btn"
              onClick={() => { setFrom(''); setFromSearch(''); }}>
              {t('panel.clear')}
            </button>
          )}
        </div>

        {/* TO */}
        <div className="input-group">
          <label htmlFor="to-search">{t('panel.toLabel')}</label>
          <input
            id="to-search"
            type="text"
            placeholder={t('panel.toPlaceholder')}
            value={toNode ? nodeLabel(toNode) : toSearch}
            onChange={e => { setToSearch(e.target.value); setTo(''); }}
            className="node-search"
            autoComplete="off"
            lang={lang}
          />
          {toSearch && !to && (
            <ul className="node-dropdown" role="listbox">
              {filteredTo.length === 0 && (
                <li className="node-dropdown-empty">{t('panel.noResults')}</li>
              )}
              {filteredTo.map(n => (
                <li
                  key={n.id}
                  role="option"
                  className="node-dropdown-item"
                  onClick={() => { setTo(String(n.id)); setToSearch(''); }}
                >
                  <span className="dd-name">{nodeLabel(n)}</span>
                  {n.name_hi && lang === 'en' && <span className="dd-hi">{n.name_hi}</span>}
                  {lang === 'hi' && <span className="dd-hi">{n.name}</span>}
                  <span className="dd-floor">
                    {n.floor === 0 ? t('map.ground') : `${t('map.floor')} ${n.floor}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {to && (
            <button type="button" className="clear-btn"
              onClick={() => { setTo(''); setToSearch(''); }}>
              {t('panel.clear')}
            </button>
          )}
        </div>

        {/* Accessible toggle */}
        <label className="checkbox-label">
          <div
            className={`toggle ${accessible ? 'on' : ''}`}
            onClick={() => setAccessible(a => !a)}
            role="switch"
            aria-checked={accessible}
            tabIndex={0}
            onKeyDown={e => e.key === ' ' && setAccessible(a => !a)}
          >
            <span className="toggle-thumb" />
          </div>
          <span>
            {t('panel.accessible')}
            <span className="checkbox-hint"> {t('panel.accessibleHint')}</span>
          </span>
        </label>

        <button
          type="submit"
          id="find-route-btn"
          className="btn-primary"
          disabled={loading || !from || !to}
        >
          {loading ? <><span className="spinner" /> {t('panel.calculating')}</> : t('panel.findRoute')}
        </button>
      </form>

      {/* Nearest facility */}
      <div className="nearest-actions">
        <p className="nearest-title">{t('panel.nearestTitle')}</p>
        <div className="nearest-grid">
          {NEAREST_TYPES.map(({ type, icon }) => (
            <button
              key={type}
              id={`nearest-${type}-btn`}
              className="btn-nearest"
              disabled={!from || loading}
              onClick={() => from && onNearest(from, type, accessible)}
              title={t(`panel.nearest.${type}`)}
            >
              <span className="nearest-icon">{icon}</span>
              <span>{t(`panel.nearest.${type}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-message" role="alert">
          <span className="error-icon">⚠️</span> {error}
        </div>
      )}

      {/* Results */}
      {routeResult && !error && (
        <div className="route-results">
          <div className="route-summary">
            <div className="summary-chip">
              <span>📏</span>
              <strong>{Math.round(routeResult.distance_meters ?? routeResult.distance ?? 0)} m</strong>
            </div>
            <div className="summary-chip">
              <span>⏱️</span>
              <strong>{(routeResult.eta_minutes ?? 0).toFixed(1)} {t('panel.results.min')}</strong>
            </div>
            <div className="summary-chip">
              <span>📍</span>
              <strong>{routeResult.path?.length ?? 0} {t('panel.results.stops')}</strong>
            </div>
          </div>

          <h3 className="directions-heading">{t('panel.results.directions')}</h3>
          <ul className="directions-list">
            {(routeResult.directions?.[dirLangKey] ?? routeResult.directions?.en ?? []).map((dir, i) => (
              <li
                key={i}
                className={`direction-step ${activeStep === i ? 'active' : ''}`}
                onClick={() => setActiveStep(activeStep === i ? -1 : i)}
                lang={dirLangKey}
              >
                <span className="step-num">{i + 1}</span>
                <span>{dir}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
