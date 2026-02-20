import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useLang } from '../i18n/useLang';

/**
 * SessionCard Component
 * Displays a blood pressure session with averaged readings
 * Expandable to show individual readings that make up the average
 */
export function SessionCard({ session, onPhotoClick }) {
  const { t } = useLang();
  const [expanded, setExpanded] = useState(false);

  // Format date and time
  const sessionDate = new Date(session.session_at);
  const formattedDate = sessionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = sessionDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-surface rounded-2xl shadow-md border border-border overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Session Header */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Photo Thumbnail */}
          {session.photoUrl && (
            <div
              className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onPhotoClick(session.photoUrl)}
            >
              <img
                src={session.photoUrl}
                alt="BP monitor"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Session Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-text">
                {t('session.title')}
              </h3>
              <span className="text-xs text-text-secondary bg-background px-2 py-1 rounded">
                {session.reading_count} {t('session.readingCount')}
              </span>
            </div>

            <p className="text-sm text-text-secondary mb-3">
              {formattedDate} {t('entry.at')} {formattedTime}
            </p>

            {/* Average Display */}
            <div className="bg-primary/10 border border-primary rounded-lg p-3">
              <div className="text-xs font-medium text-primary mb-1">
                {t('session.average')}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xl font-bold text-text">
                  {session.avg_systolic}/{session.avg_diastolic}
                </div>
                <div className="text-sm text-text-secondary">mmHg</div>
                <div className="text-sm text-text-secondary">•</div>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold text-text">
                    {session.avg_pulse}
                  </span>
                  <span className="text-sm text-text-secondary">bpm</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        {session.readings && session.readings.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 w-full flex items-center justify-center gap-1 px-3 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-all duration-150"
          >
            {expanded ? (
              <>
                <span>{t('session.hideReadings')}</span>
                <ChevronUpIcon className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>{t('session.showReadings')}</span>
                <ChevronDownIcon className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Individual Readings (Expandable) */}
      {expanded && session.readings && (
        <div className="border-t border-border bg-background/50">
          <div className="p-4 space-y-2">
            <h4 className="text-xs font-medium text-text-secondary mb-2">
              {t('session.individualReadings')}
            </h4>
            {session.readings.map((reading, index) => (
              <div
                key={reading.id}
                className="flex items-center justify-between py-2 px-3 bg-surface rounded-lg"
              >
                <span className="text-sm text-text-secondary">
                  {t('session.reading')} {index + 1}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-text">
                    {reading.systolic}/{reading.diastolic}
                  </span>
                  <span className="text-xs text-text-secondary">•</span>
                  <span className="text-sm font-medium text-text">
                    {reading.pulse} bpm
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
