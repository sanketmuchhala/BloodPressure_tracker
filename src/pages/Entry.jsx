import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Layout } from '../components/Layout';
import { useLang } from '../i18n/useLang';
import { calculateAverages, saveSession } from '../utils/sessionHelpers';

/**
 * Entry Page — Unified Reading Flow
 *
 * Phase 1 "adding":
 *   • Live ticking clock
 *   • SYS / DIA / PULSE input → "Add Reading" (or Enter key)
 *   • Each entry shows in a list with its exact HH:MM:SS timestamp
 *   • Live running average card updates as entries are added / removed
 *   • [Done ✓]  [Save to Log (N) ▶]
 *     - "Save to Log" → saves immediately (bp_sessions + bp_logs)
 *     - "Done" → Phase 2 review
 *
 * Phase 2 "review":
 *   • Input form hidden, clean read-only list + timestamps
 *   • Average card still shown (read-only)
 *   • [← Add More]  [Save N Readings]
 *
 * On save:
 *   → bp_sessions row  with computed averages (one per save action)
 *   → bp_logs rows     one per individual entry, linked via session_id
 */
export function Entry() {
  const { t } = useLang();
  const navigate = useNavigate();

  // ── Phase ─────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState('adding'); // 'adding' | 'review'

  // ── Live clock ────────────────────────────────────────────────────────────
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Entries ───────────────────────────────────────────────────────────────
  const [entries, setEntries] = useState([]);

  // ── Live average (derived) ────────────────────────────────────────────────
  const liveAvg = useMemo(() => calculateAverages(entries), [entries]);

  // ── Input form ────────────────────────────────────────────────────────────
  const [input, setInput] = useState({ systolic: '', diastolic: '', pulse: '' });
  const [inputError, setInputError] = useState('');
  const systolicRef = useRef(null);

  // ── Saving ────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isValid = ({ systolic, diastolic, pulse }) => {
    const s = parseInt(systolic), d = parseInt(diastolic), p = parseInt(pulse);
    return !isNaN(s) && !isNaN(d) && !isNaN(p) &&
      s >= 50 && s <= 250 && d >= 30 && d <= 150 && p >= 30 && p <= 200;
  };

  const fmtClock = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fmtDate = (d) => d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // ── Add entry ─────────────────────────────────────────────────────────────
  const handleAdd = () => {
    setInputError('');
    if (!input.systolic || !input.diastolic || !input.pulse) {
      setInputError('Fill in all three fields.'); return;
    }
    if (!isValid(input)) {
      setInputError('Out of range: SYS 50–250 · DIA 30–150 · PUL 30–200'); return;
    }
    setEntries(prev => [...prev, { ...input, readingAt: new Date().toISOString() }]);
    setInput({ systolic: '', diastolic: '', pulse: '' });
    setTimeout(() => systolicRef.current?.focus(), 50);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } };
  const removeEntry = (i) => setEntries(prev => prev.filter((_, idx) => idx !== i));

  // ── Save: writes avg → bp_sessions, individuals → bp_logs ────────────────
  const handleSaveAll = async () => {
    if (entries.length === 0) { setSaveError('Add at least one reading first.'); return; }
    setSaveError('');
    setSaving(true);
    try {
      await saveSession(
        { timestamp: new Date().toISOString(), photoPath: null },
        entries
      );
      navigate('/logs');
    } catch (err) {
      console.error('Error saving entries:', err);
      setSaveError(t('entry.saveError'));
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="space-y-5">

        <h2 className="text-2xl font-bold text-text">{t('entry.title')}</h2>

        {/* Live Clock */}
        <div className="bg-surface border border-border rounded-2xl p-5 text-center shadow-sm">
          <div className="text-4xl font-bold text-primary tabular-nums tracking-tight">
            {fmtClock(now)}
          </div>
          <div className="text-sm text-text-secondary mt-1">{fmtDate(now)}</div>
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
            {entries.length === 0 ? 'Ready to record' : `${entries.length} reading${entries.length > 1 ? 's' : ''} recorded`}
          </div>
        </div>

        {/* ── Live Running Average ─────────────────────────────────────────── */}
        {liveAvg && (
          <div className="bg-primary/5 border-2 border-primary/30 rounded-2xl p-4">
            <div className="text-xs font-semibold text-primary mb-3 uppercase tracking-wide">
              Running Average · {liveAvg.count} reading{liveAvg.count > 1 ? 's' : ''}
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-text tabular-nums">{liveAvg.systolic}</div>
                <div className="text-xs text-text-secondary mt-0.5">{t('entry.systolic')}</div>
              </div>
              <div className="border-x border-primary/20">
                <div className="text-2xl font-bold text-text tabular-nums">{liveAvg.diastolic}</div>
                <div className="text-xs text-text-secondary mt-0.5">{t('entry.diastolic')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-text tabular-nums">{liveAvg.pulse}</div>
                <div className="text-xs text-text-secondary mt-0.5">{t('entry.pulse')}</div>
              </div>
            </div>
            <div className="text-xs text-text-secondary text-center mt-2 opacity-70">
              Saved to session average when you hit Save
            </div>
          </div>
        )}

        {/* ── Phase 1: Input Form ──────────────────────────────────────────── */}
        {phase === 'adding' && (
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="text-sm font-medium text-text-secondary">
              {entries.length === 0 ? 'Enter Reading 1' : `Enter Reading ${entries.length + 1}`}
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
                    className="w-full px-3 py-3 text-xl font-semibold rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background transition-all duration-150 text-center tabular-nums"
                  />
                </div>
              ))}
            </div>

            {inputError && <p className="text-error text-sm">{inputError}</p>}

            <button
              type="button"
              onClick={handleAdd}
              className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary border-2 border-primary rounded-xl px-4 py-3 font-semibold hover:bg-primary hover:text-white transition-all duration-200"
            >
              <PlusIcon className="w-5 h-5" />
              Add Reading
            </button>
          </div>
        )}

        {/* ── Entries List ─────────────────────────────────────────────────── */}
        {entries.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium text-text-secondary">
                {entries.length} {entries.length === 1 ? 'reading' : 'readings'} added
              </span>
              {phase === 'review' && (
                <button
                  type="button"
                  onClick={() => { setPhase('adding'); setSaveError(''); }}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  ← Add more
                </button>
              )}
            </div>

            {entries.map((e, i) => (
              <div key={i} className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3">
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
                  <span className="text-xs text-text-secondary tabular-nums font-mono">
                    {fmtTime(e.readingAt)}
                  </span>
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

        {/* ── Save Error ───────────────────────────────────────────────────── */}
        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-error text-sm">
            {saveError}
          </div>
        )}

        {/* ── Action Buttons ───────────────────────────────────────────────── */}
        {phase === 'adding' ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                if (entries.length === 0) { setSaveError('Add at least one reading first.'); return; }
                setSaveError('');
                setPhase('review');
              }}
              disabled={entries.length === 0}
              className="flex-1 bg-surface border-2 border-border text-text-secondary rounded-xl px-4 py-3 font-medium hover:border-primary hover:text-primary transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckIcon className="w-4 h-4" />
              Done
            </button>

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
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="w-full bg-primary text-white rounded-xl px-6 py-4 text-lg font-semibold hover:bg-primary-dark active:scale-95 transition-all duration-150 disabled:opacity-40"
          >
            {saving ? t('entry.saving') : `Save ${entries.length} ${entries.length === 1 ? 'Reading' : 'Readings'} to Log`}
          </button>
        )}

      </div>
    </Layout>
  );
}
