import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useLang } from '../i18n/useLang';

/**
 * AuthCallback Page
 * - Handles auth token processing from magic link/email verification
 * - Waits for Supabase to process tokens from URL
 * - Redirects to /entry on success or /login on failure
 * - Shows loading state while processing
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const { t } = useLang();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Give Supabase SDK time to process auth tokens from URL
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          throw error;
        }

        if (session) {
          // Success - redirect to entry page
          navigate('/entry', { replace: true });
        } else {
          // No session found - redirect to login
          navigate('/login', { replace: true, state: { error: 'auth_failed' } });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login', { replace: true, state: { error: 'auth_failed' } });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
        <p className="text-text-secondary">{t('login.signingIn')}</p>
      </div>
    </div>
  );
}
