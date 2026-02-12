'use client';

import { useState, useTransition } from 'react';
import { Search, Check, XCircle, Store, Calendar, ShoppingCart, Loader2 } from 'lucide-react';
import { getAdminVendors, approveVendor, suspendVendor } from '@/actions/admin';
import type { AdminVendor, PaginatedResult } from '@/types/admin.types';
import { useToast } from '@/components/ui/Toast';

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
    const [actionId, setActionId] = useState<string | null>(null);
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

    const handleApprove = async (vendorId: string) => {
        if (!confirm('Approve this vendor?')) return;
        setActionId(vendorId);
        try {
            await approveVendor(vendorId);
            toast('success', 'Vendor approved successfully');
        } catch {
            toast('error', 'Failed to approve vendor');
        }
        setActionId(null);
        reload();
    };

    const handleSuspend = async (vendorId: string) => {
        if (!confirm('Suspend this vendor?')) return;
        setActionId(vendorId);
        try {
            await suspendVendor(vendorId);
            toast('success', 'Vendor suspended');
        } catch {
            toast('error', 'Failed to suspend vendor');
        }
        setActionId(null);
        reload();
    };

    const vendors = data?.data || [];

    return (
        <div style={{ maxWidth: '1400px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a' }}>Vendors</h1>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Manage vendor accounts</p>
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
                            {['Vendor', 'Tier', 'Events', 'Bookings', 'Status', 'Actions'].map(h => (
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
                        {vendors.map(v => (
                            <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
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
                                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{v.business_name}</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{v.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                        background: v.subscription_tier === 'professional' ? '#fef3c7' : v.subscription_tier === 'growth' ? '#ede9fe' : '#f1f5f9',
                                        color: v.subscription_tier === 'professional' ? '#92400e' : v.subscription_tier === 'growth' ? '#6d28d9' : '#475569',
                                    }}>
                                        {v.subscription_tier || 'starter'}
                                    </span>
                                </td>
                                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569' }}>{v.eventCount}</td>
                                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569' }}>{v.bookingCount}</td>
                                <td style={{ padding: '14px 16px' }}>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                        background: v.status === 'approved' || v.is_verified ? '#dcfce7' : v.status === 'suspended' ? '#fecaca' : '#fef9c3',
                                        color: v.status === 'approved' || v.is_verified ? '#166534' : v.status === 'suspended' ? '#991b1b' : '#854d0e',
                                    }}>
                                        {v.status === 'approved' || v.is_verified ? 'Approved' : v.status === 'suspended' ? 'Suspended' : 'Pending'}
                                    </span>
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {v.status !== 'approved' && !v.is_verified && (
                                            <button
                                                onClick={() => handleApprove(v.id)}
                                                disabled={actionId === v.id}
                                                style={{
                                                    padding: '6px 12px', borderRadius: '8px', border: 'none',
                                                    background: '#dcfce7', color: '#166534', fontSize: '12px',
                                                    fontWeight: 600, cursor: 'pointer',
                                                }}
                                            >
                                                {actionId === v.id ? <Loader2 size={14} className="animate-spin" /> : 'Approve'}
                                            </button>
                                        )}
                                        {v.status !== 'suspended' && (
                                            <button
                                                onClick={() => handleSuspend(v.id)}
                                                disabled={actionId === v.id}
                                                style={{
                                                    padding: '6px 12px', borderRadius: '8px', border: 'none',
                                                    background: '#fecaca', color: '#991b1b', fontSize: '12px',
                                                    fontWeight: 600, cursor: 'pointer',
                                                }}
                                            >
                                                Suspend
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
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
        </div>
    );
}
