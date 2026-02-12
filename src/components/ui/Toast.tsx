'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => { } });

export function useToast() {
    return useContext(ToastContext);
}

const ICONS: Record<ToastType, any> = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', icon: '#16a34a', text: '#166534' },
    error: { bg: '#fef2f2', border: '#fecaca', icon: '#dc2626', text: '#991b1b' },
    warning: { bg: '#fffbeb', border: '#fde68a', icon: '#d97706', text: '#92400e' },
    info: { bg: '#eff6ff', border: '#bfdbfe', icon: '#2563eb', text: '#1e40af' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            {/* Toast Container */}
            <div
                style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 10000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    pointerEvents: 'none',
                }}
            >
                {toasts.map(t => {
                    const Icon = ICONS[t.type];
                    const c = COLORS[t.type];
                    return (
                        <div
                            key={t.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                background: c.bg,
                                border: `1px solid ${c.border}`,
                                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                                pointerEvents: 'auto',
                                animation: 'slideInRight 0.3s ease-out',
                                minWidth: '280px',
                                maxWidth: '420px',
                            }}
                        >
                            <Icon size={18} style={{ color: c.icon, flexShrink: 0 }} />
                            <span style={{ fontSize: '14px', fontWeight: 500, color: c.text, flex: 1 }}>
                                {t.message}
                            </span>
                            <button
                                onClick={() => removeToast(t.id)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    padding: '2px', flexShrink: 0, color: c.text, opacity: 0.6,
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </ToastContext.Provider>
    );
}
