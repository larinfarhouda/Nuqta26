/**
 * Admin Dashboard Design Tokens
 * Shared style constants for all admin components.
 * Import from here instead of duplicating inline styles.
 */

import type { CSSProperties } from 'react';

// ─── Colors ─────────────────────────────────────────────────────────────────

export const colors = {
    // Layout
    bg: '#f1f5f9',
    card: '#fff',
    cardAlt: '#f8fafc',

    // Text
    text: {
        primary: '#0f172a',
        secondary: '#475569',
        muted: '#64748b',
        faint: '#94a3b8',
    },

    // Borders
    border: '#e2e8f0',
    borderLight: '#f1f5f9',

    // Accent (purple)
    accent: '#8b5cf6',
    accentDark: '#7c3aed',
    accentLight: '#ede9fe',

    // Status
    success: { text: '#166534', bg: '#dcfce7', accent: '#10b981' },
    danger: { text: '#991b1b', bg: '#fecaca', accent: '#ef4444' },
    warning: { text: '#854d0e', bg: '#fef9c3', accent: '#f59e0b' },
    info: { text: '#1e40af', bg: '#dbeafe', accent: '#3b82f6' },
} as const;

// ─── Radius & Shadow ────────────────────────────────────────────────────────

export const radius = {
    sm: '6px',
    md: '8px',
    lg: '10px',
    xl: '12px',
    '2xl': '14px',
    '3xl': '16px',
} as const;

export const shadow = {
    card: '0 1px 3px rgba(0,0,0,0.08)',
    modal: '-4px 0 24px rgba(0,0,0,0.12)',
    elevated: '0 4px 12px rgba(0,0,0,0.1)',
} as const;

// ─── Typography ─────────────────────────────────────────────────────────────

export const font = {
    pageTitle: { fontSize: '26px', fontWeight: 700, color: colors.text.primary } as CSSProperties,
    pageSubtitle: { color: colors.text.muted, fontSize: '14px', marginTop: '4px' } as CSSProperties,
    sectionTitle: { fontSize: '16px', fontWeight: 600, color: colors.text.primary } as CSSProperties,
    sectionSubtitle: { fontSize: '14px', fontWeight: 700, color: colors.text.primary, margin: '0 0 16px' } as CSSProperties,
    label: {
        fontSize: '12px', fontWeight: 600, color: colors.text.muted,
        marginBottom: '6px', display: 'block',
        textTransform: 'uppercase', letterSpacing: '0.05em',
    } as CSSProperties,
    caption: { fontSize: '12px', color: colors.text.faint } as CSSProperties,
    tableHeader: {
        padding: '14px 16px', textAlign: 'left' as const, fontSize: '12px',
        fontWeight: 600, color: colors.text.muted,
        textTransform: 'uppercase' as const, letterSpacing: '0.05em',
    } as CSSProperties,
} as const;

// ─── Component Styles ───────────────────────────────────────────────────────

/** White card container with subtle border and shadow */
export const cardStyle: CSSProperties = {
    background: colors.card,
    borderRadius: radius['3xl'],
    padding: '24px',
    boxShadow: shadow.card,
    border: `1px solid ${colors.border}`,
};

/** Same card without padding (for tables) */
export const cardShell: CSSProperties = {
    background: colors.card,
    borderRadius: radius['3xl'],
    boxShadow: shadow.card,
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
};

/** Standard text input / select */
export const inputStyle: CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    fontSize: '14px',
    color: colors.text.primary,
    backgroundColor: '#ffffff',
    outline: 'none',
    transition: 'border-color 0.2s',
};

/** Read-only / disabled input variant */
export const inputDisabled: CSSProperties = {
    ...inputStyle,
    backgroundColor: colors.cardAlt,
    color: colors.text.muted,
};

/** Primary action button (purple) */
export const btnPrimary: CSSProperties = {
    padding: '10px 20px',
    borderRadius: radius.lg,
    border: 'none',
    background: colors.accent,
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
};

/** Danger / destructive button */
export const btnDanger: CSSProperties = {
    padding: '6px 10px',
    borderRadius: radius.md,
    border: 'none',
    background: colors.danger.bg,
    color: colors.danger.text,
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
};

/** Ghost / secondary button */
export const btnGhost: CSSProperties = {
    padding: '8px 14px',
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    background: colors.card,
    color: colors.text.secondary,
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    textDecoration: 'none',
};

/** Section divider inside panels */
export const sectionStyle: CSSProperties = {
    padding: '20px 24px',
    borderBottom: `1px solid ${colors.borderLight}`,
};

/** Table cell standard padding */
export const cellStyle: CSSProperties = {
    padding: '14px 16px',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Status badge styling */
export function badgeStyle(variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral'): CSSProperties {
    const map = {
        success: { bg: colors.success.bg, color: colors.success.text },
        danger: { bg: colors.danger.bg, color: colors.danger.text },
        warning: { bg: colors.warning.bg, color: colors.warning.text },
        info: { bg: colors.info.bg, color: colors.info.text },
        neutral: { bg: colors.cardAlt, color: colors.text.muted },
    };
    const { bg, color } = map[variant];
    return {
        padding: '4px 10px',
        borderRadius: radius.sm,
        fontSize: '12px',
        fontWeight: 600,
        background: bg,
        color,
    };
}

/** Tab button styling */
export function tabStyle(active: boolean): CSSProperties {
    return {
        padding: '12px 16px',
        fontSize: '13px',
        fontWeight: active ? 600 : 400,
        color: active ? colors.accent : colors.text.muted,
        background: 'none',
        cursor: 'pointer',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: active ? `2px solid ${colors.accent}` : '2px solid transparent',
        textTransform: 'capitalize' as const,
        transition: 'all 0.2s',
    };
}

/** Stat card icon container */
export function iconBox(color: string, size = 44): CSSProperties {
    return {
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: radius.xl,
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };
}

/** Table row with hover effect helpers */
export const rowHover = {
    onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => {
        e.currentTarget.style.background = colors.cardAlt;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => {
        e.currentTarget.style.background = '';
    },
};

/** Pagination button */
export function paginationBtn(active: boolean): CSSProperties {
    return {
        padding: '8px 14px',
        borderRadius: radius.md,
        border: `1px solid ${colors.border}`,
        background: active ? colors.accent : colors.card,
        color: active ? '#fff' : colors.text.secondary,
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
    };
}

/** Overlay for modals / slide-out panels */
export const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'flex-end',
};

/** Modal / slide-out panel */
export const panelStyle: CSSProperties = {
    width: '640px',
    maxWidth: '100vw',
    height: '100vh',
    background: colors.card,
    overflowY: 'auto',
    boxShadow: shadow.modal,
};

/** Centered modal dialog */
export const dialogOverlay: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
};

export const dialogPanel: CSSProperties = {
    background: colors.card,
    borderRadius: radius['3xl'],
    padding: '28px',
    maxWidth: '520px',
    width: '100%',
    maxHeight: '80vh',
    overflow: 'auto',
};
