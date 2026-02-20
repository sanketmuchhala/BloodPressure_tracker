import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CameraIcon } from '@heroicons/react/24/outline';
import { Layout } from '../components/Layout';
import { SessionEntry } from '../components/SessionEntry';
import { useLang } from '../i18n/useLang';
import { supabase, SINGLE_USER_ID } from '../utils/supabase';
import { compressImage, fileToDataURL } from '../utils/imageCompression';
import { performOCR } from '../utils/ocr';

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

  // Photo state
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  // OCR state
  const [ocrStatus, setOcrStatus] = useState('idle');
  const [ocrResults, setOcrResults] = useState(null);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Handle photo capture
  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setOcrStatus('idle');
    setOcrResults(null);

    try {
      // Compress image immediately
      const compressed = await compressImage(file);
      const preview = await fileToDataURL(compressed);

      setPhoto(compressed);
      setPhotoPreview(preview);

      // Auto-run OCR after photo is loaded
      setTimeout(async () => {
        setOcrStatus('processing');
        try {
          const results = await performOCR(compressed);
          setOcrResults(results);

          // Auto-fill inputs if values detected
          if (results.systolic) setSystolic(results.systolic.toString());
          if (results.diastolic) setDiastolic(results.diastolic.toString());
          if (results.pulse) setPulse(results.pulse.toString());

          setOcrStatus(results.confidence === 'none' ? 'failed' : 'complete');
        } catch (err) {
          console.error('OCR error:', err);
          setOcrStatus('failed');
        }
      }, 500);
    } catch (err) {
      console.error('Error processing photo:', err);
      setError(t('entry.saveError'));
    }
  };

  // Run OCR
  const handleRunOCR = async () => {
    if (!photo) return;

    setOcrStatus('processing');
    setError('');

    try {
      const results = await performOCR(photo);
      setOcrResults(results);

      // Auto-fill inputs if values detected
      if (results.systolic) setSystolic(results.systolic.toString());
      if (results.diastolic) setDiastolic(results.diastolic.toString());
      if (results.pulse) setPulse(results.pulse.toString());

      setOcrStatus(results.confidence === 'none' ? 'failed' : 'complete');
    } catch (err) {
      console.error('OCR error:', err);
      setOcrStatus('failed');
    }
  };

  // Retake photo
  const handleRetakePhoto = () => {
    setPhoto(null);
    setPhotoPreview('');
    setOcrStatus('idle');
    setOcrResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
      let photoPath = null;

      // Upload photo if exists
      if (photo) {
        const fileName = `${crypto.randomUUID()}.jpg`;
        const yearMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        photoPath = `${SINGLE_USER_ID}/${yearMonth}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('bp-photos')
          .upload(photoPath, photo, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }
      }

      // Insert log entry
      const { error: insertError } = await supabase.from('bp_logs').insert({
        user_id: SINGLE_USER_ID,
        reading_at: new Date(readingAt).toISOString(),
        systolic: parseInt(systolic),
        diastolic: parseInt(diastolic),
        pulse: parseInt(pulse),
        photo_path: photoPath,
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
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                mode === 'session'
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              {t('session.sessionMode')}
            </button>
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                mode === 'single'
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
          {/* Photo Section */}
          <div className="bg-surface rounded-2xl shadow-md border border-border p-6 space-y-4">
            <h3 className="font-semibold text-text">{t('entry.takePhoto')}</h3>

            {!photoPreview ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                  id="photo-input"
                />
                <label
                  htmlFor="photo-input"
                  className="block w-full bg-background border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-all duration-150"
                >
                  <CameraIcon className="w-16 h-16 text-primary mx-auto mb-2" />
                  <div className="text-text-secondary">{t('entry.takePhoto')}</div>
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <img
                  src={photoPreview}
                  alt="Blood pressure reading"
                  className="w-full rounded-2xl shadow-md"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRetakePhoto}
                    className="flex-1 bg-background text-text-secondary border border-border rounded-xl px-4 py-2 font-medium hover:bg-surface transition-all duration-150"
                  >
                    {t('entry.retakePhoto')}
                  </button>
                  {ocrStatus === 'idle' && (
                    <button
                      type="button"
                      onClick={handleRunOCR}
                      className="flex-1 bg-primary text-white rounded-xl px-4 py-2 font-medium hover:bg-primary-dark active:scale-95 transition-all duration-150"
                    >
                      {t('entry.runOCR')}
                    </button>
                  )}
                </div>

                {/* OCR Status */}
                {ocrStatus !== 'idle' && (
                  <div
                    className={`text-sm rounded-full px-3 py-1 inline-block ${
                      ocrStatus === 'processing'
                        ? 'bg-gray-100 text-gray-700'
                        : ocrStatus === 'complete'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {ocrStatus === 'processing' && t('entry.ocrProcessing')}
                    {ocrStatus === 'complete' &&
                      `${t('entry.ocrComplete')}: ${ocrResults?.systolic || ''}/${
                        ocrResults?.diastolic || ''
                      }, ${t('entry.pulse')}: ${ocrResults?.pulse || ''}`}
                    {ocrStatus === 'failed' && t('entry.ocrFailed')}
                  </div>
                )}
              </div>
            )}
          </div>

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
