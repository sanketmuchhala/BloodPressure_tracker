import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ImageModal } from '../components/ImageModal';
import { SessionCard } from '../components/SessionCard';
import { BPChart } from '../components/BPChart';
import { InsightsCard } from '../components/InsightsCard';
import { useLang } from '../i18n/useLang';
import { supabase, SINGLE_USER_ID } from '../utils/supabase';
import { fetchSessions } from '../utils/sessionHelpers';
import { getBPCategoryLabeled } from '../utils/bpCategory';

/**
 * Logs Page
 * • Shows insights card, BP chart, then log list
 * • Category badge on every single reading
 * • Swipe left on mobile to reveal Delete
 */
export function Logs() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  // id of any reading currently swiped open
  const [swipedId, setSwipedId] = useState(null);
  // touch tracking
  const touchStartX = useRef(null);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const sessions = await fetchSessions();
      const { data: individualReadings, error: fetchError } = await supabase
        .from('bp_logs')
        .select('*')
        .eq('user_id', SINGLE_USER_ID)
        .is('session_id', null)
        .order('reading_at', { ascending: false })
        .limit(200);
      if (fetchError) throw fetchError;

      const readingsWithPhotos = await Promise.all(
        individualReadings.map(async (log) => {
          if (log.photo_path) {
            try {
              const { data } = await supabase.storage.from('bp-photos').createSignedUrl(log.photo_path, 3600);
              return { ...log, photoUrl: data?.signedUrl || null, type: 'single' };
            } catch { return { ...log, photoUrl: null, type: 'single' }; }
          }
          return { ...log, photoUrl: null, type: 'single' };
        })
      );

      const allLogs = [...sessions, ...readingsWithPhotos].sort((a, b) =>
        new Date(b.session_at || b.reading_at) - new Date(a.session_at || a.reading_at)
      );
      setLogs(allLogs);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(t('logs.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setSwipedId(null);
    const { error: delErr } = await supabase.from('bp_logs').delete().eq('id', id);
    if (!delErr) setLogs(prev => prev.filter(l => l.id !== id));
  };

  const formatDateTime = (ds) =>
    new Date(ds).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // ── Swipe handlers ────────────────────────────────────────────────────────
  const onTouchStart = (e, id) => {
    touchStartX.current = e.touches[0].clientX;
    if (swipedId && swipedId !== id) setSwipedId(null);
  };
  const onTouchEnd = (e, id) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 60) setSwipedId(id);       // swipe left → reveal delete
    else if (diff < -30) setSwipedId(null); // swipe right → close
    touchStartX.current = null;
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-16">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4" />
          <p className="text-text-secondary">{t('loading')}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-5">
        <h2 className="text-2xl font-bold text-text">{t('logs.title')}</h2>

        {/* Insights */}
        <InsightsCard logs={logs} />

        {/* Chart */}
        <BPChart logs={logs} />

        {error && (
          <div className="text-error text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
        )}

        {/* ── Empty state ─────────────────────────────────────────────────── */}
        {logs.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border p-12 text-center space-y-4">
            <div className="text-6xl">💓</div>
            <div>
              <p className="text-lg font-semibold text-text">{t('logs.empty')}</p>
              <p className="text-text-secondary text-sm mt-1">{t('logs.emptyDesc')}</p>
            </div>
            <button
              onClick={() => navigate('/entry')}
              className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-5 py-2.5 font-semibold hover:bg-primary-dark transition-all duration-150"
            >
              + {t('logs.emptyBtn')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) =>
              log.type === 'session' ? (
                <SessionCard key={log.id} session={log} onPhotoClick={(url) => { setSelectedPhoto(url); setIsModalOpen(true); }} />
              ) : (
                /* ── Individual reading card with swipe-to-delete ── */
                <div
                  key={log.id}
                  className="relative overflow-hidden rounded-2xl"
                  onTouchStart={(e) => onTouchStart(e, log.id)}
                  onTouchEnd={(e) => onTouchEnd(e, log.id)}
                >
                  {/* Delete button revealed on swipe */}
                  <div
                    className={`absolute inset-y-0 right-0 flex items-center transition-all duration-200 ${swipedId === log.id ? 'w-20 opacity-100' : 'w-0 opacity-0'}`}
                  >
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="w-full h-full bg-red-500 text-white text-sm font-semibold flex items-center justify-center rounded-r-2xl"
                    >
                      {t('logs.delete')}
                    </button>
                  </div>

                  {/* Card content */}
                  <div
                    className={`bg-surface border border-border rounded-2xl p-4 transition-transform duration-200 ${swipedId === log.id ? '-translate-x-20' : 'translate-x-0'}`}
                  >
                    {(() => {
                      const cat = getBPCategoryLabeled(log.systolic, log.diastolic, t);
                      return (
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="text-xs text-text-secondary">{formatDateTime(log.reading_at)}</div>
                            <div className="flex items-baseline gap-3">
                              <span className="text-2xl font-bold text-text tabular-nums">
                                {log.systolic}/{log.diastolic}
                              </span>
                              <span className="text-sm text-text-secondary">♥ {log.pulse}</span>
                            </div>
                          </div>
                          {/* AHA Category badge */}
                          <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${cat.bg} ${cat.text} ${cat.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                            {cat.label}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      <ImageModal imageUrl={selectedPhoto} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </Layout>
  );
}
