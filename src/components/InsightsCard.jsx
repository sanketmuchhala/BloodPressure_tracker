import { useMemo } from 'react';
import { getBPCategory } from '../utils/bpCategory';
import { FireIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon, ClockIcon } from '@heroicons/react/24/outline';

/**
 * InsightsCard — Daily qualitative insights (no redundant number averages)
 *
 * Shows:
 *   • Today's BP status (AHA category badge for today's avg, no raw numbers)
 *   • Reading count today vs yesterday
 *   • Trend vs yesterday (↑ ↓ —) — qualitative
 *   • Logging streak
 *   • Usual time of day
 */
export function InsightsCard({ logs }) {
    const insights = useMemo(() => {
        const now = new Date();
        const dayMs = 24 * 60 * 60 * 1000;

        const vals = (entry) => ({
            sys: entry.type === 'session' ? entry.avg_systolic : entry.systolic,
            dia: entry.type === 'session' ? entry.avg_diastolic : entry.diastolic,
            pul: entry.type === 'session' ? entry.avg_pulse : entry.pulse,
            ts: new Date(entry.session_at || entry.reading_at),
        });

        const all = logs.map(vals).filter(v => v.sys && v.dia);

        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday - dayMs);

        const todayEntries = all.filter(v => v.ts >= startOfToday);
        const yesterdayEntries = all.filter(v => v.ts >= startOfYesterday && v.ts < startOfToday);

        if (todayEntries.length === 0 && yesterdayEntries.length === 0) return null;

        const avg = (arr, key) =>
            arr.length ? Math.round(arr.reduce((s, v) => s + v[key], 0) / arr.length) : null;

        // Today's average → category
        const todaySys = avg(todayEntries, 'sys');
        const todayDia = avg(todayEntries, 'dia');
        const todayCat = todaySys != null ? getBPCategory(todaySys, todayDia) : null;

        // Yesterday's average → category for trend comparison
        const yestSys = avg(yesterdayEntries, 'sys');
        const yestCat = yestSys != null ? getBPCategory(yestSys, avg(yesterdayEntries, 'dia')) : null;

        // Trend: qualitative (better / worse / same)
        let trend = null;
        if (todaySys != null && yestSys != null) {
            const diff = todaySys - yestSys;
            trend = Math.abs(diff) <= 3 ? 'same' : diff < 0 ? 'better' : 'worse';
        }

        // Streak
        let streak = 0;
        const loggedDays = new Set(all.map(v => v.ts.toLocaleDateString()));
        let d = new Date(now);
        if (!loggedDays.has(d.toLocaleDateString())) d = new Date(d - dayMs);
        while (loggedDays.has(d.toLocaleDateString())) { streak++; d = new Date(d - dayMs); }

        // Usual time of day (last 7 days)
        const cutoff7 = new Date(now - 7 * dayMs);
        const recent = all.filter(v => v.ts >= cutoff7);
        const morningCount = recent.filter(v => { const h = v.ts.getHours(); return h >= 5 && h < 12; }).length;
        const eveningCount = recent.filter(v => { const h = v.ts.getHours(); return h >= 17 && h < 22; }).length;
        const timePattern = morningCount + eveningCount > 2
            ? (morningCount >= eveningCount ? 'morning' : 'evening')
            : null;

        return {
            todayCat, yestCat, trend,
            todayCount: todayEntries.length,
            yestCount: yesterdayEntries.length,
            streak, timePattern,
        };
    }, [logs]);

    if (!insights) return null;

    const { todayCat, yestCat, trend, todayCount, yestCount, streak, timePattern } = insights;

    const TrendIcon = trend === 'worse' ? ArrowTrendingUpIcon : trend === 'better' ? ArrowTrendingDownIcon : MinusIcon;
    const trendColor = trend === 'worse' ? 'text-red-600 bg-red-50' : trend === 'better' ? 'text-green-600 bg-green-50' : 'text-text-secondary bg-background';
    const trendLabel = trend === 'worse' ? 'Higher than yesterday' : trend === 'better' ? 'Lower than yesterday' : 'Similar to yesterday';

    return (
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-text">Today's Status</h3>
                {todayCount > 0
                    ? <span className="text-xs text-text-secondary">{todayCount} reading{todayCount > 1 ? 's' : ''} today</span>
                    : <span className="text-xs text-text-secondary">No readings today yet</span>
                }
            </div>

            <div className="flex flex-wrap gap-2">

                {/* Today's category */}
                {todayCat && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border ${todayCat.bg} ${todayCat.text} ${todayCat.border}`}>
                        <span className={`w-2 h-2 rounded-full ${todayCat.dot}`} />
                        {todayCat.label}
                    </span>
                )}

                {/* Trend vs yesterday */}
                {trend && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium ${trendColor}`}>
                        <TrendIcon className="w-4 h-4" />
                        {trendLabel}
                    </span>
                )}

                {/* Streak */}
                {streak > 1 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-orange-600 bg-orange-50">
                        <FireIcon className="w-4 h-4" />
                        {streak} day streak
                    </span>
                )}

                {/* Time pattern */}
                {timePattern && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-text-secondary bg-background">
                        <ClockIcon className="w-4 h-4" />
                        Usually logs in the <strong className="ml-1 text-text">{timePattern}</strong>
                    </span>
                )}

                {/* No readings today — show yesterday's status */}
                {todayCount === 0 && yestCat && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border ${yestCat.bg} ${yestCat.text} ${yestCat.border}`}>
                        <span className={`w-2 h-2 rounded-full ${yestCat.dot}`} />
                        Yesterday: {yestCat.label}
                    </span>
                )}
            </div>
        </div>
    );
}
