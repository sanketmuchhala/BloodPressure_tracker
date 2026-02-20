import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useLang } from '../i18n/useLang';
import { getBPCategory } from '../utils/bpCategory';

/**
 * SessionCard Component
 * • Shows session average with AHA category badge
 * • Expandable individual readings each with their own category badge
 */
export function SessionCard({ session, onPhotoClick }) {
  const { t } = useLang();
  const [expanded, setExpanded] = useState(false);

  const sessionDate = new Date(session.session_at);
  const formattedDate = sessionDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const formattedTime = sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const avgCat = getBPCategory(session.avg_systolic, session.avg_diastolic);

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
              <img src={session.photoUrl} alt="BP monitor" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Session Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
              <h3 className="font-semibold text-text">{t('session.title')}</h3>
              <span className="text-xs text-text-secondary bg-background px-2 py-1 rounded">
                {session.reading_count} {t('session.readingCount')}
              </span>
            </div>

            <p className="text-sm text-text-secondary mb-3">
              {formattedDate} {t('entry.at')} {formattedTime}
            </p>

            {/* Average Display — with AHA badge */}
            <div className={`border rounded-xl p-3 ${avgCat.bg} ${avgCat.border}`}>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                <span className={`text-xs font-medium ${avgCat.text}`}>{t('session.average')}</span>
                {/* AHA category badge on the average */}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${avgCat.bg} ${avgCat.text} ${avgCat.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${avgCat.dot}`} />
                  {avgCat.label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-bold tabular-nums ${avgCat.text}`}>
                  {session.avg_systolic}/{session.avg_diastolic}
                </span>
                <span className="text-sm text-text-secondary">mmHg</span>
                <span className="text-sm text-text-secondary">·</span>
                <span className={`text-xl font-bold tabular-nums ${avgCat.text}`}>{session.avg_pulse}</span>
                <span className="text-sm text-text-secondary">bpm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expand/Collapse */}
        {session.readings && session.readings.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 w-full flex items-center justify-center gap-1 px-3 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-all duration-150"
          >
            {expanded ? (
              <><span>{t('session.hideReadings')}</span><ChevronUpIcon className="w-4 h-4" /></>
            ) : (
              <><span>{t('session.showReadings')}</span><ChevronDownIcon className="w-4 h-4" /></>
            )}
          </button>
        )}
      </div>

      {/* Individual Readings (Expandable) */}
      {expanded && session.readings && (
        <div className="border-t border-border bg-background/50">
          <div className="p-4 space-y-2">
            <h4 className="text-xs font-medium text-text-secondary mb-2">{t('session.individualReadings')}</h4>
            {session.readings.map((reading, index) => {
              const cat = getBPCategory(reading.systolic, reading.diastolic);
              return (
                <div
                  key={reading.id}
                  className="flex items-center justify-between py-2.5 px-3 bg-surface rounded-xl border border-border"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-base font-semibold text-text tabular-nums">
                      {reading.systolic}/{reading.diastolic}
                    </span>
                    <span className="text-sm text-text-secondary">♥ {reading.pulse}</span>
                  </div>
                  {/* Per-reading AHA badge */}
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${cat.bg} ${cat.text} ${cat.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                    {cat.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
