// Re-export from the context module for backward compatibility.
// All components that import from here will automatically use the
// shared context state — no more isolated per-component language state.
export { useLang, LangProvider, LangContext } from './LangContext';
