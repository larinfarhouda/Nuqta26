import React from 'react';
import { cn } from './utils';

export interface AdminBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'accent';
}

export function AdminBadge({ children, variant = 'neutral', className, ...props }: AdminBadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide uppercase",
                variant === 'success' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
                variant === 'danger' && "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
                variant === 'warning' && "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
                variant === 'info' && "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
                variant === 'neutral' && "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
                variant === 'accent' && "bg-[#2CA58D]/10 text-[#2CA58D] dark:bg-[#2CA58D]/20",
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}
