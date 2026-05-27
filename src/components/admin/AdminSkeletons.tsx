/**
 * Admin Loading Skeletons
 * Reusable skeleton components for admin pages using Tailwind CSS
 */

import { AdminCard } from './ui/AdminCard';

export function StatCardSkeleton() {
    return (
        <AdminCard className="animate-pulse">
            <div className="flex justify-between mb-4">
                <div className="w-24 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            </div>
            <div className="w-20 h-7 bg-zinc-200 dark:bg-zinc-800 rounded-md mb-2" />
            <div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        </AdminCard>
    );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
    return (
        <tr>
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div
                        className={`h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse`}
                        style={{
                            width: i === 0 ? '60%' : i === columns - 1 ? '80px' : '80%',
                            animationDelay: `${i * 100}ms`,
                        }}
                    />
                </td>
            ))}
        </tr>
    );
}

export function ChartSkeleton() {
    return (
        <AdminCard className="h-[300px] flex items-end justify-center gap-3 animate-pulse">
            {[40, 65, 50, 80, 60, 75, 45, 70, 55, 85, 50, 65].map((h, i) => (
                <div
                    key={i}
                    className="w-6 bg-zinc-200 dark:bg-zinc-800 rounded-t-md"
                    style={{
                        height: `${h}%`,
                        animationDelay: `${i * 100}ms`,
                    }}
                />
            ))}
        </AdminCard>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="max-w-[1400px] w-full pb-12">
            <div className="mb-8">
                <div className="w-48 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-2 animate-pulse" />
                <div className="w-72 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                    <ChartSkeleton />
                </div>
                <div className="flex flex-col gap-5">
                    <ChartSkeleton />
                </div>
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
    return (
        <AdminCard noPadding>
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i} className="px-4 py-3 text-left">
                                <div className="w-20 h-3 bg-zinc-200 dark:bg-zinc-700 rounded-md animate-pulse" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <TableRowSkeleton key={i} columns={columns} />
                    ))}
                </tbody>
            </table>
        </AdminCard>
    );
}
