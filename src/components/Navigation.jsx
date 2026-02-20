import { NavLink, useNavigate } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { useLang } from '../i18n/useLang';

/**
 * Navigation component
 * - Left: Entry and Logs tabs
 * - Right: Language toggle and Logout button
 * - Mobile-friendly with large tap targets
 */
export function Navigation() {
  const { lang, toggleLang, t } = useLang();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authenticated');
    navigate('/login', { replace: true });
  };

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
      {/* Left: Navigation tabs */}
      <div className="flex gap-2 transition-opacity duration-300">
        <NavLink
          to="/entry"
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg font-medium transition-all duration-300 min-h-[44px] flex items-center ${isActive
              ? 'text-primary border-b-2 border-primary font-semibold'
              : 'text-text-secondary hover:text-text'
            }`
          }
        >
          {t('navEntry')}
        </NavLink>
        <NavLink
          to="/logs"
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg font-medium transition-all duration-300 min-h-[44px] flex items-center ${isActive
              ? 'text-primary border-b-2 border-primary font-semibold'
              : 'text-text-secondary hover:text-text'
            }`
          }
        >
          {t('navLogs')}
        </NavLink>
      </div>

      {/* Right: Language toggle and Logout */}
      <div className="flex gap-2 items-center">
        <button
          onClick={toggleLang}
          className="px-3 py-1 rounded-lg bg-background text-text-secondary hover:text-text font-medium transition-all duration-300 min-h-[44px] min-w-[44px]"
          aria-label="Toggle language"
        >
          {lang === 'gu' ? 'En' : 'ગુ'}
        </button>
        <button
          onClick={handleLogout}
          className="px-3 py-1 rounded-lg bg-background text-text-secondary hover:text-error font-medium transition-all duration-300 min-h-[44px] flex items-center justify-center"
          aria-label="Logout"
        >
          <LockClosedIcon className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
