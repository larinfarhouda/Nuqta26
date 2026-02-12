'use client';

import { useState, useTransition } from 'react';
import { Eye, Check, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { getAdminBankTransfers, confirmBankPayment, rejectBankPayment } from '@/actions/admin';
import type { BankTransferBooking, PaginatedResult } from '@/types/admin.types';
import { useToast } from '@/components/ui/Toast';

export default function AdminBookingsClient({
    initialData,
}: {
    initialData: PaginatedResult<BankTransferBooking> | null;
}) {
    const [data, setData] = useState(initialData);
    const [page, setPage] = useState(1);
    const [isPending, startTransition] = useTransition();
    const [actionId, setActionId] = useState<string | null>(null);
    const [proofUrl, setProofUrl] = useState<string | null>(null);
    const { toast } = useToast();

    const reload = (p = page) => {
        startTransition(async () => {
            const result = await getAdminBankTransfers(p, 20);
            setData(result);
        });
    };

    const handleConfirm = async (bookingId: string) => {
        if (!confirm('Confirm this payment?')) return;
        setActionId(bookingId);
        try {
            await confirmBankPayment(bookingId);
            toast('success', 'Payment confirmed');
        } catch {
            toast('error', 'Failed to confirm payment');
        }
        setActionId(null);
        reload();
    };

    const handleReject = async (bookingId: string) => {
        if (!confirm('Reject this payment? Status will revert to pending.')) return;
        setActionId(bookingId);
        try {
            await rejectBankPayment(bookingId);
            toast('success', 'Payment rejected');
        } catch {
            toast('error', 'Failed to reject payment');
        }
        setActionId(null);
        reload();
    };

    const bookings = data?.data || [];

    return (
        <div style={{ maxWidth: '1400px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a' }}>Bookings</h1>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                    Bank transfer payment queue
                </p>
            </div>

            {/* Payment Proof Modal */}
            {proofUrl && (
                <div
                    onClick={() => setProofUrl(null)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 50, padding: '20px',
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#fff', borderRadius: '16px', padding: '24px',
                            maxWidth: '600px', width: '100%', maxHeight: '80vh', overflow: 'auto',
                        }}
                    >
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Payment Proof</h3>
                        <img src={proofUrl} alt="Payment proof" style={{ width: '100%', borderRadius: '8px' }} />
                        <button
                            onClick={() => setProofUrl(null)}
                            style={{
                                marginTop: '16px', padding: '10px 20px', borderRadius: '10px',
                                background: '#f1f5f9', border: 'none', cursor: 'pointer',
                                fontWeight: 600, fontSize: '14px', width: '100%',
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

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
                            {['Event', 'Customer', 'Amount', 'Status', 'Proof', 'Actions'].map(h => (
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
                        {bookings.length === 0 && (
                            <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No pending bank transfers.</td></tr>
                        )}
                        {bookings.map(b => (
                            <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '14px 16px' }}>
                                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{(b.events as any)?.title || '—'}</div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{(b.vendors as any)?.business_name || '—'}</div>
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                    <div style={{ fontSize: '14px', color: '#0f172a' }}>{b.contact_name || (b.profiles as any)?.full_name || '—'}</div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{b.contact_email || (b.profiles as any)?.email || '—'}</div>
                                </td>
                                <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                                    ₺{(b.total_amount || 0).toLocaleString()}
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                        background: b.status === 'payment_submitted' ? '#dbeafe' : '#fef9c3',
                                        color: b.status === 'payment_submitted' ? '#1e40af' : '#854d0e',
                                    }}>
                                        {b.status === 'payment_submitted' ? 'Submitted' : 'Pending'}
                                    </span>
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                    {b.payment_proof_url ? (
                                        <button
                                            onClick={() => setProofUrl(b.payment_proof_url!)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                background: 'none', border: 'none', color: '#8b5cf6',
                                                cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                                            }}
                                        >
                                            <ImageIcon size={14} /> View
                                        </button>
                                    ) : (
                                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>None</span>
                                    )}
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {b.status === 'payment_submitted' && (
                                            <>
                                                <button
                                                    onClick={() => handleConfirm(b.id)}
                                                    disabled={actionId === b.id}
                                                    style={{
                                                        padding: '6px 12px', borderRadius: '8px', border: 'none',
                                                        background: '#dcfce7', color: '#166534', fontSize: '12px',
                                                        fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                                    }}
                                                >
                                                    {actionId === b.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={() => handleReject(b.id)}
                                                    disabled={actionId === b.id}
                                                    style={{
                                                        padding: '6px 12px', borderRadius: '8px', border: 'none',
                                                        background: '#fecaca', color: '#991b1b', fontSize: '12px',
                                                        fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                                    }}
                                                >
                                                    <X size={12} /> Reject
                                                </button>
                                            </>
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
                            onClick={() => { setPage(p); reload(p); }}
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
