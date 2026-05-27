import React, { useEffect } from 'react';
import { AdminCard } from './AdminCard';
import { AdminButton } from './AdminButton';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDangerous?: boolean;
}

export function AdminConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    isDangerous = false
}: ConfirmDialogProps) {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm transition-opacity">
            <div className="absolute inset-0" onClick={onCancel} />
            <AdminCard className="w-full max-w-md relative z-10 shadow-2xl">
                <div className="flex items-start gap-4 mb-6">
                    <div className={`p-3 rounded-full shrink-0 ${isDangerous ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">{title}</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <AdminButton variant="ghost" onClick={onCancel}>{cancelText}</AdminButton>
                    <AdminButton variant={isDangerous ? 'danger' : 'primary'} onClick={onConfirm}>{confirmText}</AdminButton>
                </div>
            </AdminCard>
        </div>
    );
}
