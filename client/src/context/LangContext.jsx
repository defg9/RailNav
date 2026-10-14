import React, { createContext, useContext, useState, useCallback } from 'react';
import en from '../locales/en.json';
import hi from '../locales/hi.json';

const LOCALES = { en, hi };
const STORAGE_KEY = 'railnav_lang';

const LangContext = createContext(null);

/**
 * Resolve a dot-separated key like "panel.nearest.restroom" against a locale object.
 * Supports a single {{count}} interpolation for plurals.
 */
function resolve(obj, key, vars = {}) {
  const parts = key.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return key;
    cur = cur[p];
  }
  if (cur == null) return key;

  // Plural support: key_one / key_other
  if (vars.count !== undefined) {
    const pluralKey = vars.count === 1 ? `${parts.at(-1)}_one` : `${parts.at(-1)}_other`;
    const parent = parts.slice(0, -1).reduce((o, k) => o?.[k], obj);
    const pluralStr = parent?.[pluralKey];
    if (pluralStr) cur = pluralStr;
  }

  if (typeof cur !== 'string') return key;
  return cur.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] ?? `{{${k}}}`));
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'en'
  );

  const setLang = useCallback((l) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  }, []);

  const t = useCallback(
    (key, vars = {}) => resolve(LOCALES[lang], key, vars),
    [lang]
  );

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

/** Primary hook — use anywhere inside LangProvider */
export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}
