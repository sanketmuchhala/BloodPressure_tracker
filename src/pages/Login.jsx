import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { useLang } from '../i18n/useLang';

const CORRECT_PIN = '5715716221';

/**
 * Login Page - PIN Entry
 * - Simple PIN-based authentication
 * - PIN: 5715716221
 * - Opens numeric keyboard on mobile
 */
export function Login() {
  const { t, lang, toggleLang } = useLang();
  const navigate = useNavigate();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('authenticated') === 'true';
    if (isAuthenticated) {
      navigate('/entry', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (pin === CORRECT_PIN) {
      // Save authentication state
      localStorage.setItem('authenticated', 'true');
      navigate('/entry');
    } else {
      setError('Incorrect PIN');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md transition-opacity duration-300" key={lang}>
        {/* Language toggle - top right */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleLang}
            className="px-3 py-1 rounded-lg bg-surface text-text-secondary hover:text-text font-medium transition-all duration-300"
          >
            {lang === 'gu' ? 'En' : 'ગુ'}
          </button>
        </div>

        {/* PIN Entry Card */}
        <div className={`bg-surface rounded-2xl shadow-md border border-border p-8 space-y-6 ${shake ? 'animate-shake' : ''}`}>
          <div className="text-center">
            <LockClosedIcon className="w-24 h-24 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-text mb-2 transition-opacity duration-300">
              {t('appTitle')}
            </h1>
            <p className="text-text-secondary transition-opacity duration-300">Enter PIN to access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter PIN"
                className="w-full px-6 py-4 text-2xl text-center rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface transition-all duration-150 tracking-widest"
                autoFocus
                maxLength={10}
              />
            </div>

            {error && (
              <div className="text-error text-sm bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary text-white rounded-xl px-6 py-4 text-lg font-medium hover:bg-primary-dark active:scale-95 transition-all duration-150"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
