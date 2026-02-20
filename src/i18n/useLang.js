import { useState, useCallback, useMemo } from 'react';
import { strings } from './strings';

const STORAGE_KEY = 'bp-tracker-lang';
const DEFAULT_LANG = 'gu'; // Gujarati as default

export function useLang() {
  // Initialize from localStorage or default to Gujarati
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'gu' || saved === 'en' ? saved : DEFAULT_LANG;
    } catch (error) {
      console.error('Error loading language preference:', error);
      return DEFAULT_LANG;
    }
  });

  // Persist language choice to localStorage
  const setLang = useCallback((newLang) => {
    if (newLang !== 'gu' && newLang !== 'en') {
      console.warn('Invalid language code:', newLang);
      return;
    }

    setLangState(newLang);

    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  }, []);

  // Memoize current language strings
  const currentStrings = useMemo(() => strings[lang], [lang]);

  // Translation helper function - optimized with useCallback
  // Usage: t('login.title') or t('appTitle')
  const t = useCallback((key) => {
    const keys = key.split('.');
    let value = currentStrings;

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key} for language: ${lang}`);
        return key; // Return the key itself if translation not found
      }
    }

    return value || key;
  }, [currentStrings, lang]);

  // Toggle between languages - optimized with useCallback
  const toggleLang = useCallback(() => {
    setLang(lang === 'gu' ? 'en' : 'gu');
  }, [lang, setLang]);

  return {
    lang,      // Current language code ('gu' or 'en')
    setLang,   // Set language function
    t,         // Translation function
    toggleLang // Toggle between languages
  };
}
