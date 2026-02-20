import { useState, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

/**
 * BPChart
 * Shows systolic / diastolic / pulse over time.
 *
 * Props:
 *   logs — merged array of sessions + individual readings from Logs.jsx
 *
 * Ranges: Today · 5 Days · 10 Days · 30 Days
 *   "Today" shows every individual reading from midnight to now
 *   Multi-day shows each individual reading as a point on the x-axis
 */

const RANGES = [
    { label: 'Today', days: 0 },
    { label: '5 Days', days: 5 },
    { label: '10 Days', days: 10 },
    { label: '30 Days', days: 30 },
];

// Custom tooltip
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-3 text-sm min-w-[140px]">
            <p className="text-gray-500 mb-2 font-medium">{label}</p>
            {payload.map((p) => (
                <div key={p.dataKey} className="flex items-center justify-between gap-4">
                    <span style={{ color: p.color }} className="font-medium">{p.name}</span>
                    <span className="font-bold text-gray-800">{p.value}</span>
                </div>
            ))}
        </div>
    );
}

export function BPChart({ logs }) {
    const [range, setRange] = useState(0); // index into RANGES

    // Build chart data from logs filtered by range
    const chartData = useMemo(() => {
        const now = new Date();
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const { days } = RANGES[range];

        const cutoff = days === 0
            ? midnight
            : new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // Flatten: for sessions use avg values, for individual logs use direct values
        const points = logs
            .filter((entry) => {
                const ts = new Date(entry.session_at || entry.reading_at);
                return ts >= cutoff && ts <= now;
            })
            .map((entry) => {
                const ts = new Date(entry.session_at || entry.reading_at);
                const isSession = entry.type === 'session';
                return {
                    ts,
                    systolic: isSession ? entry.avg_systolic : entry.systolic,
                    diastolic: isSession ? entry.avg_diastolic : entry.diastolic,
                    pulse: isSession ? entry.avg_pulse : entry.pulse,
                };
            })
            .filter(p => p.systolic && p.diastolic && p.pulse)
            .sort((a, b) => a.ts - b.ts);

        // Format x-axis label
        const formatLabel = (ts) => {
            if (days === 0) {
                // Today: HH:MM
                return ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            // Multi-day: Mon 12:30, etc.
            return ts.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
                ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        return points.map((p) => ({
            label: formatLabel(p.ts),
            Systolic: p.systolic,
            Diastolic: p.diastolic,
            Pulse: p.pulse,
        }));
    }, [logs, range]);

    const hasData = chartData.length > 0;

    return (
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
            {/* Header + range buttons */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="font-semibold text-text">Blood Pressure Trend</h3>
                <div className="flex gap-1 bg-background border border-border rounded-lg p-1">
                    {RANGES.map((r, i) => (
                        <button
                            key={r.label}
                            type="button"
                            onClick={() => setRange(i)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${range === i
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-text-secondary hover:text-text'
                                }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 text-xs text-text-secondary">
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-red-500 inline-block rounded" />
                    Systolic
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-blue-500 inline-block rounded" />
                    Diastolic
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />
                    Pulse
                </span>
            </div>

            {/* Chart */}
            {hasData ? (
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: '#9ca3af' }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            domain={['auto', 'auto']}
                            tick={{ fontSize: 11, fill: '#9ca3af' }}
                            tickLine={false}
                            axisLine={false}
                            width={35}
                        />
                        {/* Normal BP reference lines */}
                        <ReferenceLine y={120} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.4} />
                        <ReferenceLine y={80} stroke="#3b82f6" strokeDasharray="4 4" strokeOpacity={0.4} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="Systolic"
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }}
                            activeDot={{ r: 5 }}
                            connectNulls
                        />
                        <Line
                            type="monotone"
                            dataKey="Diastolic"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                            activeDot={{ r: 5 }}
                            connectNulls
                        />
                        <Line
                            type="monotone"
                            dataKey="Pulse"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                            activeDot={{ r: 5 }}
                            connectNulls
                        />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-[220px] flex flex-col items-center justify-center text-text-secondary text-sm gap-2">
                    <span className="text-2xl">📈</span>
                    <span>No data for this period</span>
                </div>
            )}
        </div>
    );
}
