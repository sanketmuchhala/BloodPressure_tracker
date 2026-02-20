import { useMemo } from 'react';
import { getBPCategoryLabeled } from '../utils/bpCategory';
import { FireIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useLang } from '../i18n/useLang';

export function InsightsCard({ logs }) {
    const { t } = useLang();

    const insights = useMemo(() => {
        const now = new Date();
        const dayMs = 24 * 60 * 60 * 1000;

        const vals = (entry) => ({
            sys: entry.type === 'session' ? entry.avg_systolic : entry.systolic,
            dia: entry.type === 'session' ? entry.avg_diastolic : entry.diastolic,
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

        const todaySys = avg(todayEntries, 'sys');
        const todayDia = avg(todayEntries, 'dia');
        const yestSys = avg(yesterdayEntries, 'sys');
        const yestDia = avg(yesterdayEntries, 'dia');

        let trend = null;
        if (todaySys != null && yestSys != null) {
            const diff = todaySys - yestSys;
            trend = Math.abs(diff) <= 3 ? 'same' : diff < 0 ? 'better' : 'worse';
        }

        let streak = 0;
        const loggedDays = new Set(all.map(v => v.ts.toLocaleDateString()));
        let d = new Date(now);
        if (!loggedDays.has(d.toLocaleDateString())) d = new Date(d - dayMs);
        while (loggedDays.has(d.toLocaleDateString())) { streak++; d = new Date(d - dayMs); }

        const cutoff7 = new Date(now - 7 * dayMs);
        const recent = all.filter(v => v.ts >= cutoff7);
        const morningCount = recent.filter(v => { const h = v.ts.getHours(); return h >= 5 && h < 12; }).length;
        const eveningCount = recent.filter(v => { const h = v.ts.getHours(); return h >= 17 && h < 22; }).length;
        const timePattern = morningCount + eveningCount > 2
            ? (morningCount >= eveningCount ? 'morning' : 'evening')
            : null;

        return {
            todaySys, todayDia, yestSys, yestDia,
            trend,
            todayCount: todayEntries.length,
            streak, timePattern,
        };
    }, [logs]);

    if (!insights) return null;

    const { todaySys, todayDia, yestSys, yestDia, trend, todayCount, streak, timePattern } = insights;

    const todayCat = todaySys != null ? getBPCategoryLabeled(todaySys, todayDia, t) : null;
    const yestCat = yestSys != null ? getBPCategoryLabeled(yestSys, yestDia, t) : null;

    const TrendIcon = trend === 'worse' ? ArrowTrendingUpIcon : trend === 'better' ? ArrowTrendingDownIcon : MinusIcon;
    const trendColor = trend === 'worse' ? 'text-red-600 bg-red-50' : trend === 'better' ? 'text-green-600 bg-green-50' : 'text-text-secondary bg-background';
    const trendLabel = trend === 'worse'
        ? t('insights.higherThanYesterday')
        : trend === 'better'
            ? t('insights.lowerThanYesterday')
            : t('insights.similarToYesterday');

    return (
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-text">{t('insights.todayStatus')}</h3>
                {todayCount > 0
                    ? <span className="text-xs text-text-secondary">
                        {(todayCount === 1 ? t('insights.readingsToday_one') : t('insights.readingsToday_other'))
                            .replace('{{count}}', todayCount)}
                    </span>
                    : <span className="text-xs text-text-secondary">{t('insights.noReadingsToday')}</span>
                }
            </div>

            <div className="flex flex-wrap gap-2">
                {todayCat && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border ${todayCat.bg} ${todayCat.text} ${todayCat.border}`}>
                        <span className={`w-2 h-2 rounded-full ${todayCat.dot}`} />
                        {todayCat.label}
                    </span>
                )}

                {trend && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium ${trendColor}`}>
                        <TrendIcon className="w-4 h-4" />
                        {trendLabel}
                    </span>
                )}

                {streak > 1 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-orange-600 bg-orange-50">
                        <FireIcon className="w-4 h-4" />
                        {t('insights.dayStreak').replace('{{count}}', streak)}
                    </span>
                )}

                {timePattern && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-text-secondary bg-background">
                        <ClockIcon className="w-4 h-4" />
                        {timePattern === 'morning' ? t('insights.usuallyMorning') : t('insights.usuallyEvening')}
                    </span>
                )}

                {todayCount === 0 && yestCat && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border ${yestCat.bg} ${yestCat.text} ${yestCat.border}`}>
                        <span className={`w-2 h-2 rounded-full ${yestCat.dot}`} />
                        {t('insights.yesterday')}: {yestCat.label}
                    </span>
                )}
            </div>
        </div>
    );
}
