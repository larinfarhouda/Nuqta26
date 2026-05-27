import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from './utils';

export interface AdminInputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
}

export const AdminInput = forwardRef<HTMLInputElement, AdminInputProps>(
    ({ className, icon, ...props }, ref) => {
        return (
            <div className="relative w-full">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                        {icon}
                    </div>
                )}
                <input
                    ref={ref}
                    className={cn(
                        "w-full h-11 px-4 text-sm rounded-2xl border-2 transition-all duration-200 outline-none",
                        "bg-white dark:bg-zinc-900",
                        "border-zinc-200 dark:border-zinc-800",
                        "text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400",
                        "focus:border-[#2CA58D] focus:ring-4 focus:ring-[#2CA58D]/10",
                        "disabled:bg-zinc-50 dark:disabled:bg-zinc-950 disabled:text-zinc-500 disabled:cursor-not-allowed",
                        icon && "pl-10",
                        className
                    )}
                    {...props}
                />
            </div>
        );
    }
);
AdminInput.displayName = 'AdminInput';
