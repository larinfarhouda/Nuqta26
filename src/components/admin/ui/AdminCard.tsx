import React, { HTMLAttributes } from 'react';
import { cn } from './utils';

interface AdminCardProps extends HTMLAttributes<HTMLDivElement> {
    noPadding?: boolean;
    hoverLift?: boolean;
}

export function AdminCard({ children, className, noPadding = false, hoverLift = false, ...props }: AdminCardProps) {
    return (
        <div
            className={cn(
                // Base: White translucent background with frosted glass effect
                'bg-white/90 backdrop-blur-xl border border-zinc-200/60',
                // Dark mode
                'dark:bg-zinc-900/90 dark:border-zinc-800/60',
                // Radius & Shadow
                'rounded-3xl shadow-lg shadow-zinc-200/40 dark:shadow-black/40',
                // Transitions
                'transition-all duration-300',
                // Optional Hover Lift
                hoverLift && 'hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-black/50',
                // Padding
                !noPadding && 'p-6',
                // Overflow (for cards with tables)
                noPadding && 'overflow-hidden',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
