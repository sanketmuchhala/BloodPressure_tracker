import { useState, useEffect } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { Layout } from '../components/Layout';
import { ImageModal } from '../components/ImageModal';
import { SessionCard } from '../components/SessionCard';
import { BPChart } from '../components/BPChart';
import { useLang } from '../i18n/useLang';
import { supabase, SINGLE_USER_ID } from '../utils/supabase';
import { fetchSessions } from '../utils/sessionHelpers';

/**
 * Logs Page
 * - Displays both sessions (with averaged readings) and single readings
 * - Fetches last 100 sessions and 200 individual readings
 * - Merges and sorts by timestamp
 * - Uses signed URLs for photo display
 * - Click thumbnail to view full-size in modal
 */
export function Logs() {
  const { t } = useLang();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch sessions
      const sessions = await fetchSessions();

      // Fetch individual readings (only those without session_id)
      const { data: individualReadings, error: fetchError } = await supabase
        .from('bp_logs')
        .select('*')
        .eq('user_id', SINGLE_USER_ID)
        .is('session_id', null)
        .order('reading_at', { ascending: false })
        .limit(200);

      if (fetchError) {
        throw fetchError;
      }

      // Generate signed URLs for individual readings
      const readingsWithPhotos = await Promise.all(
        individualReadings.map(async (log) => {
          if (log.photo_path) {
            try {
              const { data: signedUrlData } = await supabase.storage
                .from('bp-photos')
                .createSignedUrl(log.photo_path, 3600);

              return { ...log, photoUrl: signedUrlData?.signedUrl || null, type: 'single' };
            } catch (err) {
              console.error('Error generating signed URL:', err);
              return { ...log, photoUrl: null, type: 'single' };
            }
          }
          return { ...log, photoUrl: null, type: 'single' };
        })
      );

      // Merge and sort by timestamp
      const allLogs = [...sessions, ...readingsWithPhotos].sort((a, b) => {
        const timeA = new Date(a.session_at || a.reading_at);
        const timeB = new Date(b.session_at || b.reading_at);
        return timeB - timeA;
      });

      setLogs(allLogs);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(t('logs.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePhotoClick = (photoUrl) => {
    setSelectedPhoto(photoUrl);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-text-secondary">{t('loading')}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-text">{t('logs.title')}</h2>

        {/* BP Trend Chart */}
        <BPChart logs={logs} />

        {error && (
          <div className="text-error text-sm bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        {logs.length === 0 ? (
          <div className="bg-surface rounded-2xl shadow-md border border-border p-12 text-center">
            <ChartBarIcon className="w-24 h-24 text-primary mx-auto mb-4" />
            <p className="text-text-secondary">{t('logs.empty')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) =>
              log.type === 'session' ? (
                <SessionCard
                  key={log.id}
                  session={log}
                  onPhotoClick={handlePhotoClick}
                />
              ) : (
                <div
                  key={log.id}
                  className="bg-surface rounded-2xl shadow-md border border-border p-4 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex gap-4">
                    {/* Photo thumbnail */}
                    {log.photoUrl && (
                      <button
                        onClick={() => handlePhotoClick(log.photoUrl)}
                        className="flex-shrink-0"
                      >
                        <img
                          src={log.photoUrl}
                          alt="BP reading"
                          className="w-20 h-20 rounded-xl object-cover hover:opacity-80 transition-opacity duration-150"
                        />
                      </button>
                    )}

                    {/* Log details */}
                    <div className="flex-1 space-y-2">
                      <div className="text-sm text-text-secondary">
                        {formatDateTime(log.reading_at)}
                      </div>

                      <div className="flex gap-4 flex-wrap">
                        <div>
                          <span className="text-sm text-text-secondary">
                            {t('logs.bp')}:{' '}
                          </span>
                          <span className="text-base font-medium text-text">
                            {log.systolic}/{log.diastolic}
                          </span>
                        </div>

                        <div>
                          <span className="text-sm text-text-secondary">
                            {t('logs.pulse')}:{' '}
                          </span>
                          <span className="text-base font-medium text-text">
                            {log.pulse}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Image Modal */}
      <ImageModal
        imageUrl={selectedPhoto}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Layout>
  );
}
