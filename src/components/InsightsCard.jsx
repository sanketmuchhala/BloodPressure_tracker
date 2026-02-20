import { useMemo } from 'react';
import { getBPCategory } from '../utils/bpCategory';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon, FireIcon, ClockIcon } from '@heroicons/react/24/outline';

/**
 * InsightsCard
 *
 * Shows a summary panel for the Logs page:
 *   • 7-day average SYS / DIA / PULSE + category badge
 *   • Change vs. prior 7 days (↑ / ↓ / —)
 *   • Current logging streak (consecutive days)
 *   • Time-of-day pattern (morning vs evening dominant)
 *
 * Props:
 *   logs — merged array of sessions + individual readings (same as BPChart)
 */
export function InsightsCard({ logs }) {
    const insights = useMemo(() => {
        const now = new Date();
        const dayMs = 24 * 60 * 60 * 1000;

        // Helper: get numeric values from a log entry
        const vals = (entry) => ({
            sys: entry.type === 'session' ? entry.avg_systolic : entry.systolic,
            dia: entry.type === 'session' ? entry.avg_diastolic : entry.diastolic,
            pul: entry.type === 'session' ? entry.avg_pulse : entry.pulse,
            ts: new Date(entry.session_at || entry.reading_at),
        });

        const all = logs.map(vals).filter(v => v.sys && v.dia && v.pul);

        // ── 7-day average ─────────────────────────────────────────────────────
        const cutoff7 = new Date(now - 7 * dayMs);
        const cutoff14 = new Date(now - 14 * dayMs);

        const last7 = all.filter(v => v.ts >= cutoff7);
        const prev7 = all.filter(v => v.ts >= cutoff14 && v.ts < cutoff7);

        const avg = (arr, key) =>
            arr.length ? Math.round(arr.reduce((s, v) => s + v[key], 0) / arr.length) : null;

        const thisWeek = {
            sys: avg(last7, 'sys'),
            dia: avg(last7, 'dia'),
            pul: avg(last7, 'pul'),
        };
        const lastWeek = {
            sys: avg(prev7, 'sys'),
            dia: avg(prev7, 'dia'),
        };

        // ── Delta (change vs prior week) ─────────────────────────────────────
        const delta = (thisWeek.sys != null && lastWeek.sys != null)
            ? { sys: thisWeek.sys - lastWeek.sys, dia: thisWeek.dia - lastWeek.dia }
            : null;

        // ── Streak (consecutive days with ≥1 entry) ──────────────────────────
        let streak = 0;
        if (all.length > 0) {
            const loggedDays = new Set(
                all.map(v => v.ts.toLocaleDateString())
            );
            let d = new Date(now);
            // If nothing logged today yet, start checking from yesterday
            if (!loggedDays.has(d.toLocaleDateString())) {
                d = new Date(d - dayMs);
            }
            while (loggedDays.has(d.toLocaleDateString())) {
                streak++;
                d = new Date(d - dayMs);
            }
        }

        // ── Time-of-day pattern ───────────────────────────────────────────────
        const recent = all.filter(v => v.ts >= cutoff7);
        const morningCount = recent.filter(v => v.ts.getHours() >= 5 && v.ts.getHours() < 12).length;
        const eveningCount = recent.filter(v => v.ts.getHours() >= 17 && v.ts.getHours() < 22).length;
        let timePattern = null;
        if (morningCount + eveningCount > 0) {
            timePattern = morningCount >= eveningCount ? 'morning' : 'evening';
        }

        return { thisWeek, lastWeek, delta, streak, timePattern, count7: last7.length };
    }, [logs]);

    const { thisWeek, delta, streak, timePattern, count7 } = insights;

    if (count7 === 0) return null;

    const cat = getBPCategory(thisWeek.sys, thisWeek.dia);

    const DeltaIcon = !delta ? null
        : delta.sys > 0 ? ArrowTrendingUpIcon
            : delta.sys < 0 ? ArrowTrendingDownIcon
                : MinusIcon;

    const deltaColor = !delta ? '' : delta.sys > 2 ? 'text-red-500' : delta.sys < -2 ? 'text-green-600' : 'text-text-secondary';

    return (
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold text-text">7-Day Insights</h3>
                {/* Category badge */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cat.bg} ${cat.text} ${cat.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                    {cat.label}
                </span>
            </div>

            {/* Main averages */}
            <div className="grid grid-cols-3 gap-3 text-center">
                {[
                    { label: 'Systolic', value: thisWeek.sys },
                    { label: 'Diastolic', value: thisWeek.dia },
                    { label: 'Pulse', value: thisWeek.pul },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-background rounded-xl py-3 px-2">
                        <div className="text-2xl font-bold text-text tabular-nums">{value ?? '—'}</div>
                        <div className="text-xs text-text-secondary mt-0.5">{label}</div>
                    </div>
                ))}
            </div>

            {/* Meta row: delta, streak, pattern */}
            <div className="flex flex-wrap gap-3">

                {/* Week-over-week */}
                {delta && DeltaIcon && (
                    <div className={`flex items-center gap-1.5 text-sm ${deltaColor} bg-background rounded-lg px-3 py-2`}>
                        <DeltaIcon className="w-4 h-4" />
                        <span className="font-medium">
                            {Math.abs(delta.sys)} SYS {delta.sys > 0 ? 'up' : delta.sys < 0 ? 'down' : '—'} vs last week
                        </span>
                    </div>
                )}

                {/* Streak */}
                {streak > 0 && (
                    <div className="flex items-center gap-1.5 text-sm text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
                        <FireIcon className="w-4 h-4" />
                        <span className="font-medium">{streak} day{streak > 1 ? 's' : ''} streak</span>
                    </div>
                )}

                {/* Time-of-day pattern */}
                {timePattern && (
                    <div className="flex items-center gap-1.5 text-sm text-text-secondary bg-background rounded-lg px-3 py-2">
                        <ClockIcon className="w-4 h-4" />
                        <span>Usually logs in the <strong className="text-text">{timePattern}</strong></span>
                    </div>
                )}
            </div>

            <div className="text-xs text-text-secondary">
                Based on {count7} reading{count7 > 1 ? 's' : ''} in the last 7 days
            </div>
        </div>
    );
}
