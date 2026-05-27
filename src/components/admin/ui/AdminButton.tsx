import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from './utils';
import { Loader2 } from 'lucide-react';

export interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'danger' | 'ghost' | 'outline' | 'success';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

export const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(
                    // Base styles
                    'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
                    // Variants
                    variant === 'primary' && 'bg-[#2CA58D] text-white hover:bg-[#258f7a] shadow-md shadow-[#2CA58D]/20 hover:shadow-lg hover:shadow-[#2CA58D]/30 focus:ring-[#2CA58D]',
                    variant === 'danger' && 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20 hover:shadow-lg focus:ring-red-500',
                    variant === 'success' && 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20 hover:shadow-lg focus:ring-emerald-500',
                    variant === 'ghost' && 'bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100',
                    variant === 'outline' && 'bg-transparent border-2 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                    // Sizes
                    size === 'sm' && 'h-8 px-3 text-xs rounded-xl',
                    size === 'md' && 'h-10 px-4 text-sm',
                    size === 'lg' && 'h-12 px-6 text-base',
                    size === 'icon' && 'h-10 w-10',
                    className
                )}
                {...props}
            >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {!isLoading && children}
            </button>
        );
    }
);
AdminButton.displayName = 'AdminButton';
