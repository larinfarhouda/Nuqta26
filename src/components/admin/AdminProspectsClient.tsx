'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import {
    UserPlus, Link as LinkIcon, Eye, Plus, Loader2, ExternalLink, Copy, Users, Calendar,
    MessageCircle, Mail, Upload, TrendingUp, Clock, Target, Heart, AlertCircle,
    Store, Edit2, Trash2,
} from 'lucide-react';
import {
    getAdminProspects,
    createProspectVendor,
    contactProspect,
    createProspectEvent,
    getProspectInterests,
    bulkCreateProspects,
    updateProspectVendor,
    deleteProspectVendor,
    scoutInstagramProfile,
} from '@/actions/admin';
import type { ProspectVendor, PaginatedResult, EventInterestSummary } from '@/types/admin.types';
import {
    colors, cardStyle, cardShell, font, inputStyle,
    btnPrimary, badgeStyle, paginationBtn,
    dialogOverlay, dialogPanel,
} from './admin-tokens';

interface ProspectStats {
    total: number;
    byStatus: { prospect: number; contacted: number; converted: number; rejected: number };
    conversionRate: number;
    avgConversionDays: number | null;
    totalInterests: number;
}

const EVENT_TEMPLATES: Record<string, { event_type: string; capacity: number; description: string }> = {
    workshop: { event_type: 'workshop', capacity: 30, description: 'A hands-on workshop experience.' },
    concert: { event_type: 'concert', capacity: 200, description: 'Live music performance event.' },
    exhibition: { event_type: 'exhibition', capacity: 100, description: 'Art and culture exhibition.' },
    conference: { event_type: 'conference', capacity: 150, description: 'Industry conference and networking.' },
    food: { event_type: 'food', capacity: 50, description: 'Food tasting and culinary experience.' },
};

function daysSince(dateStr: string | null): number | null {
    if (!dateStr) return null;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export default function AdminProspectsClient({
    initialData,
    stats,
}: {
    initialData: PaginatedResult<ProspectVendor> | null;
    stats: ProspectStats | null;
}) {
    const [data, setData] = useState(initialData);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [isPending, startTransition] = useTransition();
    const [showCreate, setShowCreate] = useState(false);
    const [showEvent, setShowEvent] = useState<string | null>(null); // prospect ID
    const [showInterests, setShowInterests] = useState<EventInterestSummary[] | null>(null);
    const [claimUrl, setClaimUrl] = useState<string | null>(null);
    const [contactedProspect, setContactedProspect] = useState<ProspectVendor | null>(null);
    const [loading, setLoading] = useState(false);
    const [scouting, setScouting] = useState(false);
    const [extensionActive, setExtensionActive] = useState(false);
    const [scoutingMessage, setScoutingMessage] = useState<string | null>(null);
    const [scoutError, setScoutError] = useState<string | null>(null);
    const [showBulk, setShowBulk] = useState(false);
    const [bulkResult, setBulkResult] = useState<{ created: number; failed: number } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Edit/Delete states
    const [editingProspect, setEditingProspect] = useState<ProspectVendor | null>(null);
    const [deletingProspect, setDeletingProspect] = useState<ProspectVendor | null>(null);

    // Form states
    const [form, setForm] = useState({
        business_name: '', logo_url: '', contact_email: '',
        contact_phone: '', instagram: '', website: '', notes: '',
    });
    const [editForm, setEditForm] = useState({
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

    useEffect(() => {
        let pingInterval: NodeJS.Timeout;

        const checkExtension = () => {
            if (typeof document !== 'undefined') {
                // Primary: check DOM attribute set by the content script (CSP-safe, no isolated world issues)
                const attr = document.documentElement.getAttribute('data-nuqta-scout');
                if (attr === 'active') {
                    setExtensionActive(true);
                    return;
                }
            }
            // Backup: ping content script bridge via postMessage
            if (typeof window !== 'undefined') {
                window.postMessage({ type: 'NUQTA_SCOUT_PING' }, '*');
            }
        };

        // Run detection checks immediately and periodically
        checkExtension();
        pingInterval = setInterval(checkExtension, 800);

        const handleExtensionMessage = (event: MessageEvent) => {
            if (event.source !== window) return;
            const message = event.data;

            // Handle ping response from extension
            if (message && message.type === 'NUQTA_SCOUT_PONG') {
                setExtensionActive(true);
            }

            if (message && message.type === 'NUQTA_SCOUT_RESULT') {
                const res = message.data;
                setScouting(false);
                setScoutingMessage(null);
                if (res.success) {
                    if (showCreate) {
                        setForm(prev => ({
                            ...prev,
                            website: prev.website || res.website || '',
                            logo_url: res.logoUrl || prev.logo_url || '',
                            business_name: res.businessName || prev.business_name || '',
                        }));
                    } else if (editingProspect) {
                        setEditForm(prev => ({
                            ...prev,
                            website: prev.website || res.website || '',
                            logo_url: res.logoUrl || prev.logo_url || '',
                            business_name: res.businessName || prev.business_name || '',
                        }));
                    }
                } else {
                    setScoutError(res.error || 'Scouting failed');
                }
            }
        };

        window.addEventListener('message', handleExtensionMessage);

        const handleWindowFocus = async () => {
            // Also ping on window focus
            checkExtension();

            // Only use clipboard fallback if the automated Chrome extension is not active
            if (extensionActive) return;

            try {
                const text = await navigator.clipboard.readText();
                if (text && (
                    text.includes('cdninstagram.com') || 
                    text.includes('instagram.com') || 
                    text.includes('fbcdn.net')
                ) && text.startsWith('http')) {
                    if (showCreate) {
                        setForm(prev => {
                            if (prev.logo_url === text) return prev;
                            return { ...prev, logo_url: text };
                        });
                    } else if (editingProspect) {
                        setEditForm(prev => {
                            if (prev.logo_url === text) return prev;
                            return { ...prev, logo_url: text };
                        });
                    }
                }
            } catch (e) {
                // Silent catch: Clipboard permission not granted or text doesn't match
            }
        };

        window.addEventListener('focus', handleWindowFocus);

        return () => {
            clearInterval(pingInterval);
            window.removeEventListener('message', handleExtensionMessage);
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, [showCreate, editingProspect, extensionActive]);

    const handleScoutInstagram = async (instagramHandle: string, isEdit: boolean) => {
        const handle = instagramHandle.replace(/^@/, '').trim();
        if (!handle) return;

        setScouting(true);
        setScoutError(null);

        // Check if extension is installed via PING/PONG detection
        const isExtensionPresent = extensionActive;
        if (isExtensionPresent) {
            setExtensionActive(true);
            setScoutingMessage('Automated browser scouting in progress...');
            window.postMessage({
                type: 'NUQTA_SCOUT_START',
                handle: handle
            }, '*');
        } else {
            setExtensionActive(false);
            setScoutingMessage('Standard fallback active. Opening profile...');
            
            // 1. Run the background server scouting to pull the cleaned username / profile link
            try {
                const res = await scoutInstagramProfile(handle);
                if (res) {
                    if (isEdit) {
                        setEditForm(prev => ({
                            ...prev,
                            website: prev.website || res.website || '',
                            business_name: prev.business_name || res.businessName || '',
                        }));
                    } else {
                        setForm(prev => ({
                            ...prev,
                            website: prev.website || res.website || '',
                            business_name: prev.business_name || res.businessName || '',
                        }));
                    }
                }
            } catch (err) {
                console.error('Failed to run fallback server scout:', err);
            } finally {
                setScouting(false);
            }

            // 2. Open the Instagram page in a new tab so the admin can copy the image link
            window.open(`https://instagram.com/${handle}`, '_blank');
        }
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

    const handleEdit = async () => {
        if (!editingProspect || !editForm.business_name) return;
        setLoading(true);
        await updateProspectVendor(editingProspect.id, editForm);
        setEditingProspect(null);
        setLoading(false);
        reload();
    };

    const handleDelete = async () => {
        if (!deletingProspect) return;
        setLoading(true);
        await deleteProspectVendor(deletingProspect.id);
        setDeletingProspect(null);
        setLoading(false);
        reload();
    };

    const handleContact = async (prospect: ProspectVendor) => {
        setLoading(true);
        const result = await contactProspect(prospect.id);
        if (result && 'claimUrl' in result) {
            setClaimUrl(result.claimUrl || null);
            setContactedProspect(prospect);
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

    const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        setBulkResult(null);
        try {
            const text = await file.text();
            const lines = text.split('\n').filter(l => l.trim());
            const header = lines[0].toLowerCase().split(',').map(h => h.trim());
            const rows = lines.slice(1).map(line => {
                const vals = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
                const obj: Record<string, string> = {};
                header.forEach((h, i) => { obj[h] = vals[i] || ''; });
                return {
                    business_name: obj['business_name'] || obj['name'] || obj['business'] || '',
                    contact_email: obj['contact_email'] || obj['email'] || undefined,
                    contact_phone: obj['contact_phone'] || obj['phone'] || undefined,
                    instagram: obj['instagram'] || undefined,
                    website: obj['website'] || undefined,
                    notes: obj['notes'] || undefined,
                };
            }).filter(r => r.business_name);

            if (rows.length === 0) {
                setBulkResult({ created: 0, failed: 0 });
            } else {
                const result = await bulkCreateProspects(rows);
                if ('created' in result) {
                    setBulkResult({ created: result.created!, failed: result.failed! });
                }
            }
            reload();
        } catch {
            setBulkResult({ created: 0, failed: 1 });
        }
        setLoading(false);
        if (fileRef.current) fileRef.current.value = '';
    };

    const applyTemplate = (key: string) => {
        const t = EVENT_TEMPLATES[key];
        if (t) setEventForm(prev => ({ ...prev, ...t }));
    };

    const labelStyle: React.CSSProperties = font.label;

    return (
        <div style={{ maxWidth: '1400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={font.pageTitle}>Prospects</h1>
                    <p style={font.pageSubtitle}>
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

            {/* Stats Dashboard */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    {[
                        { label: 'Total Prospects', value: stats.total, icon: <Target size={18} />, color: '#8b5cf6' },
                        { label: 'Contacted', value: stats.byStatus.contacted, icon: <MessageCircle size={18} />, color: '#3b82f6' },
                        { label: 'Converted', value: stats.byStatus.converted, icon: <TrendingUp size={18} />, color: '#10b981' },
                        { label: 'Conversion Rate', value: `${stats.conversionRate}%`, icon: <Heart size={18} />, color: '#f59e0b' },
                        { label: 'Avg. Days to Convert', value: stats.avgConversionDays ?? '—', icon: <Clock size={18} />, color: '#6366f1' },
                        { label: 'Total Interests', value: stats.totalInterests, icon: <Users size={18} />, color: '#ec4899' },
                    ].map(s => (
                        <div key={s.label} style={{ ...cardStyle, padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
                                <span style={{ color: s.color }}>{s.icon}</span>
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: 800, color: colors.text.primary }}>{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Action Bar: CSV Import + Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['', 'prospect', 'contacted', 'converted'].map(s => (
                        <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setPage(1); reload(1, s); }}
                            style={{
                                padding: '8px 16px', borderRadius: '8px', border: `1px solid ${colors.border}`,
                                background: statusFilter === s ? colors.accent : colors.card,
                                color: statusFilter === s ? '#fff' : colors.text.secondary,
                                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                            }}
                        >
                            {s || 'All'}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="file" ref={fileRef} accept=".csv" onChange={handleCsvImport} style={{ display: 'none' }} />
                    <button
                        onClick={() => fileRef.current?.click()}
                        disabled={loading}
                        style={{
                            padding: '8px 14px', borderRadius: '8px',
                            border: `1px solid ${colors.border}`, background: colors.card,
                            color: colors.text.secondary, fontSize: '12px', fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                        }}
                    >
                        <Upload size={14} /> Import CSV
                    </button>
                </div>
            </div>

            {/* Bulk Import Result */}
            {bulkResult && (
                <div style={{
                    padding: '14px 20px', borderRadius: '10px', marginBottom: '16px',
                    background: bulkResult.failed > 0 ? '#fef9c3' : '#dcfce7',
                    border: `1px solid ${bulkResult.failed > 0 ? '#fde68a' : '#86efac'}`,
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontSize: '13px', fontWeight: 500,
                }}>
                    {bulkResult.failed > 0 ? <AlertCircle size={16} style={{ color: '#854d0e' }} /> : <TrendingUp size={16} style={{ color: '#166534' }} />}
                    <span style={{ color: bulkResult.failed > 0 ? '#854d0e' : '#166534' }}>
                        Imported {bulkResult.created} prospect{bulkResult.created !== 1 ? 's' : ''}{bulkResult.failed > 0 ? `, ${bulkResult.failed} failed` : ''}.
                    </span>
                    <button onClick={() => setBulkResult(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '12px' }}>✕</button>
                </div>
            )}

            {/* Claim URL Banner */}
            {claimUrl && (
                <div
                    style={{
                        background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px',
                        padding: '20px', marginBottom: '20px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
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

                    {/* Outreach Buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {contactedProspect?.contact_phone && (
                            <a
                                href={`https://wa.me/${contactedProspect.contact_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                    `Hi ${contactedProspect.business_name}! 👋\n\nWe listed your business on Nuqta and ${contactedProspect.totalInterests > 0 ? `${contactedProspect.totalInterests} people have already expressed interest` : 'people are already discovering your events'}!\n\nClaim your free page and start managing bookings:\n${claimUrl}\n\n— The Nuqta Team`
                                )}`}
                                target="_blank"
                                style={{
                                    padding: '8px 14px', borderRadius: '8px', border: 'none',
                                    background: '#25D366', color: '#fff', cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    fontWeight: 600, fontSize: '12px', textDecoration: 'none',
                                }}
                            >
                                <MessageCircle size={14} /> WhatsApp
                            </a>
                        )}
                        {contactedProspect?.contact_email && (
                            <a
                                href={`mailto:${contactedProspect.contact_email}?subject=${encodeURIComponent(
                                    `${contactedProspect.business_name} — Your Events Are Already on Nuqta!`
                                )}&body=${encodeURIComponent(
                                    `Hi ${contactedProspect.business_name},\n\nWe've created a page for you on Nuqta — the event booking platform.${contactedProspect.totalInterests > 0 ? ` ${contactedProspect.totalInterests} people have already expressed interest in your events!` : ''}\n\nClaim your free page to start managing bookings and reaching your audience:\n${claimUrl}\n\nWhat you get:\n• Full vendor profile & event management\n• Booking & payment processing\n• Real-time analytics dashboard\n• Free starter plan\n\nBest regards,\nThe Nuqta Team`
                                )}`}
                                style={{
                                    padding: '8px 14px', borderRadius: '8px', border: 'none',
                                    background: '#3b82f6', color: '#fff', cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    fontWeight: 600, fontSize: '12px', textDecoration: 'none',
                                }}
                            >
                                <Mail size={14} /> Email
                            </a>
                        )}
                        <button
                            onClick={() => { setClaimUrl(null); setContactedProspect(null); }}
                            style={{
                                padding: '8px 14px', borderRadius: '8px',
                                border: '1px solid #e2e8f0', background: '#fff',
                                color: '#64748b', cursor: 'pointer',
                                fontSize: '12px', fontWeight: 500,
                            }}
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* Create Prospect Modal */}
            {showCreate && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    onClick={() => setShowCreate(false)}
                >
                    <div onClick={(e) => e.stopPropagation()}
                        style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '480px', width: '100%', maxHeight: '80vh', overflow: 'auto' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: '#0f172a' }}>New Prospect Vendor</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={labelStyle}>Business Name *</label>
                                <input placeholder="e.g. Café Istanbul" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Logo URL</label>
                                <input placeholder="https://..." value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Email</label>
                                <input placeholder="vendor@example.com" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Phone</label>
                                <input placeholder="+90 5XX XXX XX XX" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Instagram</label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <input placeholder="@handle" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                                    {form.instagram && (
                                        <button
                                            type="button"
                                            disabled={scouting}
                                            onClick={() => handleScoutInstagram(form.instagram, false)}
                                            style={{
                                                padding: '8px 12px', borderRadius: '8px', border: 'none',
                                                background: scouting ? '#cbd5e1' : 'linear-gradient(135deg, #E1306C, #F77737)',
                                                color: '#fff', fontSize: '11px', fontWeight: 700,
                                                cursor: scouting ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                opacity: scouting ? 0.7 : 1,
                                            }}
                                        >
                                            {scouting ? (
                                                <>
                                                    <Loader2 size={12} className="animate-spin" /> Scouting...
                                                </>
                                            ) : (
                                                <>
                                                    <ExternalLink size={12} /> Scout
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {scoutingMessage && (
                                    <div style={{ fontSize: '11px', color: '#6366f1', marginTop: '6px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Loader2 size={12} className="animate-spin" /> {scoutingMessage}
                                    </div>
                                )}
                                {scoutError && (
                                    <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px', fontWeight: 500 }}>
                                        ⚠️ {scoutError}
                                    </div>
                                )}

                                {extensionActive ? (
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        color: '#10b981',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        marginTop: '6px'
                                    }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                                        1-Click Auto Scout Active
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        background: 'rgba(139, 92, 246, 0.05)',
                                        border: '1px solid rgba(139, 92, 246, 0.2)',
                                        color: '#7c3aed',
                                        fontSize: '11px',
                                        marginTop: '6px'
                                    }}>
                                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Store size={12} /> Standard Fallback Active
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: '10px', lineHeight: '1.4' }}>
                                            To enable 1-Click scouting, load the unpacked extension in chrome://extensions. Otherwise, click Scout, copy the profile pic address, and come back.
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label style={labelStyle}>Website</label>
                                <input placeholder="https://..." value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Notes</label>
                                <textarea placeholder="Any additional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                            <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>Cancel</button>
                            <button onClick={handleCreate} disabled={loading || !form.business_name} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#8b5cf6', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Prospect Modal */}
            {editingProspect && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    onClick={() => setEditingProspect(null)}
                >
                    <div onClick={(e) => e.stopPropagation()}
                        style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '480px', width: '100%', maxHeight: '80vh', overflow: 'auto' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: '#0f172a' }}>Edit Prospect Vendor</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={labelStyle}>Business Name *</label>
                                <input placeholder="e.g. Café Istanbul" value={editForm.business_name} onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Logo URL</label>
                                <input placeholder="https://..." value={editForm.logo_url} onChange={(e) => setEditForm({ ...editForm, logo_url: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Email</label>
                                <input placeholder="vendor@example.com" value={editForm.contact_email} onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Phone</label>
                                <input placeholder="+90 5XX XXX XX XX" value={editForm.contact_phone} onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Instagram</label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <input placeholder="@handle" value={editForm.instagram} onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                                    {editForm.instagram && (
                                        <button
                                            type="button"
                                            disabled={scouting}
                                            onClick={() => handleScoutInstagram(editForm.instagram, true)}
                                            style={{
                                                padding: '8px 12px', borderRadius: '8px', border: 'none',
                                                background: scouting ? '#cbd5e1' : 'linear-gradient(135deg, #E1306C, #F77737)',
                                                color: '#fff', fontSize: '11px', fontWeight: 700,
                                                cursor: scouting ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                opacity: scouting ? 0.7 : 1,
                                            }}
                                        >
                                            {scouting ? (
                                                <>
                                                    <Loader2 size={12} className="animate-spin" /> Scouting...
                                                </>
                                            ) : (
                                                <>
                                                    <ExternalLink size={12} /> Scout
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {scoutingMessage && (
                                    <div style={{ fontSize: '11px', color: '#6366f1', marginTop: '6px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Loader2 size={12} className="animate-spin" /> {scoutingMessage}
                                    </div>
                                )}
                                {scoutError && (
                                    <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px', fontWeight: 500 }}>
                                        ⚠️ {scoutError}
                                    </div>
                                )}

                                {extensionActive ? (
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        color: '#10b981',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        marginTop: '6px'
                                    }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                                        1-Click Auto Scout Active
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        background: 'rgba(139, 92, 246, 0.05)',
                                        border: '1px solid rgba(139, 92, 246, 0.2)',
                                        color: '#7c3aed',
                                        fontSize: '11px',
                                        marginTop: '6px'
                                    }}>
                                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Store size={12} /> Standard Fallback Active
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: '10px', lineHeight: '1.4' }}>
                                            To enable 1-Click scouting, load the unpacked extension in chrome://extensions. Otherwise, click Scout, copy the profile pic address, and come back.
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label style={labelStyle}>Website</label>
                                <input placeholder="https://..." value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Notes</label>
                                <textarea placeholder="Any additional notes..." value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                            <button onClick={() => setEditingProspect(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>Cancel</button>
                            <button onClick={handleEdit} disabled={loading || !editForm.business_name} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#8b5cf6', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Prospect Modal */}
            {deletingProspect && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    onClick={() => setDeletingProspect(null)}
                >
                    <div onClick={(e) => e.stopPropagation()}
                        style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '440px', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#dc2626' }}>
                            <AlertCircle size={24} />
                            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Delete Prospect Vendor?</h3>
                        </div>
                        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
                            Are you sure you want to permanently delete <strong>{deletingProspect.business_name}</strong>?
                            <br /><br />
                            <span style={{ color: '#b45309', fontWeight: 500 }}>
                                Note: Any associated phantom events will be safely disconnected (not deleted), but this prospect listing and all its logs will be permanently removed.
                            </span>
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setDeletingProspect(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>Cancel</button>
                            <button onClick={handleDelete} disabled={loading} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Delete Prospect'}
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
                        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: '#0f172a' }}>Create Phantom Event</h3>
                        {/* Event Templates */}
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Quick Templates</div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {Object.keys(EVENT_TEMPLATES).map(k => (
                                    <button
                                        key={k}
                                        onClick={() => applyTemplate(k)}
                                        style={{ padding: '5px 12px', borderRadius: '6px', border: `1px solid ${colors.border}`, background: eventForm.event_type === k ? '#ede9fe' : '#f8fafc', color: eventForm.event_type === k ? '#7c3aed' : '#64748b', fontSize: '11px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}
                                    >
                                        {k}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={labelStyle}>Event Title *</label>
                                <input placeholder="e.g. Art Night" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Description</label>
                                <textarea placeholder="Describe the event..." value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Start Date *</label>
                                    <input type="datetime-local" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>End Date</label>
                                    <input type="datetime-local" value={eventForm.end_date} onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })} style={inputStyle} />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Location Name</label>
                                <input placeholder="e.g. Grand Hall" value={eventForm.location_name} onChange={(e) => setEventForm({ ...eventForm, location_name: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>City</label>
                                    <input placeholder="Istanbul" value={eventForm.city} onChange={(e) => setEventForm({ ...eventForm, city: e.target.value })} style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Country</label>
                                    <input placeholder="Turkey" value={eventForm.country} onChange={(e) => setEventForm({ ...eventForm, country: e.target.value })} style={inputStyle} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Event Type</label>
                                    <input placeholder="e.g. Workshop" value={eventForm.event_type} onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })} style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Capacity</label>
                                    <input type="number" placeholder="50" value={eventForm.capacity} onChange={(e) => setEventForm({ ...eventForm, capacity: parseInt(e.target.value) || 0 })} style={inputStyle} />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Image URL</label>
                                <input placeholder="https://..." value={eventForm.image_url} onChange={(e) => setEventForm({ ...eventForm, image_url: e.target.value })} style={inputStyle} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                            <button onClick={() => setShowEvent(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>Cancel</button>
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
                            {['Business', 'Status', 'Events', 'Interests', 'Contact', 'Follow-up', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {(data?.data || []).length === 0 && (
                            <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No prospects yet. Create your first one!</td></tr>
                        )}
                        {(data?.data || []).map(p => {
                            const days = daysSince(p.status === 'contacted' ? (p.updated_at || p.created_at) : null);
                            const stale = days !== null && days >= 7;
                            return (
                            <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: stale ? '#fffbeb' : undefined }}>
                                <td style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {p.logo_url ? (
                                            <img
                                                src={p.logo_url}
                                                alt={`${p.business_name} logo`}
                                                style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                    border: '1px solid #e2e8f0',
                                                    flexShrink: 0,
                                                }}
                                                onError={(e) => {
                                                    // Fallback if image fails to load
                                                    (e.target as HTMLElement).style.display = 'none';
                                                    const parent = (e.target as HTMLElement).parentElement;
                                                    if (parent) {
                                                        const fallback = parent.querySelector('.logo-fallback');
                                                        if (fallback) fallback.setAttribute('style', 'display: flex; width: 36px; height: 36px; border-radius: 50%; background: #ede9fe; color: #7c3aed; align-items: center; justify-content: center; flex-shrink: 0;');
                                                    }
                                                }}
                                            />
                                        ) : null}
                                        {(!p.logo_url) ? (
                                            <div
                                                style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '50%',
                                                    background: '#ede9fe',
                                                    color: '#7c3aed',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Store size={18} />
                                            </div>
                                        ) : (
                                            <div
                                                className="logo-fallback"
                                                style={{
                                                    display: 'none',
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '50%',
                                                    background: '#ede9fe',
                                                    color: '#7c3aed',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Store size={18} />
                                            </div>
                                        )}
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{p.business_name}</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{p.instagram || p.contact_email || '—'}</div>
                                        </div>
                                    </div>
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
                                <td style={{ padding: '14px 16px', fontSize: '12px' }}>
                                    {p.status === 'contacted' && days !== null ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: stale ? '#dc2626' : '#64748b', fontWeight: stale ? 600 : 400 }}>
                                            <Clock size={12} /> {days}d ago{stale ? ' ⚠️' : ''}
                                        </span>
                                    ) : p.status === 'converted' ? (
                                        <span style={{ color: '#10b981', fontWeight: 500 }}>✓ Done</span>
                                    ) : (
                                        <span style={{ color: '#cbd5e1' }}>—</span>
                                    )}
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                                        {p.status !== 'converted' && !p.claim_token && (
                                            <button
                                                onClick={() => handleContact(p)}
                                                disabled={loading}
                                                style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: '#dbeafe', color: '#1e40af', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                            >
                                                Contact
                                            </button>
                                        )}
                                        {p.status === 'contacted' && p.contact_phone && (
                                            <a
                                                href={`https://wa.me/${p.contact_phone.replace(/[^0-9]/g, '')}`}
                                                target="_blank"
                                                style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: '#25D366', color: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                            >
                                                <MessageCircle size={10} /> WA
                                            </a>
                                        )}
                                        <button
                                            onClick={() => {
                                                setEditingProspect(p);
                                                setEditForm({
                                                    business_name: p.business_name || '',
                                                    logo_url: p.logo_url || '',
                                                    contact_email: p.contact_email || '',
                                                    contact_phone: p.contact_phone || '',
                                                    instagram: p.instagram || '',
                                                    website: p.website || '',
                                                    notes: p.notes || '',
                                                });
                                            }}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '5px 8px', borderRadius: '6px', border: 'none', background: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            <Edit2 size={11} /> Edit
                                        </button>
                                        <button
                                            onClick={() => setDeletingProspect(p)}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '5px 8px', borderRadius: '6px', border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            <Trash2 size={11} /> Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );})}

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
