/**
 * AHA 2017 Blood Pressure Category Guidelines
 *
 * Normal:              SYS < 120  AND  DIA < 80
 * Elevated:            SYS 120-129 AND DIA < 80
 * High BP Stage 1:     SYS 130-139 OR  DIA 80-89
 * High BP Stage 2:     SYS ≥ 140  OR  DIA ≥ 90
 * Hypertensive Crisis: SYS > 180  AND/OR DIA > 120
 */

export const BP_CATEGORIES = {
    NORMAL: { label: 'Normal', color: 'green', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
    ELEVATED: { label: 'Elevated', color: 'yellow', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
    STAGE1: { label: 'High BP Stage 1', color: 'orange', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
    STAGE2: { label: 'High BP Stage 2', color: 'red', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
    CRISIS: { label: 'Hypertensive Crisis', color: 'red', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-700' },
};

/**
 * Classify a blood pressure reading into an AHA category.
 * @param {number} sys - Systolic value
 * @param {number} dia - Diastolic value
 * @returns {object} Category metadata from BP_CATEGORIES
 */
export function getBPCategory(sys, dia) {
    const s = Number(sys);
    const d = Number(dia);

    if (isNaN(s) || isNaN(d)) return BP_CATEGORIES.NORMAL;

    if (s > 180 || d > 120) return BP_CATEGORIES.CRISIS;
    if (s >= 140 || d >= 90) return BP_CATEGORIES.STAGE2;
    if (s >= 130 || d >= 80) return BP_CATEGORIES.STAGE1;
    if (s >= 120 && d < 80) return BP_CATEGORIES.ELEVATED;
    return BP_CATEGORIES.NORMAL;
}

/**
 * Small inline badge component data — use category.label + category.text + category.bg.
 * Returns a simple JSX-ready string for use in chips/badges.
 */
export function getCategoryBadgeProps(sys, dia) {
    const cat = getBPCategory(sys, dia);
    return cat;
}
