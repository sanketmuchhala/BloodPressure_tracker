import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Layout } from '../components/Layout';
import { SessionEntry } from '../components/SessionEntry';
import { useLang } from '../i18n/useLang';
import { supabase, SINGLE_USER_ID } from '../utils/supabase';

/**
 * Entry Page
 *
 * Session Mode  → <SessionEntry /> (live clock, multi-reading, averaged)
 *
 * Single Reading Mode — two-phase UX:
 *   Phase 1 "adding":
 *     - Input form (SYS / DIA / PULSE)
 *     - "Save Entry" adds reading to local list with a timestamp snapshot
 *     - List of saved entries shown below (can delete any)
 *     - Footer: [Done]  [Save to Log ▶]
 *       • "Save to Log" saves everything immediately → /logs
 *       • "Done" moves to Phase 2 (review)
 *
 *   Phase 2 "review":
 *     - Input form hidden
 *     - Clean read-only list of all entries
 *     - Footer: [← Add More]  [Save to Log ▶]
 */
export function Entry() {
  const { t } = useLang();
  const navigate = useNavigate();

  // ── Mode toggle ────────────────────────────────────────────────────────────
  const [mode, setMode] = useState('session');

  // ── Single mode phase: 'adding' | 'review' ────────────────────────────────
  const [phase, setPhase] = useState('adding');

  // ── Saved entries list ────────────────────────────────────────────────────
  // Each entry: { systolic, diastolic, pulse, readingAt: ISO string }
  const [entries, setEntries] = useState([]);

  // ── Current input form ────────────────────────────────────────────────────
  const [input, setInput] = useState({ systolic: '', diastolic: '', pulse: '' });
  const [inputError, setInputError] = useState('');
  const systolicRef = useRef(null);

  // ── Saving state ──────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // ── Validation ────────────────────────────────────────────────────────────
  const isValid = (v) => {
    const s = parseInt(v.systolic);
    const d = parseInt(v.diastolic);
    const p = parseInt(v.pulse);
    return !isNaN(s) && !isNaN(d) && !isNaN(p) &&
      s >= 50 && s <= 250 &&
      d >= 30 && d <= 150 &&
      p >= 30 && p <= 200;
  };

  // ── Add entry to local list ───────────────────────────────────────────────
  const handleSaveEntry = () => {
    setInputError('');

    if (!input.systolic || !input.diastolic || !input.pulse) {
      setInputError('Fill in all three fields.');
      return;
    }
    if (!isValid(input)) {
      setInputError('Out of range: SYS 50–250 · DIA 30–150 · PUL 30–200');
      return;
    }

    setEntries(prev => [
      ...prev,
      {
        systolic: input.systolic,
        diastolic: input.diastolic,
        pulse: input.pulse,
        readingAt: new Date().toISOString(), // timestamp at moment of save-entry
      },
    ]);
    setInput({ systolic: '', diastolic: '', pulse: '' });
    setTimeout(() => systolicRef.current?.focus(), 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSaveEntry(); }
  };

  // ── Remove an entry ───────────────────────────────────────────────────────
  const removeEntry = (i) => setEntries(prev => prev.filter((_, idx) => idx !== i));

  // ── Save all entries to Supabase ──────────────────────────────────────────
  const handleSaveAll = async () => {
    if (entries.length === 0) {
      setSaveError('Add at least one entry before saving.');
      return;
    }
    setSaveError('');
    setSaving(true);

    try {
      const rows = entries.map(e => ({
        user_id: SINGLE_USER_ID,
        reading_at: e.readingAt,
        systolic: parseInt(e.systolic),
        diastolic: parseInt(e.diastolic),
        pulse: parseInt(e.pulse),
        photo_path: null,
      }));

      const { error: insertError } = await supabase.from('bp_logs').insert(rows);
      if (insertError) throw insertError;
      navigate('/logs');
    } catch (err) {
      console.error('Error saving entries:', err);
      setSaveError(t('entry.saveError'));
    } finally {
      setSaving(false);
    }
  };

  // ── Format time for display ───────────────────────────────────────────────
  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // ── Reset when switching modes ────────────────────────────────────────────
  const switchMode = (m) => {
    setMode(m);
    setPhase('adding');
    setEntries([]);
    setInput({ systolic: '', diastolic: '', pulse: '' });
    setInputError('');
    setSaveError('');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="space-y-6">

        {/* Mode Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text">{t('entry.title')}</h2>
          <div className="flex bg-surface rounded-lg p-1 border border-border">
            <button
              type="button"
              onClick={() => switchMode('session')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${mode === 'session' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text'
                }`}
            >
              {t('session.sessionMode')}
            </button>
            <button
              type="button"
              onClick={() => switchMode('single')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${mode === 'single' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text'
                }`}
            >
              {t('session.singleMode')}
            </button>
          </div>
        </div>

        {/* ── Session Mode ──────────────────────────────────────────────── */}
        {mode === 'session' && <SessionEntry />}

        {/* ── Single Reading Mode ───────────────────────────────────────── */}
        {mode === 'single' && (
          <div className="space-y-5">

            {/* ── Phase 1: Input Form (hidden in review) ─────────────────── */}
            {phase === 'adding' && (
              <div className="bg-surface border border-border rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="text-sm font-medium text-text-secondary">
                  {entries.length === 0
                    ? 'Enter Reading 1'
                    : `Enter Reading ${entries.length + 1}`}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'systolic', label: t('entry.systolic'), ph: '120', min: 50, max: 250, ref: systolicRef },
                    { id: 'diastolic', label: t('entry.diastolic'), ph: '80', min: 30, max: 150, ref: null },
                    { id: 'pulse', label: t('entry.pulse'), ph: '72', min: 30, max: 200, ref: null },
                  ].map(({ id, label, ph, min, max, ref }) => (
                    <div key={id}>
                      <label className="block text-xs text-text-secondary mb-1">{label} *</label>
                      <input
                        ref={ref}
                        type="number"
                        inputMode="numeric"
                        value={input[id]}
                        onChange={(e) => setInput(p => ({ ...p, [id]: e.target.value }))}
                        onKeyDown={handleKeyDown}
                        placeholder={ph}
                        min={min}
                        max={max}
                        className="w-full px-3 py-3 text-xl font-semibold rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background transition-all duration-150 text-center"
                      />
                    </div>
                  ))}
                </div>

                {inputError && (
                  <p className="text-error text-sm">{inputError}</p>
                )}

                <button
                  type="button"
                  onClick={handleSaveEntry}
                  className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary border-2 border-primary rounded-xl px-4 py-3 font-semibold hover:bg-primary hover:text-white transition-all duration-200"
                >
                  <PlusIcon className="w-5 h-5" />
                  Save Entry
                </button>
              </div>
            )}

            {/* ── Entries List ────────────────────────────────────────────── */}
            {entries.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-medium text-text-secondary">
                    {entries.length} {entries.length === 1 ? 'reading' : 'readings'} added
                  </span>
                  {phase === 'review' && (
                    <button
                      type="button"
                      onClick={() => setPhase('adding')}
                      className="text-sm text-primary font-medium hover:underline"
                    >
                      ← Add more
                    </button>
                  )}
                </div>

                {entries.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-lg font-semibold text-text tabular-nums">
                        {e.systolic}/{e.diastolic}
                      </span>
                      <span className="text-sm text-text-secondary">♥ {e.pulse}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-secondary tabular-nums">{formatTime(e.readingAt)}</span>
                      <button
                        type="button"
                        onClick={() => removeEntry(i)}
                        className="text-text-secondary hover:text-error p-1 rounded transition-colors duration-150"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Save Error ──────────────────────────────────────────────── */}
            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-error text-sm">
                {saveError}
              </div>
            )}

            {/* ── Action Buttons ──────────────────────────────────────────── */}
            {phase === 'adding' ? (
              <div className="flex gap-3">
                {/* Done → go to review */}
                <button
                  type="button"
                  onClick={() => {
                    if (entries.length === 0) {
                      setSaveError('Add at least one entry first.');
                      return;
                    }
                    setSaveError('');
                    setPhase('review');
                  }}
                  disabled={entries.length === 0}
                  className="flex-1 bg-surface border-2 border-border text-text-secondary rounded-xl px-4 py-3 font-medium hover:border-primary hover:text-primary transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckIcon className="w-4 h-4" />
                  Done
                </button>

                {/* Save to Log — immediate */}
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={saving || entries.length === 0}
                  className="flex-[2] bg-primary text-white rounded-xl px-4 py-3 font-semibold hover:bg-primary-dark active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? t('entry.saving') : `Save to Log${entries.length > 0 ? ` (${entries.length})` : ''}`}
                </button>
              </div>
            ) : (
              /* Phase 2 review — single Save button */
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={saving || entries.length === 0}
                className="w-full bg-primary text-white rounded-xl px-6 py-4 text-lg font-semibold hover:bg-primary-dark active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? t('entry.saving') : `Save ${entries.length} ${entries.length === 1 ? 'Reading' : 'Readings'} to Log`}
              </button>
            )}

          </div>
        )}

      </div>
    </Layout>
  );
}
