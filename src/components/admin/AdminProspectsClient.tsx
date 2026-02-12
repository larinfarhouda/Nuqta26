'use client';

import { useState, useTransition } from 'react';
import {
    UserPlus, Link as LinkIcon, Eye, Plus, Loader2, ExternalLink, Copy, Users, Calendar,
} from 'lucide-react';
import {
    getAdminProspects,
    createProspectVendor,
    contactProspect,
    createProspectEvent,
    getProspectInterests,
} from '@/actions/admin';
import type { ProspectVendor, PaginatedResult, EventInterestSummary } from '@/types/admin.types';

export default function AdminProspectsClient({
    initialData,
}: {
    initialData: PaginatedResult<ProspectVendor> | null;
}) {
    const [data, setData] = useState(initialData);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [isPending, startTransition] = useTransition();
    const [showCreate, setShowCreate] = useState(false);
    const [showEvent, setShowEvent] = useState<string | null>(null); // prospect ID
    const [showInterests, setShowInterests] = useState<EventInterestSummary[] | null>(null);
    const [claimUrl, setClaimUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Form states
    const [form, setForm] = useState({
        business_name: '', logo_url: '', contact_email: '',
        contact_phone: '', instagram: '', website: '', notes: '',
    });
    const [eventForm, setEventForm] = useState({
        title: '', description: '', date: '', end_date: '',
        location_name: '', city: '', country: 'Turkey',
        event_type: '', capacity: 50, image_url: '',
    });

    const reload = (p = page, s = statusFilter) => {
        startTransition(async () => {
            const result = await getAdminProspects(p, 20, s || undefined);
            setData(result);
        });
    };

    const handleCreate = async () => {
        if (!form.business_name) return;
        setLoading(true);
        await createProspectVendor(form);
        setForm({ business_name: '', logo_url: '', contact_email: '', contact_phone: '', instagram: '', website: '', notes: '' });
        setShowCreate(false);
        setLoading(false);
        reload();
    };

    const handleContact = async (prospectId: string) => {
        setLoading(true);
        const result = await contactProspect(prospectId);
        if (result && 'claimUrl' in result) {
            setClaimUrl(result.claimUrl || null);
        }
        setLoading(false);
        reload();
    };

    const handleCreateEvent = async () => {
        if (!showEvent || !eventForm.title || !eventForm.date) return;
        setLoading(true);
        await createProspectEvent({
            prospect_vendor_id: showEvent,
            title: eventForm.title,
            description: eventForm.description || undefined,
            date: eventForm.date,
            end_date: eventForm.end_date || undefined,
            location_name: eventForm.location_name || undefined,
            city: eventForm.city || undefined,
            country: eventForm.country || undefined,
            event_type: eventForm.event_type || undefined,
            capacity: eventForm.capacity || undefined,
            image_url: eventForm.image_url || undefined,
        });
        setEventForm({ title: '', description: '', date: '', end_date: '', location_name: '', city: '', country: 'Turkey', event_type: '', capacity: 50, image_url: '' });
        setShowEvent(null);
        setLoading(false);
        reload();
    };

    const viewInterests = async (prospectId: string) => {
        setLoading(true);
        const result = await getProspectInterests(prospectId);
        setShowInterests(result);
        setLoading(false);
    };

    const prospects = data?.data || [];

    const inputStyle = {
        width: '100%', padding: '10px 14px', borderRadius: '10px',
        border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none',
    };

    return (
        <div style={{ maxWidth: '1400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a' }}>Prospects</h1>
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                        Phantom Listings — Vendor acquisition engine
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    style={{
                        padding: '10px 20px', borderRadius: '10px',
                        background: '#8b5cf6', color: '#fff', border: 'none',
                        cursor: 'pointer', fontWeight: 600, fontSize: '14px',
                        display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                >
                    <Plus size={16} /> Add Prospect
                </button>
            </div>

            {/* Claim URL Banner */}
            {claimUrl && (
                <div
                    style={{
                        background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px',
                        padding: '16px 20px', marginBottom: '20px', display: 'flex',
                        alignItems: 'center', justifyContent: 'space-between',
                    }}
                >
                    <div>
                        <div style={{ fontWeight: 600, color: '#166534', marginBottom: '4px' }}>Claim Link Generated!</div>
                        <div style={{ fontSize: '13px', color: '#15803d', wordBreak: 'break-all' }}>{claimUrl}</div>
                    </div>
                    <button
                        onClick={() => { navigator.clipboard.writeText(claimUrl); }}
                        style={{
                            padding: '8px 12px', borderRadius: '8px', border: 'none',
                            background: '#dcfce7', color: '#166534', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '12px',
                        }}
                    >
                        <Copy size={12} /> Copy
                    </button>
                </div>
            )}

            {/* Status Filter */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {['', 'new', 'contacted', 'converted'].map(s => (
                    <button
                        key={s}
                        onClick={() => { setStatusFilter(s); setPage(1); reload(1, s); }}
                        style={{
                            padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
                            background: statusFilter === s ? '#8b5cf6' : '#fff',
                            color: statusFilter === s ? '#fff' : '#475569',
                            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        {s || 'All'}
                    </button>
                ))}
            </div>

            {/* Create Prospect Modal */}
            {showCreate && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    onClick={() => setShowCreate(false)}
                >
                    <div onClick={(e) => e.stopPropagation()}
                        style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '480px', width: '100%', maxHeight: '80vh', overflow: 'auto' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>New Prospect Vendor</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input placeholder="Business Name *" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} style={inputStyle} />
                            <input placeholder="Logo URL" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} style={inputStyle} />
                            <input placeholder="Email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} style={inputStyle} />
                            <input placeholder="Phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} style={inputStyle} />
                            <input placeholder="Instagram" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} style={inputStyle} />
                            <input placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} style={inputStyle} />
                            <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                            <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>Cancel</button>
                            <button onClick={handleCreate} disabled={loading || !form.business_name} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#8b5cf6', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Event Modal */}
            {showEvent && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    onClick={() => setShowEvent(null)}
                >
                    <div onClick={(e) => e.stopPropagation()}
                        style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '520px', width: '100%', maxHeight: '80vh', overflow: 'auto' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Create Phantom Event</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input placeholder="Event Title *" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} style={inputStyle} />
                            <textarea placeholder="Description" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="datetime-local" placeholder="Start Date *" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                                <input type="datetime-local" placeholder="End Date" value={eventForm.end_date} onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                            </div>
                            <input placeholder="Location Name" value={eventForm.location_name} onChange={(e) => setEventForm({ ...eventForm, location_name: e.target.value })} style={inputStyle} />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input placeholder="City" value={eventForm.city} onChange={(e) => setEventForm({ ...eventForm, city: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                                <input placeholder="Country" value={eventForm.country} onChange={(e) => setEventForm({ ...eventForm, country: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input placeholder="Event Type" value={eventForm.event_type} onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                                <input type="number" placeholder="Capacity" value={eventForm.capacity} onChange={(e) => setEventForm({ ...eventForm, capacity: parseInt(e.target.value) || 0 })} style={{ ...inputStyle, flex: 1 }} />
                            </div>
                            <input placeholder="Image URL" value={eventForm.image_url} onChange={(e) => setEventForm({ ...eventForm, image_url: e.target.value })} style={inputStyle} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                            <button onClick={() => setShowEvent(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>Cancel</button>
                            <button onClick={handleCreateEvent} disabled={loading || !eventForm.title || !eventForm.date} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#8b5cf6', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Create Event'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Interests Modal */}
            {showInterests && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    onClick={() => setShowInterests(null)}>
                    <div onClick={(e) => e.stopPropagation()}
                        style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '520px', width: '100%', maxHeight: '80vh', overflow: 'auto' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Interested Users</h3>
                        {showInterests.map(ei => (
                            <div key={ei.eventId} style={{ marginBottom: '16px' }}>
                                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#0f172a' }}>
                                    {ei.eventTitle} ({ei.interestCount} interested)
                                </div>
                                {ei.interestedUsers.length === 0 ? (
                                    <div style={{ color: '#94a3b8', fontSize: '13px' }}>No interests yet.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {ei.interestedUsers.map((u, i) => (
                                            <div key={i} style={{ padding: '8px 12px', borderRadius: '8px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                <span style={{ fontWeight: 500, color: '#0f172a' }}>{u.fullName || '—'}</span>
                                                <span style={{ color: '#94a3b8' }}>{u.email}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <button onClick={() => setShowInterests(null)} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#f1f5f9', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px', marginTop: '12px' }}>Close</button>
                    </div>
                </div>
            )}

            {/* Prospects Table */}
            <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            {['Business', 'Status', 'Events', 'Interests', 'Contact', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {prospects.length === 0 && (
                            <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No prospects yet. Create your first one!</td></tr>
                        )}
                        {prospects.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '14px 16px' }}>
                                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{p.business_name}</div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{p.instagram || p.contact_email || '—'}</div>
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                        background: p.status === 'converted' ? '#dcfce7' : p.status === 'contacted' ? '#dbeafe' : '#fef9c3',
                                        color: p.status === 'converted' ? '#166534' : p.status === 'contacted' ? '#1e40af' : '#854d0e',
                                    }}>
                                        {p.status}
                                    </span>
                                </td>
                                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={14} /> {p.eventCount}
                                    </span>
                                </td>
                                <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: p.totalInterests > 0 ? '#8b5cf6' : '#94a3b8', fontWeight: p.totalInterests > 0 ? 600 : 400 }}>
                                        <Users size={14} /> {p.totalInterests}
                                    </span>
                                </td>
                                <td style={{ padding: '14px 16px', fontSize: '12px', color: '#94a3b8' }}>
                                    {p.contact_phone || p.contact_email || '—'}
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => setShowEvent(p.id)}
                                            style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: '#ede9fe', color: '#6d28d9', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            + Event
                                        </button>
                                        <button
                                            onClick={() => viewInterests(p.id)}
                                            style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            View
                                        </button>
                                        {p.status === 'new' && (
                                            <button
                                                onClick={() => handleContact(p.id)}
                                                disabled={loading}
                                                style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: '#dbeafe', color: '#1e40af', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                            >
                                                Contact
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
                            onClick={() => { setPage(p); reload(p, statusFilter); }}
                            style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: p === page ? '#8b5cf6' : '#fff', color: p === page ? '#fff' : '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
