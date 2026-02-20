import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, XMarkIcon, CheckIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useLang } from '../i18n/useLang';
import { calculateAverages, saveSession } from '../utils/sessionHelpers';

/**
 * SessionEntry Component — Two-phase flow:
 *
 * Phase 1 (recording): Live clock displayed. User enters individual readings
 *   one at a time (max 10). Each confirmed entry shows in a scrollable list.
 *   "Save Session" button → moves to Phase 2.
 *
 * Phase 2 (review): Computed averages shown in editable fields. User can
 *   tweak values before final save to Supabase.
 */
export function SessionEntry() {
  const { t } = useLang();
  const navigate = useNavigate();

  // ── Phase ──────────────────────────────────────────────────────────────────
  // 'recording' → user is entering readings
  // 'review'    → user sees/edits the averaged result before saving
  const [phase, setPhase] = useState('recording');

  // ── Live clock (Phase 1) ───────────────────────────────────────────────────
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // When user hits "Save Session" we lock in the timestamp
  const sessionTimestamp = useRef(null);

  // ── Confirmed readings list ────────────────────────────────────────────────
  const [confirmedReadings, setConfirmedReadings] = useState([]);

  // ── Current input form ────────────────────────────────────────────────────
  const [currentInput, setCurrentInput] = useState({ systolic: '', diastolic: '', pulse: '' });
  const [inputError, setInputError] = useState('');
  const systolicRef = useRef(null);

  // ── Phase 2 — editable averages ───────────────────────────────────────────
  const [avgEdit, setAvgEdit] = useState({ systolic: '', diastolic: '', pulse: '' });

  // ── Saving ────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formatDate = (date) =>
    date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const isValidReading = (r) => {
    const s = parseInt(r.systolic);
    const d = parseInt(r.diastolic);
    const p = parseInt(r.pulse);
    return !isNaN(s) && !isNaN(d) && !isNaN(p) &&
      s >= 50 && s <= 250 && d >= 30 && d <= 150 && p >= 30 && p <= 200;
  };

  // ── Add current input to confirmed list ───────────────────────────────────
  const handleAddEntry = () => {
    setInputError('');

    if (!currentInput.systolic || !currentInput.diastolic || !currentInput.pulse) {
      setInputError('Please fill in all three values.');
      return;
    }
    if (!isValidReading(currentInput)) {
      setInputError('Values out of range (SYS 50-250, DIA 30-150, PUL 30-200).');
      return;
    }
    if (confirmedReadings.length >= 10) {
      setInputError('Maximum 10 readings per session.');
      return;
    }

    setConfirmedReadings(prev => [...prev, { ...currentInput }]);
    setCurrentInput({ systolic: '', diastolic: '', pulse: '' });
    // Re-focus systolic input for quick back-to-back entry
    setTimeout(() => systolicRef.current?.focus(), 50);
  };

  // Enter key on any field adds the entry
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEntry();
    }
  };

  // ── Remove a confirmed reading ─────────────────────────────────────────────
  const removeConfirmed = (index) => {
    setConfirmedReadings(prev => prev.filter((_, i) => i !== index));
  };

  // ── Move from Phase 1 → Phase 2 ───────────────────────────────────────────
  const handleProceedToReview = () => {
    if (confirmedReadings.length === 0) {
      setError('Add at least one reading before saving.');
      return;
    }
    // Lock in the timestamp at this moment
    sessionTimestamp.current = new Date();

    const avgs = calculateAverages(confirmedReadings);
    setAvgEdit({
      systolic: String(avgs.systolic),
      diastolic: String(avgs.diastolic),
      pulse: String(avgs.pulse),
    });
    setError('');
    setPhase('review');
  };

  // ── Final save to DB ───────────────────────────────────────────────────────
  const handleFinalSave = async () => {
    setError('');

    if (!isValidReading(avgEdit)) {
      setError('Values out of range. Please correct them before saving.');
      return;
    }

    setSaving(true);
    try {
      // Build a readings array from the edited averages (single "summary" entry)
      // We still write all individual readings AND the session summary
      await saveSession(
        {
          timestamp: sessionTimestamp.current.toISOString(),
          photoPath: null,
          // Override averages with user-edited values
          overrideAvg: {
            systolic: parseInt(avgEdit.systolic),
            diastolic: parseInt(avgEdit.diastolic),
            pulse: parseInt(avgEdit.pulse),
            count: confirmedReadings.length,
          },
        },
        confirmedReadings
      );
      navigate('/logs');
    } catch (err) {
      console.error('Error saving session:', err);
      setError(t('entry.saveError'));
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — Phase 1: Recording
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'recording') {
    return (
      <div className="space-y-6">

        {/* Live Clock */}
        <div className="bg-surface border border-border rounded-2xl p-5 text-center shadow-sm">
          <div className="text-4xl font-bold text-primary tabular-nums tracking-tight">
            {formatTime(now)}
          </div>
          <div className="text-sm text-text-secondary mt-1">{formatDate(now)}</div>
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
            Session in progress
          </div>
        </div>

        {/* Confirmed readings list */}
        {confirmedReadings.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-text-secondary px-1">
              Readings ({confirmedReadings.length}/10)
            </div>
            {confirmedReadings.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-lg font-semibold text-text tabular-nums">
                    {r.systolic}/{r.diastolic}
                  </span>
                  <span className="text-sm text-text-secondary">
                    ♥ {r.pulse}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeConfirmed(i)}
                  className="text-text-secondary hover:text-error p-1 rounded transition-colors duration-150"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Entry form */}
        {confirmedReadings.length < 10 && (
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="text-sm font-medium text-text-secondary">
              {confirmedReadings.length === 0 ? 'Enter Reading 1' : `Enter Reading ${confirmedReadings.length + 1}`}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  {t('entry.systolic')} *
                </label>
                <input
                  ref={systolicRef}
                  type="number"
                  inputMode="numeric"
                  value={currentInput.systolic}
                  onChange={(e) => setCurrentInput(p => ({ ...p, systolic: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  placeholder="120"
                  min="50" max="250"
                  className="w-full px-3 py-3 text-xl font-semibold rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background transition-all duration-150 text-center"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  {t('entry.diastolic')} *
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={currentInput.diastolic}
                  onChange={(e) => setCurrentInput(p => ({ ...p, diastolic: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  placeholder="80"
                  min="30" max="150"
                  className="w-full px-3 py-3 text-xl font-semibold rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background transition-all duration-150 text-center"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  {t('entry.pulse')} *
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={currentInput.pulse}
                  onChange={(e) => setCurrentInput(p => ({ ...p, pulse: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  placeholder="72"
                  min="30" max="200"
                  className="w-full px-3 py-3 text-xl font-semibold rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background transition-all duration-150 text-center"
                />
              </div>
            </div>

            {inputError && (
              <div className="text-error text-sm">{inputError}</div>
            )}

            <button
              type="button"
              onClick={handleAddEntry}
              disabled={confirmedReadings.length >= 10}
              className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary border-2 border-primary rounded-xl px-4 py-3 font-semibold hover:bg-primary hover:text-white transition-all duration-150 disabled:opacity-50"
            >
              <PlusIcon className="w-5 h-5" />
              Add Entry
            </button>
          </div>
        )}

        {confirmedReadings.length === 10 && (
          <div className="text-center text-sm text-text-secondary bg-amber-50 border border-amber-200 rounded-xl p-3">
            Maximum 10 readings reached.
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-error text-sm">
            {error}
          </div>
        )}

        {/* Save Session → go to review */}
        <button
          type="button"
          onClick={handleProceedToReview}
          disabled={confirmedReadings.length === 0}
          className="w-full bg-primary text-white rounded-xl px-6 py-4 text-lg font-semibold hover:bg-primary-dark active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save Session →
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — Phase 2: Review & Edit Average
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <CheckIcon className="w-5 h-5 text-green-500" />
          <span className="font-semibold text-text">Session recorded</span>
        </div>
        <div className="text-sm text-text-secondary">
          {confirmedReadings.length} readings at{' '}
          {sessionTimestamp.current?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Individual readings summary (read-only) */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-text-secondary px-1">Individual Readings</div>
        {confirmedReadings.map((r, i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-2.5"
          >
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <span className="text-base font-semibold text-text tabular-nums">
              {r.systolic}/{r.diastolic}
            </span>
            <span className="text-sm text-text-secondary">♥ {r.pulse}</span>
          </div>
        ))}
      </div>

      {/* Editable average */}
      <div className="bg-primary/5 border-2 border-primary rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <PencilIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">Average (editable)</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1">
              {t('entry.systolic')}
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={avgEdit.systolic}
              onChange={(e) => setAvgEdit(p => ({ ...p, systolic: e.target.value }))}
              min="50" max="250"
              className="w-full px-3 py-3 text-xl font-bold rounded-xl border-2 border-primary focus:ring-2 focus:ring-primary/20 bg-white transition-all duration-150 text-center"
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">
              {t('entry.diastolic')}
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={avgEdit.diastolic}
              onChange={(e) => setAvgEdit(p => ({ ...p, diastolic: e.target.value }))}
              min="30" max="150"
              className="w-full px-3 py-3 text-xl font-bold rounded-xl border-2 border-primary focus:ring-2 focus:ring-primary/20 bg-white transition-all duration-150 text-center"
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">
              {t('entry.pulse')}
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={avgEdit.pulse}
              onChange={(e) => setAvgEdit(p => ({ ...p, pulse: e.target.value }))}
              min="30" max="200"
              className="w-full px-3 py-3 text-xl font-bold rounded-xl border-2 border-primary focus:ring-2 focus:ring-primary/20 bg-white transition-all duration-150 text-center"
            />
          </div>
        </div>
        <div className="text-xs text-text-secondary">
          Auto-calculated from your {confirmedReadings.length} readings. Adjust if needed.
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-error text-sm">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => { setPhase('recording'); setError(''); }}
          className="flex-1 bg-surface border border-border text-text-secondary rounded-xl px-4 py-3 font-medium hover:bg-background transition-all duration-150"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleFinalSave}
          disabled={saving}
          className="flex-[2] bg-primary text-white rounded-xl px-6 py-3 text-lg font-semibold hover:bg-primary-dark active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? t('entry.saving') : 'Confirm & Save'}
        </button>
      </div>
    </div>
  );
}
