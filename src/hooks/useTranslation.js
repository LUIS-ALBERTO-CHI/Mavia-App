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
  // App solo en español. Se ignora cualquier idioma guardado.
  const lang = 'es';

  const t = useCallback(
    (key, params) => translate('es', key, params),
    []
  );

  const setLang = useCallback(() => {}, []);   // no-op (sin selector de idioma)

  return { t, lang, setLang };
}
