import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLang } from '../i18n/useLang';
import { calculateAverages, saveSession } from '../utils/sessionHelpers';

/**
 * SessionEntry Component
 * Allows entering multiple BP readings in one session with automatic averaging
 * Matches CVS Health monitor behavior of taking 3-4 readings and showing average
 */
export function SessionEntry() {
  const { t } = useLang();
  const navigate = useNavigate();

  // Session state
  const [readings, setReadings] = useState([
    { systolic: '', diastolic: '', pulse: '' },
  ]);
  const [sessionTime, setSessionTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [averages, setAverages] = useState(null);

  // Calculate averages whenever readings change
  useEffect(() => {
    const avg = calculateAverages(readings);
    setAverages(avg);
  }, [readings]);

  // Add new reading
  const addReading = () => {
    if (readings.length < 10) {
      setReadings([...readings, { systolic: '', diastolic: '', pulse: '' }]);
    }
  };

  // Remove reading
  const removeReading = (index) => {
    if (readings.length > 1) {
      const newReadings = readings.filter((_, i) => i !== index);
      setReadings(newReadings);
    }
  };

  // Update reading value
  const updateReading = (index, field, value) => {
    const newReadings = [...readings];
    newReadings[index] = { ...newReadings[index], [field]: value };
    setReadings(newReadings);
  };

  // Handle save
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    // Validate at least one complete reading
    const validReadings = readings.filter(
      (r) => r.systolic && r.diastolic && r.pulse
    );

    if (validReadings.length === 0) {
      setError(t('entry.validationError'));
      return;
    }

    setSaving(true);

    try {
      // Save session with readings
      await saveSession(
        {
          timestamp: new Date(sessionTime).toISOString(),
          photoPath: null,
        },
        validReadings
      );

      // Success - navigate to logs
      navigate('/logs');
    } catch (err) {
      console.error('Error saving session:', err);
      setError(t('entry.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Session Time */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {t('entry.readingTime')}
        </label>
        <input
          type="datetime-local"
          value={sessionTime}
          onChange={(e) => setSessionTime(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface transition-all duration-150"
        />
      </div>

      {/* Readings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-text-secondary">
            {t('session.title')} ({readings.filter((r) => r.systolic && r.diastolic && r.pulse).length} {t('session.readingCount')})
          </label>
          <button
            type="button"
            onClick={addReading}
            disabled={readings.length >= 10}
            className="flex items-center gap-1 px-3 py-1 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-all duration-150"
          >
            <PlusIcon className="w-4 h-4" />
            {t('session.addReading')}
          </button>
        </div>

        {readings.map((reading, index) => (
          <div
            key={index}
            className="bg-surface rounded-xl border border-border p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-text">
                {t('session.reading')} {index + 1}
              </h3>
              {readings.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeReading(index)}
                  className="text-error hover:bg-red-50 p-1 rounded transition-all duration-150"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  {t('entry.systolic')} *
                </label>
                <input
                  type="number"
                  value={reading.systolic}
                  onChange={(e) => updateReading(index, 'systolic', e.target.value)}
                  placeholder="120"
                  min="50"
                  max="250"
                  className="w-full px-3 py-2 text-lg rounded-lg border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background transition-all duration-150"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  {t('entry.diastolic')} *
                </label>
                <input
                  type="number"
                  value={reading.diastolic}
                  onChange={(e) => updateReading(index, 'diastolic', e.target.value)}
                  placeholder="80"
                  min="30"
                  max="150"
                  className="w-full px-3 py-2 text-lg rounded-lg border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background transition-all duration-150"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  {t('entry.pulse')} *
                </label>
                <input
                  type="number"
                  value={reading.pulse}
                  onChange={(e) => updateReading(index, 'pulse', e.target.value)}
                  placeholder="72"
                  min="30"
                  max="200"
                  className="w-full px-3 py-2 text-lg rounded-lg border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background transition-all duration-150"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Average Display */}
      {averages && (
        <div className="bg-primary/10 border-2 border-primary rounded-xl p-4">
          <div className="text-sm font-medium text-primary mb-2">
            {t('session.average')} ({averages.count} {t('session.readingCount')})
          </div>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="text-2xl font-bold text-text">{averages.systolic}</div>
              <div className="text-xs text-text-secondary">{t('entry.systolic')}</div>
            </div>
            <div className="text-3xl text-text-secondary">/</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text">{averages.diastolic}</div>
              <div className="text-xs text-text-secondary">{t('entry.diastolic')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text">{averages.pulse}</div>
              <div className="text-xs text-text-secondary">{t('entry.pulse')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-error text-sm">
          {error}
        </div>
      )}

      {/* Save Button */}
      <button
        type="submit"
        disabled={saving || !averages}
        className="w-full bg-primary text-white rounded-xl px-6 py-4 text-lg font-medium hover:bg-primary-dark active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? t('entry.saving') : t('entry.save')}
      </button>
    </form>
  );
}
