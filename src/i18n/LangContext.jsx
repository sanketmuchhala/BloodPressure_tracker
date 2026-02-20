import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { strings } from './strings';

const STORAGE_KEY = 'bp-tracker-lang';
const DEFAULT_LANG = 'gu';

// ── Context ─────────────────────────────────────────────────────────────────
export const LangContext = createContext(null);

/**
 * Wrap your app tree with this provider once (in main.jsx / App.jsx).
 * Every component that calls useLang() will share this single state.
 */
export function LangProvider({ children }) {
    const [lang, setLangState] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved === 'gu' || saved === 'en' ? saved : DEFAULT_LANG;
        } catch {
            return DEFAULT_LANG;
        }
    });

    const setLang = useCallback((newLang) => {
        if (newLang !== 'gu' && newLang !== 'en') return;
        setLangState(newLang);
        try { localStorage.setItem(STORAGE_KEY, newLang); } catch { }
    }, []);

    const toggleLang = useCallback(() => {
        setLang(lang === 'gu' ? 'en' : 'gu');
    }, [lang, setLang]);

    const currentStrings = useMemo(() => strings[lang], [lang]);

    const t = useCallback((key) => {
        const keys = key.split('.');
        let value = currentStrings;
        for (const k of keys) {
            if (value && typeof value === 'object') value = value[k];
            else return key;
        }
        return value || key;
    }, [currentStrings]);

    /**
     * Format a Date using the active locale.
     * In Gujarati: words (month/weekday/AM-PM) are Gujarati, digits stay Arabic.
     * In English: standard en-US formatting.
     *
     * @param {Date} date
     * @param {Intl.DateTimeFormatOptions} options  — same as toLocale* options
     * @returns {string}
     */
    const formatTs = useCallback((date, options = {}) => {
        if (lang === 'gu') {
            // 'gu-IN-u-nu-latn' — Gujarati locale, Latin (Arabic) numerals
            return date.toLocaleString('gu-IN-u-nu-latn', options);
        }
        return date.toLocaleString('en-US', options);
    }, [lang]);

    const ctx = useMemo(() => ({ lang, setLang, toggleLang, t, formatTs }), [lang, setLang, toggleLang, t, formatTs]);

    return <LangContext.Provider value={ctx}>{children}</LangContext.Provider>;
}

/**
 * Drop-in replacement for the old useLang() hook.
 * Must be used inside <LangProvider>.
 */
export function useLang() {
    const ctx = useContext(LangContext);
    if (!ctx) throw new Error('useLang must be used within a LangProvider');
    return ctx;
}
