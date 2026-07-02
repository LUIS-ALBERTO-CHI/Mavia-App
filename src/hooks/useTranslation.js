import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { translate } from '../lib/i18n';

/**
 * useTranslation — returns a `t(key, params?)` function that resolves
 * strings in the current app language (ES / EN / FR).
 *
 * Usage:
 *   const { t, lang } = useTranslation();
 *   t('nav.home')               → 'Home' | 'Accueil' | 'Inicio'
 *   t('auth.welcome', { name }) → 'Bienvenida, María'
 */
export function useTranslation() {
  const { state, dispatch } = useApp();
  const lang = state.language || 'es';

  const t = useCallback(
    (key, params) => translate(lang, key, params),
    [lang]
  );

  const setLang = useCallback(
    (code) => dispatch({ type: 'SET_LANGUAGE', language: code }),
    [dispatch]
  );

  return { t, lang, setLang };
}
