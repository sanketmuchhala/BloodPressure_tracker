// AHA 2017 Blood Pressure Categories
// Labels are translation keys — call getBPCategory(sys, dia) then use cat.labelKey with t()
// OR call getBPCategoryLabeled(sys, dia, t) for a fully labelled object ready for the UI.

export const BP_CATEGORY_STYLES = {
    NORMAL: { color: 'green', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500', labelKey: 'bpCategory.normal' },
    ELEVATED: { color: 'yellow', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500', labelKey: 'bpCategory.elevated' },
    STAGE1: { color: 'orange', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', labelKey: 'bpCategory.stage1' },
    STAGE2: { color: 'red', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', labelKey: 'bpCategory.stage2' },
    CRISIS: { color: 'red', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-700', labelKey: 'bpCategory.crisis' },
};

// Keep backward-compat alias
export const BP_CATEGORIES = {
    NORMAL: { ...BP_CATEGORY_STYLES.NORMAL, label: 'Normal' },
    ELEVATED: { ...BP_CATEGORY_STYLES.ELEVATED, label: 'Elevated' },
    STAGE1: { ...BP_CATEGORY_STYLES.STAGE1, label: 'High BP Stage 1' },
    STAGE2: { ...BP_CATEGORY_STYLES.STAGE2, label: 'High BP Stage 2' },
    CRISIS: { ...BP_CATEGORY_STYLES.CRISIS, label: 'Hypertensive Crisis' },
};

function getKey(sys, dia) {
    const s = Number(sys);
    const d = Number(dia);
    if (isNaN(s) || isNaN(d)) return 'NORMAL';
    if (s > 180 || d > 120) return 'CRISIS';
    if (s >= 140 || d >= 90) return 'STAGE2';
    if (s >= 130 || d >= 80) return 'STAGE1';
    if (s >= 120 && d < 80) return 'ELEVATED';
    return 'NORMAL';
}

/**
 * Returns style + English label (backward compat).
 * Use getBPCategoryLabeled(sys, dia, t) for translated labels.
 */
export function getBPCategory(sys, dia) {
    return BP_CATEGORIES[getKey(sys, dia)];
}

/**
 * Returns style + translated label.
 * @param {number} sys
 * @param {number} dia
 * @param {function} t  – translation function from useLang()
 */
export function getBPCategoryLabeled(sys, dia, t) {
    const style = BP_CATEGORY_STYLES[getKey(sys, dia)];
    return { ...style, label: t(style.labelKey) };
}
