'use client';

import { useState, useTransition } from 'react';
import { Search, Store, Loader2, LogIn, ChevronRight, Crown, Zap, Star } from 'lucide-react';
import { getAdminVendors, impersonateVendor } from '@/actions/admin';
import type { AdminVendor, PaginatedResult } from '@/types/admin.types';
import { useToast } from '@/components/ui/Toast';
import AdminVendorDetailModal from './AdminVendorDetailModal';

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    starter: { label: 'Starter', color: '#64748b', bg: '#f1f5f9', icon: Zap },
    growth: { label: 'Growth', color: '#7c3aed', bg: '#ede9fe', icon: Star },
    professional: { label: 'Professional', color: '#d97706', bg: '#fef3c7', icon: Crown },
};

export default function AdminVendorsClient({
    initialData,
}: {
    initialData: PaginatedResult<AdminVendor> | null;
}) {
    const [data, setData] = useState(initialData);
    const [search, setSearch] = useState('');
    const [tier, setTier] = useState('');
    const [page, setPage] = useState(1);
    const [isPending, startTransition] = useTransition();
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
    const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
    const { toast } = useToast();

    const reload = (p = page, s = search, t = tier) => {
        startTransition(async () => {
            const result = await getAdminVendors(p, 20, s || undefined, t || undefined);
            setData(result);
        });
    };

    const handleSearch = () => { setPage(1); reload(1, search, tier); };
    const handleTier = (t: string) => { setTier(t); setPage(1); reload(1, search, t); };
    const handlePage = (p: number) => { setPage(p); reload(p, search, tier); };



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
        <div style={{ maxWidth: '1400px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a' }}>Vendors</h1>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Manage vendor accounts — click any row to view full details</p>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flex: 1, minWidth: '200px' }}>
                    <input
                        placeholder="Search by name…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        style={{
                            flex: 1, padding: '10px 14px', borderRadius: '10px 0 0 10px',
                            border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none',
                        }}
                    />
                    <button
                        onClick={handleSearch}
                        style={{
                            padding: '10px 16px', borderRadius: '0 10px 10px 0',
                            background: '#8b5cf6', color: '#fff', border: 'none',
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                        }}
                    >
                        <Search size={16} />
                    </button>
                </div>
                <select
                    value={tier}
                    onChange={(e) => handleTier(e.target.value)}
                    style={{
                        padding: '10px 14px', borderRadius: '10px',
                        border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none',
                        background: '#fff', cursor: 'pointer',
                    }}
                >
                    <option value="">All Tiers</option>
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="professional">Professional</option>
                </select>
            </div>

            {/* Table */}
            <div
                style={{
                    background: '#fff', borderRadius: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                }}
            >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            {['Vendor', 'Tier', 'Country', 'Events', 'Bookings', 'Actions'].map(h => (
                                <th
                                    key={h}
                                    style={{
                                        padding: '14px 16px', textAlign: 'left', fontSize: '12px',
                                        fontWeight: 600, color: '#64748b', textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {vendors.length === 0 && (
                            <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No vendors found.</td></tr>
                        )}
                        {vendors.map(v => {
                            const tierCfg = TIER_CONFIG[v.subscription_tier || 'starter'] || TIER_CONFIG.starter;
                            return (
                                <tr
                                    key={v.id}
                                    onClick={() => setSelectedVendorId(v.id)}
                                    style={{
                                        borderBottom: '1px solid #f1f5f9',
                                        cursor: 'pointer',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                                >
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '10px',
                                                background: '#f1f5f9', display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
                                            }}>
                                                {v.company_logo ? (
                                                    <img src={v.company_logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <Store size={18} style={{ color: '#94a3b8' }} />
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {v.business_name}
                                                    {v.is_founder_pricing && (
                                                        <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#fef3c7', color: '#92400e', fontWeight: 700 }}>
                                                            FOUNDER
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{v.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                            background: tierCfg.bg, color: tierCfg.color,
                                        }}>
                                            {tierCfg.label}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>
                                        {(v as any).country || '—'}
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569' }}>{v.eventCount}</td>
                                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569' }}>{v.bookingCount}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <button
                                                onClick={(e) => handleLoginAs(e, v.id)}
                                                disabled={impersonatingId === v.id}
                                                title="Login as this vendor"
                                                style={{
                                                    padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                                    background: '#fff', color: '#1e293b', fontSize: '12px',
                                                    fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                                }}
                                            >
                                                {impersonatingId === v.id ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                                            </button>
                                            <ChevronRight size={16} style={{ color: '#cbd5e1' }} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                    {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => handlePage(p)}
                            style={{
                                padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                background: p === page ? '#8b5cf6' : '#fff',
                                color: p === page ? '#fff' : '#475569',
                                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                            }}
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
