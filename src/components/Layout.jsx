import { Navigation } from './Navigation';
import { useLang } from '../i18n/useLang';

/**
 * Layout component
 * - Sticky header with app title
 * - Navigation bar
 * - Centered max-width container for page content
 * - Mobile-first responsive design
 */
export function Layout({ children }) {
  const { t, lang } = useLang();

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-surface shadow-sm">
        <div className="px-4 py-4 border-b border-border">
          <h1 className="text-2xl font-bold text-text text-center transition-opacity duration-300">
            {t('appTitle')}
          </h1>
        </div>
        <Navigation />
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 transition-opacity duration-300">
        {children}
      </main>
    </div>
  );
}
