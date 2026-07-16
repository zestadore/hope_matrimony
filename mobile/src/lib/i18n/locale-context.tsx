import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { api, setApiLocale } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';

import { optionLabel } from './option-labels';
import {
  DEFAULT_LOCALE,
  isLocale,
  translations,
  type Locale,
  type TranslationKey,
} from './translations';

const LOCALE_KEY = 'locale';

export type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/**
 * Must render inside AuthProvider — it reconciles the device's choice with the
 * `locale` stored on the user record once a session is restored.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Distinguishes "the user has never picked a language" from "the user picked
  // English". Only an explicit pick outranks the locale on their account.
  const hasDeviceChoice = useRef(false);
  const hydrated = useRef(false);

  useEffect(() => {
    (async () => {
      const stored = await storage.getItem(LOCALE_KEY);
      if (isLocale(stored)) {
        hasDeviceChoice.current = true;
        setLocaleState(stored);
        setApiLocale(stored);
      }
      hydrated.current = true;
    })();
  }, []);

  const setLocale = useCallback((next: Locale) => {
    hasDeviceChoice.current = true;
    setLocaleState(next);
    setApiLocale(next);
    void storage.setItem(LOCALE_KEY, next);
  }, []);

  // Reconcile with the account once signed in. A language picked on this device
  // (e.g. on the login screen) is the more recent intent, so it wins and is
  // pushed up; otherwise a fresh install inherits the account's language.
  useEffect(() => {
    if (!user || !hydrated.current) return;

    const accountLocale = isLocale(user.locale) ? user.locale : null;

    if (hasDeviceChoice.current) {
      if (accountLocale !== locale) {
        // Best-effort: a failed sync leaves the device correct and the account
        // stale, which self-corrects on the next change.
        void api.put('/auth/locale', { locale }).catch(() => {});
      }
      return;
    }

    if (!accountLocale || accountLocale === locale) return;

    (async () => {
      // Persist before adopting, so a reload can't land back on the default
      // and re-run this against a stale account value.
      await storage.setItem(LOCALE_KEY, accountLocale);
      hasDeviceChoice.current = true;
      setApiLocale(accountLocale);
      setLocaleState(accountLocale);
    })();
  }, [user, locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => interpolate(translations[locale][key] ?? translations[DEFAULT_LOCALE][key], vars),
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider');
  return ctx;
}

/** Convenience for the common case of only needing `t`. */
export function useTranslation(): Translate {
  return useLocale().t;
}

/**
 * Localises the fixed-choice option lists from /lookups for display, keeping
 * the English value as the value sent back to the API. Values we don't
 * translate (the admin-managed lookups) pass through unchanged.
 */
export function useOptionLabel(): (value: string) => string {
  const { locale } = useLocale();
  return useCallback((value: string) => optionLabel(locale, value), [locale]);
}

/**
 * Builds SelectField options from a /lookups list, showing the localised label
 * while keeping the stored English value.
 */
export function useToOptions(): (values: string[]) => { label: string; value: string }[] {
  const label = useOptionLabel();
  return useCallback(
    (values: string[]) => values.map((value) => ({ label: label(value), value })),
    [label],
  );
}
