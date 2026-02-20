import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, XMarkIcon, CheckIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Layout } from '../components/Layout';
import { useLang } from '../i18n/useLang';
import { calculateAverages, saveSession } from '../utils/sessionHelpers';
import { getBPCategory } from '../utils/bpCategory';

export function Entry() {
  const { t } = useLang();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('adding');
  const [now, setNow] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [input, setInput] = useState({ systolic: '', diastolic: '', pulse: '' });
  const [inputError, setInputError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [tipOpen, setTipOpen] = useState(true);
  const systolicRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Live average derived from entries
  const liveAvg = useMemo(() => calculateAverages(entries), [entries]);
  const avgCat = liveAvg ? getBPCategory(liveAvg.systolic, liveAvg.diastolic) : null;

  const isValid = ({ systolic, diastolic, pulse }) => {
    const s = parseInt(systolic), d = parseInt(diastolic), p = parseInt(pulse);
    return !isNaN(s) && !isNaN(d) && !isNaN(p)
      && s >= 50 && s <= 250 && d >= 30 && d <= 150 && p >= 30 && p <= 200;
  };

  const fmtClock = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fmtDate = (d) => d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

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

  const handleSaveAll = async () => {
    if (entries.length === 0) { setSaveError('Add at least one reading first.'); return; }
    setSaveError('');
    setSaving(true);
    try {
      await saveSession({ timestamp: new Date().toISOString(), photoPath: null }, entries);
      navigate('/logs');
    } catch (err) {
      console.error('Error saving entries:', err);
      setSaveError(t('entry.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-4">

        <h2 className="text-2xl font-bold text-text">{t('entry.title')}</h2>

        {/* ── Measurement tip (collapsible) ─────────────────────────────── */}
        {tipOpen && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
            <InformationCircleIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-blue-800">
              <span className="font-semibold">For best accuracy: </span>
              sit quietly for 5 min · no caffeine/exercise 30 min before · take 2–3 readings
            </div>
            <button
              onClick={() => setTipOpen(false)}
              className="text-blue-400 hover:text-blue-600 shrink-0"
              aria-label="Dismiss tip"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Live Clock ───────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-2xl p-5 text-center shadow-sm">
          <div className="text-4xl font-bold text-primary tabular-nums tracking-tight">{fmtClock(now)}</div>
          <div className="text-sm text-text-secondary mt-1">{fmtDate(now)}</div>
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
            {entries.length === 0 ? 'Ready to record' : `${entries.length} reading${entries.length > 1 ? 's' : ''} recorded`}
          </div>
        </div>

        {/* ── Live Running Average (with AHA category) ─────────────────────── */}
        {liveAvg && avgCat && (
          <div className={`border-2 rounded-2xl p-4 ${avgCat.border} ${avgCat.bg}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Running Average · {liveAvg.count} reading{liveAvg.count > 1 ? 's' : ''}
              </span>
              {/* AHA badge */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${avgCat.bg} ${avgCat.text} ${avgCat.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${avgCat.dot}`} />
                {avgCat.label}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: t('entry.systolic'), val: liveAvg.systolic },
                { label: t('entry.diastolic'), val: liveAvg.diastolic },
                { label: t('entry.pulse'), val: liveAvg.pulse },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div className={`text-2xl font-bold tabular-nums ${avgCat.text}`}>{val}</div>
                  <div className="text-xs text-text-secondary mt-0.5">{label}</div>
                </div>
              ))}
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
                { id: 'systolic', label: t('entry.systolic'), ph: '120', ref: systolicRef },
                { id: 'diastolic', label: t('entry.diastolic'), ph: '80', ref: null },
                { id: 'pulse', label: t('entry.pulse'), ph: '72', ref: null },
              ].map(({ id, label, ph, ref }) => (
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
                <button type="button" onClick={() => { setPhase('adding'); setSaveError(''); }}
                  className="text-sm text-primary font-medium hover:underline">
                  ← Add more
                </button>
              )}
            </div>
            {entries.map((e, i) => {
              const cat = getBPCategory(e.systolic, e.diastolic);
              return (
                <div key={i} className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-lg font-semibold text-text tabular-nums">{e.systolic}/{e.diastolic}</span>
                    <span className="text-sm text-text-secondary">♥ {e.pulse}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Per-entry category dot */}
                    <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cat.bg} ${cat.text} ${cat.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                      {cat.label}
                    </span>
                    <span className="text-xs text-text-secondary tabular-nums font-mono">{fmtTime(e.readingAt)}</span>
                    <button type="button" onClick={() => removeEntry(i)}
                      className="text-text-secondary hover:text-error p-1 rounded transition-colors duration-150">
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-error text-sm">{saveError}</div>
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
