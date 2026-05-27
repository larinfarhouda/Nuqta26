'use client';

import { useState, useTransition, useEffect } from 'react';
import { Search, Store, Loader2, LogIn, ChevronRight, Zap, Star, Crown } from 'lucide-react';
import { getAdminVendors, impersonateVendor } from '@/actions/admin';
import type { AdminVendor, PaginatedResult } from '@/types/admin.types';
import { useToast } from '@/components/ui/Toast';
import AdminVendorDetailModal from './AdminVendorDetailModal';

// UI Components
import { AdminCard } from './ui/AdminCard';
import { AdminButton } from './ui/AdminButton';
import { AdminInput } from './ui/AdminInput';
import { AdminBadge } from './ui/AdminBadge';

const TIER_CONFIG: Record<string, { label: string; variant: 'neutral' | 'success' | 'warning' | 'danger' | 'accent'; icon: React.ElementType }> = {
    free: { label: 'Free', variant: 'neutral', icon: Zap },
    starter: { label: 'Free', variant: 'neutral', icon: Zap },
    pro: { label: 'Pro', variant: 'accent', icon: Star },
    growth: { label: 'Pro', variant: 'accent', icon: Star },
    business: { label: 'Business', variant: 'warning', icon: Crown },
    professional: { label: 'Business', variant: 'warning', icon: Crown },
};

export default function AdminVendorsClient({
    initialData,
}: {
    initialData: PaginatedResult<AdminVendor> | null;
}) {
    const [data, setData] = useState(initialData);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [tier, setTier] = useState('');
    const [page, setPage] = useState(1);
    const [isPending, startTransition] = useTransition();
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
    const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
    const { toast } = useToast();

    // Debounce Search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 400);
        return () => clearTimeout(handler);
    }, [search]);

    // Reload when filters change
    useEffect(() => {
        setPage(1);
        reload(1, debouncedSearch, tier);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, tier]);

    const reload = (p = page, s = debouncedSearch, t = tier) => {
        startTransition(async () => {
            const result = await getAdminVendors(p, 20, s || undefined, t || undefined);
            setData(result);
        });
    };

    const handlePage = (p: number) => { 
        setPage(p); 
        reload(p, debouncedSearch, tier); 
    };

    const handleLoginAs = async (e: React.MouseEvent, vendorId: string) => {
        e.stopPropagation();
        setImpersonatingId(vendorId);
        try {
            const result = await impersonateVendor(vendorId);
            if ('success' in result && result.url) {
                window.open(result.url, '_blank');
                toast('success', 'Opened vendor session in new tab');
            } else {
                toast('error', result.error || 'Failed to login as vendor');
            }
        } catch {
            toast('error', 'Failed to login as vendor');
        }
        setImpersonatingId(null);
    };

    const vendors = data?.data || [];

    return (
        <div className="max-w-[1400px] pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Vendors</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Manage vendor accounts, tiers, and approval status</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 min-w-[200px] max-w-md relative">
                    <AdminInput
                        placeholder="Search by vendor name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        icon={<Search size={18} />}
                    />
                    {isPending && search === debouncedSearch && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 size={16} className="animate-spin text-[#2CA58D]" />
                        </div>
                    )}
                </div>
                <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value)}
                    className="h-11 px-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-semibold text-zinc-700 dark:text-zinc-300 outline-none focus:border-[#2CA58D] focus:ring-4 focus:ring-[#2CA58D]/10 transition-all cursor-pointer"
                >
                    <option value="">All Tiers</option>
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="professional">Professional</option>
                </select>
            </div>

            {/* Table */}
            <AdminCard noPadding className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                                {['Vendor', 'Tier', 'Country', 'Events', 'Bookings', 'Actions'].map(h => (
                                    <th key={h} className="px-6 py-4 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                            {vendors.length === 0 && !isPending && (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
                                            <Store size={48} className="mb-4 opacity-20" />
                                            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">No vendors found</p>
                                            <p className="text-sm">Try adjusting your search or filters to find what you're looking for.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {vendors.length === 0 && isPending && (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center">
                                        <div className="flex justify-center text-[#2CA58D]">
                                            <Loader2 size={32} className="animate-spin" />
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {vendors.map(v => {
                                const tierCfg = TIER_CONFIG[v.subscription_tier || 'starter'] || TIER_CONFIG.starter;
                                return (
                                    <tr
                                        key={v.id}
                                        onClick={() => setSelectedVendorId(v.id)}
                                        className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                                                    {v.company_logo ? (
                                                        <img src={v.company_logo} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Store size={20} className="text-zinc-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                                        {v.business_name}
                                                        {v.billing_period === 'annual' && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 font-bold uppercase tracking-wider">
                                                                Annual
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{v.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <AdminBadge variant={tierCfg.variant}>
                                                {tierCfg.label}
                                            </AdminBadge>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                                            {(v as any).country || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">{v.eventCount}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">{v.bookingCount}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => handleLoginAs(e, v.id)}
                                                    disabled={impersonatingId === v.id}
                                                    title="Login as this vendor"
                                                    aria-label="Login as this vendor"
                                                    className="p-2 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-[#2CA58D] hover:text-[#2CA58D] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2CA58D]/20 disabled:opacity-50"
                                                >
                                                    {impersonatingId === v.id ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                                                </button>
                                                <ChevronRight size={20} className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors" />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </AdminCard>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => handlePage(p)}
                            className={`w-10 h-10 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#2CA58D]/20 ${
                                p === page 
                                ? 'bg-[#2CA58D] text-white shadow-md' 
                                : 'bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}

            {/* Vendor Detail Modal */}
            {selectedVendorId && (
                <AdminVendorDetailModal
                    vendorId={selectedVendorId}
                    onClose={() => setSelectedVendorId(null)}
                    onUpdated={() => reload()}
                />
            )}
        </div>
    );
}
