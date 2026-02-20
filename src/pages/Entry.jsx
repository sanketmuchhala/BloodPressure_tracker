import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { SessionEntry } from '../components/SessionEntry';
import { useLang } from '../i18n/useLang';
import { supabase, SINGLE_USER_ID } from '../utils/supabase';

/**
 * Entry Page
 * - Mode toggle: Single Reading vs Session Mode (multiple readings with averaging)
 * - Defaults to Session Mode per user preference
 * - Photo capture with mobile camera
 * - Image compression
 * - Optional OCR with manual "Run OCR" button
 * - Manual entry always available
 * - Save to Supabase (storage + database)
 */
export function Entry() {
  const { t } = useLang();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Mode toggle state: 'single' or 'session' (default to session per user preference)
  const [mode, setMode] = useState('session');

  // Form state
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [readingAt, setReadingAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Handle save
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!systolic || !diastolic || !pulse) {
      setError(t('entry.validationError'));
      return;
    }

    setSaving(true);

    try {
      // Insert log entry
      const { error: insertError } = await supabase.from('bp_logs').insert({
        user_id: SINGLE_USER_ID,
        reading_at: new Date(readingAt).toISOString(),
        systolic: parseInt(systolic),
        diastolic: parseInt(diastolic),
        pulse: parseInt(pulse),
        photo_path: null,
      });

      if (insertError) {
        throw insertError;
      }

      // Success - navigate to logs
      navigate('/logs');
    } catch (err) {
      console.error('Error saving entry:', err);
      setError(t('entry.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Mode Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text">{t('entry.title')}</h2>
          <div className="flex bg-surface rounded-lg p-1 border border-border">
            <button
              type="button"
              onClick={() => setMode('session')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${mode === 'session'
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text'
                }`}
            >
              {t('session.sessionMode')}
            </button>
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${mode === 'single'
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text'
                }`}
            >
              {t('session.singleMode')}
            </button>
          </div>
        </div>

        {/* Conditional Rendering based on mode */}
        {mode === 'session' ? (
          <SessionEntry />
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Readings Section */}
            <div className="bg-surface rounded-2xl shadow-md border border-border p-6 space-y-4">
              <h3 className="font-semibold text-text">{t('entry.title')}</h3>

              {/* Systolic */}
              <div>
                <label htmlFor="systolic" className="block text-sm font-medium text-text-secondary mb-1">
                  {t('entry.systolic')} <span className="text-error">*</span>
                </label>
                <input
                  id="systolic"
                  type="number"
                  inputMode="numeric"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="w-full px-4 py-3 text-lg rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface transition-all duration-150"
                  required
                  min="50"
                  max="250"
                />
              </div>

              {/* Diastolic */}
              <div>
                <label htmlFor="diastolic" className="block text-sm font-medium text-text-secondary mb-1">
                  {t('entry.diastolic')} <span className="text-error">*</span>
                </label>
                <input
                  id="diastolic"
                  type="number"
                  inputMode="numeric"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="w-full px-4 py-3 text-lg rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface transition-all duration-150"
                  required
                  min="30"
                  max="150"
                />
              </div>

              {/* Pulse */}
              <div>
                <label htmlFor="pulse" className="block text-sm font-medium text-text-secondary mb-1">
                  {t('entry.pulse')} <span className="text-error">*</span>
                </label>
                <input
                  id="pulse"
                  type="number"
                  inputMode="numeric"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className="w-full px-4 py-3 text-lg rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface transition-all duration-150"
                  required
                  min="30"
                  max="200"
                />
              </div>

              {/* Reading Time */}
              <div>
                <label htmlFor="readingAt" className="block text-sm font-medium text-text-secondary mb-1">
                  {t('entry.readingTime')}
                </label>
                <input
                  id="readingAt"
                  type="datetime-local"
                  value={readingAt}
                  onChange={(e) => setReadingAt(e.target.value)}
                  className="w-full px-4 py-3 text-lg rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface transition-all duration-150"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-error text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary text-white rounded-xl px-6 py-3 font-medium hover:bg-primary-dark active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
            >
              {saving ? t('entry.saving') : t('entry.save')}
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
}
