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
import { AdminCard } from './ui/AdminCard';
import { AdminButton } from './ui/AdminButton';
import { AdminInput } from './ui/AdminInput';
import { AdminBadge } from './ui/AdminBadge';

interface ProspectStats {
    total: number;
    byStatus: { lead: number; building: number; pitched: number; free: number; paying: number; churned: number; lost: number };
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

const STATUS_BADGE_VARIANT: Record<string, 'info' | 'warning' | 'accent' | 'success' | 'danger' | 'neutral'> = {
    lead: 'info',
    building: 'warning',
    pitched: 'accent',
    free: 'success',
    paying: 'warning',
    churned: 'danger',
    lost: 'neutral',
};

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
        bio: '', location: '',
    });
    const [editForm, setEditForm] = useState({
        business_name: '', logo_url: '', contact_email: '',
        contact_phone: '', instagram: '', website: '', notes: '',
        bio: '', location: '',
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

    // Global escape handler for modals
    useEffect(() => {
        if (!showCreate && !editingProspect && !deletingProspect && !showEvent && !showInterests) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowCreate(false);
                setEditingProspect(null);
                setDeletingProspect(null);
                setShowEvent(null);
                setShowInterests(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showCreate, editingProspect, deletingProspect, showEvent, showInterests]);

    const handleScoutInstagram = async (instagramHandle: string, isEdit: boolean) => {
        const handle = instagramHandle.replace(/^@/, '').trim();
        if (!handle) return;

        setScouting(true);
        setScoutError(null);
        setScoutingMessage('Fetching Instagram profile...');

        try {
            const res = await scoutInstagramProfile(handle);
            if (res && 'error' in res && !res.logoUrl) {
                setScoutError(String(res.error));
            } else if (res) {
                const updates: Record<string, string> = {};
                if (res.website) updates.website = res.website;
                if (res.logoUrl) updates.logo_url = res.logoUrl;
                if (res.businessName) updates.business_name = res.businessName;
                if ('bio' in res && res.bio) updates.bio = res.bio as string;
                if ('location' in res && res.location) updates.location = res.location as string;
                if ('contactEmail' in res && res.contactEmail) updates.contact_email = res.contactEmail as string;
                if ('contactPhone' in res && res.contactPhone) updates.contact_phone = res.contactPhone as string;

                if (isEdit) {
                    setEditForm(prev => ({
                        ...prev,
                        website: prev.website || updates.website || prev.website,
                        logo_url: updates.logo_url || prev.logo_url,
                        business_name: prev.business_name || updates.business_name || prev.business_name,
                        bio: prev.bio || updates.bio || prev.bio,
                        location: prev.location || updates.location || prev.location,
                        contact_email: prev.contact_email || updates.contact_email || prev.contact_email,
                        contact_phone: prev.contact_phone || updates.contact_phone || prev.contact_phone,
                    }));
                } else {
                    setForm(prev => ({
                        ...prev,
                        website: prev.website || updates.website || prev.website,
                        logo_url: updates.logo_url || prev.logo_url,
                        business_name: prev.business_name || updates.business_name || prev.business_name,
                        bio: prev.bio || updates.bio || prev.bio,
                        location: prev.location || updates.location || prev.location,
                        contact_email: prev.contact_email || updates.contact_email || prev.contact_email,
                        contact_phone: prev.contact_phone || updates.contact_phone || prev.contact_phone,
                    }));
                }

                // Show rich scouting summary if available
                const parts: string[] = [];
                if ('followers' in res && res.followers) parts.push(`${(res.followers as number).toLocaleString()} followers`);
                if ('businessCategory' in res && res.businessCategory) parts.push(res.businessCategory as string);
                if ('isVerified' in res && res.isVerified) parts.push('✓ Verified');
                if ('isBusinessAccount' in res && res.isBusinessAccount) parts.push('Business');
                if (parts.length > 0) {
                    setScoutingMessage(`✨ ${parts.join(' · ')}`);
                    setTimeout(() => setScoutingMessage(null), 5000);
                }
            }
        } catch (err) {
            console.error('Failed to scout Instagram profile:', err);
            setScoutError('Failed to fetch profile. Try again.');
        } finally {
            setScouting(false);
        }
    };

    const handleCreate = async () => {
        if (!form.business_name) return;
        setLoading(true);
        await createProspectVendor(form);
        setForm({ business_name: '', logo_url: '', contact_email: '', contact_phone: '', instagram: '', website: '', notes: '', bio: '', location: '' });
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

    return (
        <div className="max-w-[1400px] pb-12">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Prospects</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                        Phantom Listings — Vendor acquisition engine
                    </p>
                </div>
                <AdminButton onClick={() => setShowCreate(true)}>
                    <Plus size={16} className="mr-1.5" /> Add Prospect
                </AdminButton>
            </div>

            {/* Stats Dashboard */}
            {stats && (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 mb-5">
                    {[
                        { label: 'Total Prospects', value: stats.total, icon: <Target size={18} />, color: 'text-[#2CA58D]' },
                        { label: 'Pitched', value: stats.byStatus.pitched, icon: <MessageCircle size={18} />, color: 'text-blue-500' },
                        { label: 'Active (Free + Paying)', value: stats.byStatus.free + stats.byStatus.paying, icon: <TrendingUp size={18} />, color: 'text-emerald-500' },
                        { label: 'Conversion Rate', value: `${stats.conversionRate}%`, icon: <Heart size={18} />, color: 'text-amber-500' },
                        { label: 'Avg. Days to Convert', value: stats.avgConversionDays ?? '—', icon: <Clock size={18} />, color: 'text-indigo-500' },
                        { label: 'Total Interests', value: stats.totalInterests, icon: <Users size={18} />, color: 'text-pink-500' },
                    ].map(s => (
                        <AdminCard key={s.label} className="!p-4">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{s.label}</span>
                                <span className={s.color}>{s.icon}</span>
                            </div>
                            <div className="text-[22px] font-extrabold text-zinc-900 dark:text-white">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
                        </AdminCard>
                    ))}
                </div>
            )}

            {/* Action Bar: CSV Import + Filters */}
            <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                <div className="flex gap-2 flex-wrap">
                    {['', 'lead', 'building', 'pitched', 'free', 'paying', 'churned', 'lost'].map(s => (
                        <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setPage(1); reload(1, s); }}
                            className={`px-4 py-2 rounded-xl border text-[13px] font-semibold cursor-pointer transition-all duration-200 ${
                                statusFilter === s
                                    ? 'bg-[#2CA58D] text-white border-[#2CA58D] shadow-md shadow-[#2CA58D]/20'
                                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                        >
                            {s || 'All'}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input type="file" ref={fileRef} accept=".csv" onChange={handleCsvImport} className="hidden" />
                    <AdminButton variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={loading}>
                        <Upload size={14} className="mr-1.5" /> Import CSV
                    </AdminButton>
                </div>
            </div>

            {/* Bulk Import Result */}
            {bulkResult && (
                <div className={`flex items-center gap-2.5 px-5 py-3.5 rounded-xl mb-4 text-[13px] font-medium ${
                    bulkResult.failed > 0
                        ? 'bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-300 dark:border-yellow-500/30'
                        : 'bg-green-50 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30'
                }`}>
                    {bulkResult.failed > 0 ? <AlertCircle size={16} className="text-yellow-700 dark:text-yellow-400" /> : <TrendingUp size={16} className="text-green-700 dark:text-green-400" />}
                    <span className={bulkResult.failed > 0 ? 'text-yellow-700 dark:text-yellow-400' : 'text-green-700 dark:text-green-400'}>
                        Imported {bulkResult.created} prospect{bulkResult.created !== 1 ? 's' : ''}{bulkResult.failed > 0 ? `, ${bulkResult.failed} failed` : ''}.
                    </span>
                    <button aria-label="Dismiss message" onClick={() => setBulkResult(null)} className="ml-auto bg-transparent border-none cursor-pointer text-zinc-400 text-xs hover:text-zinc-600 dark:hover:text-zinc-300">✕</button>
                </div>
            )}

            {/* Claim URL Banner */}
            {claimUrl && (
                <AdminCard className="!bg-green-50 dark:!bg-green-500/10 !border-green-300 dark:!border-green-500/30 mb-5">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <div className="font-semibold text-green-800 dark:text-green-400 mb-1">Claim Link Generated!</div>
                            <div className="text-[13px] text-green-700 dark:text-green-500 break-all">{claimUrl}</div>
                        </div>
                        <button
                            onClick={() => { navigator.clipboard.writeText(claimUrl); }}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-400 text-xs font-semibold hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors border-none cursor-pointer"
                        >
                            <Copy size={12} /> Copy
                        </button>
                    </div>

                    {/* Outreach Buttons */}
                    <div className="flex gap-2 flex-wrap">
                        {contactedProspect?.contact_phone && (
                            <a
                                href={`https://wa.me/${contactedProspect.contact_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                    `Hi ${contactedProspect.business_name}! 👋\n\nWe listed your business on Nuqta and ${contactedProspect.totalInterests > 0 ? `${contactedProspect.totalInterests} people have already expressed interest` : 'people are already discovering your events'}!\n\nClaim your free page and start managing bookings:\n${claimUrl}\n\n— The Nuqta Team`
                                )}`}
                                target="_blank"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#25D366] text-white text-xs font-semibold no-underline hover:bg-[#20bd5a] transition-colors"
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
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-500 text-white text-xs font-semibold no-underline hover:bg-blue-600 transition-colors"
                            >
                                <Mail size={14} /> Email
                            </a>
                        )}
                        <AdminButton variant="outline" size="sm" onClick={() => { setClaimUrl(null); setContactedProspect(null); }}>
                            Dismiss
                        </AdminButton>
                    </div>
                </AdminCard>
            )}

            {/* Create Prospect Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
                    <AdminCard onClick={(e) => e.stopPropagation()} className="w-full max-w-[520px] relative z-10 animate-in fade-in zoom-in-95 duration-200 text-left" style={{ direction: 'ltr' }}>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">New Prospect Vendor</h3>
                        <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-5">Add a new prospect to your sales pipeline</p>

                        {/* Logo preview */}
                        {form.logo_url && form.logo_url.startsWith('https://') && (
                            <div className="flex items-center gap-3 mb-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                <img src={form.logo_url} referrerPolicy="no-referrer" alt="" className="w-12 h-12 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700" />
                                <div>
                                    <div className="font-semibold text-sm text-zinc-900 dark:text-white">{form.business_name || 'Business Name'}</div>
                                    {scoutingMessage && (
                                        <div className="text-xs text-[#2CA58D] mt-0.5">{scoutingMessage}</div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Business Name *</label>
                                <AdminInput placeholder="e.g. Café Istanbul" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} className="text-left" style={{ direction: 'ltr' }} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Instagram</label>
                                <div className="flex gap-1.5">
                                    <AdminInput placeholder="@handle" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className="flex-1 text-left" style={{ direction: 'ltr' }} />
                                    {form.instagram && (
                                        <button
                                            type="button"
                                            disabled={scouting}
                                            onClick={() => handleScoutInstagram(form.instagram, false)}
                                            className={`flex items-center gap-1 px-3.5 py-2 rounded-xl border-none text-white text-xs font-bold whitespace-nowrap transition-all ${
                                                scouting ? 'bg-zinc-300 dark:bg-zinc-600 cursor-not-allowed opacity-70' : 'bg-gradient-to-br from-[#E1306C] to-[#F77737] cursor-pointer hover:opacity-90'
                                            }`}
                                        >
                                            {scouting ? (
                                                <><Loader2 size={12} className="animate-spin" /> Scouting...</>
                                            ) : (
                                                <><ExternalLink size={12} /> Scout</>
                                            )}
                                        </button>
                                    )}
                                </div>
                                {scoutError && (
                                    <div className="text-[11px] text-red-500 mt-1.5 font-medium">
                                        ⚠️ {scoutError}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Email</label>
                                    <AdminInput placeholder="vendor@example.com" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="text-left" style={{ direction: 'ltr' }} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Phone</label>
                                    <AdminInput placeholder="+90 5XX XXX XX XX" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="text-left" style={{ direction: 'ltr' }} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Website</label>
                                <AdminInput placeholder="https://..." value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="text-left" style={{ direction: 'ltr' }} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Bio</label>
                                <textarea
                                    value={form.bio}
                                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                                    placeholder="Vendor bio/description"
                                    rows={3}
                                    className="w-full px-4 py-3 text-sm rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-[#2CA58D] focus:ring-4 focus:ring-[#2CA58D]/10 outline-none transition-all duration-200 min-h-[72px] resize-y text-left"
                                    style={{ direction: 'ltr' }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Location</label>
                                    <AdminInput
                                        value={form.location}
                                        onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                                        placeholder="City / Area"
                                        className="text-left"
                                        style={{ direction: 'ltr' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Logo URL</label>
                                    <AdminInput placeholder="Auto-filled by Scout" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} className="text-left" style={{ direction: 'ltr' }} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Notes</label>
                                <textarea
                                    placeholder="Any additional notes..."
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    className="w-full px-4 py-3 text-sm rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-[#2CA58D] focus:ring-4 focus:ring-[#2CA58D]/10 outline-none transition-all duration-200 min-h-[60px] resize-y text-left"
                                    style={{ direction: 'ltr' }}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-5">
                            <AdminButton onClick={handleCreate} disabled={loading || !form.business_name} isLoading={loading} className="flex-1">
                                Create Prospect
                            </AdminButton>
                            <AdminButton variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancel</AdminButton>
                        </div>
                    </AdminCard>
                </div>
            )}

            {/* Edit Prospect Modal */}
            {editingProspect && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setEditingProspect(null)}>
                    <AdminCard onClick={(e) => e.stopPropagation()} className="w-full max-w-[520px] relative z-10 animate-in fade-in zoom-in-95 duration-200 text-left" style={{ direction: 'ltr' }}>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Edit Prospect Vendor</h3>
                        <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-5">Update prospect information</p>

                        {/* Logo preview */}
                        {editForm.logo_url && editForm.logo_url.startsWith('https://') && (
                            <div className="flex items-center gap-3 mb-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                <img src={editForm.logo_url} referrerPolicy="no-referrer" alt="" className="w-12 h-12 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700" />
                                <div>
                                    <div className="font-semibold text-sm text-zinc-900 dark:text-white">{editForm.business_name || 'Business Name'}</div>
                                    {scoutingMessage && (
                                        <div className="text-xs text-[#2CA58D] mt-0.5">{scoutingMessage}</div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Business Name *</label>
                                <AdminInput placeholder="e.g. Café Istanbul" value={editForm.business_name} onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })} className="text-left" style={{ direction: 'ltr' }} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Instagram</label>
                                <div className="flex gap-1.5">
                                    <AdminInput placeholder="@handle" value={editForm.instagram} onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })} className="flex-1 text-left" style={{ direction: 'ltr' }} />
                                    {editForm.instagram && (
                                        <button
                                            type="button"
                                            disabled={scouting}
                                            onClick={() => handleScoutInstagram(editForm.instagram, true)}
                                            className={`flex items-center gap-1 px-3.5 py-2 rounded-xl border-none text-white text-xs font-bold whitespace-nowrap transition-all ${
                                                scouting ? 'bg-zinc-300 dark:bg-zinc-600 cursor-not-allowed opacity-70' : 'bg-gradient-to-br from-[#E1306C] to-[#F77737] cursor-pointer hover:opacity-90'
                                            }`}
                                        >
                                            {scouting ? (
                                                <><Loader2 size={12} className="animate-spin" /> Scouting...</>
                                            ) : (
                                                <><ExternalLink size={12} /> Scout</>
                                            )}
                                        </button>
                                    )}
                                </div>
                                {scoutError && (
                                    <div className="text-[11px] text-red-500 mt-1.5 font-medium">
                                        ⚠️ {scoutError}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Email</label>
                                    <AdminInput placeholder="vendor@example.com" value={editForm.contact_email} onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })} className="text-left" style={{ direction: 'ltr' }} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Phone</label>
                                    <AdminInput placeholder="+90 5XX XXX XX XX" value={editForm.contact_phone} onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })} className="text-left" style={{ direction: 'ltr' }} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Website</label>
                                <AdminInput placeholder="https://..." value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} className="text-left" style={{ direction: 'ltr' }} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Bio</label>
                                <textarea
                                    value={editForm.bio}
                                    onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                                    placeholder="Vendor bio/description"
                                    rows={3}
                                    className="w-full px-4 py-3 text-sm rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-[#2CA58D] focus:ring-4 focus:ring-[#2CA58D]/10 outline-none transition-all duration-200 min-h-[72px] resize-y text-left"
                                    style={{ direction: 'ltr' }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Location</label>
                                    <AdminInput
                                        value={editForm.location}
                                        onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                                        placeholder="City / Area"
                                        className="text-left"
                                        style={{ direction: 'ltr' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Logo URL</label>
                                    <AdminInput placeholder="Auto-filled by Scout" value={editForm.logo_url} onChange={(e) => setEditForm({ ...editForm, logo_url: e.target.value })} className="text-left" style={{ direction: 'ltr' }} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Notes</label>
                                <textarea
                                    placeholder="Any additional notes..."
                                    value={editForm.notes}
                                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                    className="w-full px-4 py-3 text-sm rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-[#2CA58D] focus:ring-4 focus:ring-[#2CA58D]/10 outline-none transition-all duration-200 min-h-[60px] resize-y text-left"
                                    style={{ direction: 'ltr' }}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-5">
                            <AdminButton onClick={handleEdit} disabled={loading || !editForm.business_name} isLoading={loading} className="flex-1">
                                Save Changes
                            </AdminButton>
                            <AdminButton variant="outline" onClick={() => setEditingProspect(null)} className="flex-1">Cancel</AdminButton>
                        </div>
                    </AdminCard>
                </div>
            )}

            {/* Delete Prospect Modal */}
            {deletingProspect && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm"
                    onClick={() => setDeletingProspect(null)}
                >
                    <AdminCard onClick={(e) => e.stopPropagation()} className="w-full max-w-[440px] relative z-10 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
                            <AlertCircle size={24} />
                            <h3 className="text-lg font-bold m-0">Delete Prospect Vendor?</h3>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed">
                            Are you sure you want to permanently delete <strong className="text-zinc-900 dark:text-white">{deletingProspect.business_name}</strong>?
                            <br /><br />
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                                Note: Any associated phantom events will be safely disconnected (not deleted), but this prospect listing and all its logs will be permanently removed.
                            </span>
                        </p>
                        <div className="flex gap-2">
                            <AdminButton variant="outline" onClick={() => setDeletingProspect(null)} className="flex-1">Cancel</AdminButton>
                            <AdminButton variant="danger" onClick={handleDelete} disabled={loading} isLoading={loading} className="flex-1">
                                Delete Prospect
                            </AdminButton>
                        </div>
                    </AdminCard>
                </div>
            )}

            {/* Create Event Modal */}
            {showEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm"
                    onClick={() => setShowEvent(null)}
                >
                    <AdminCard onClick={(e) => e.stopPropagation()} className="w-full max-w-[520px] relative z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[80vh] overflow-auto">
                        <h3 className="text-lg font-bold mb-5 text-zinc-900 dark:text-white">Create Phantom Event</h3>
                        {/* Event Templates */}
                        <div className="mb-4">
                            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Quick Templates</div>
                            <div className="flex gap-1.5 flex-wrap">
                                {Object.keys(EVENT_TEMPLATES).map(k => (
                                    <button
                                        key={k}
                                        onClick={() => applyTemplate(k)}
                                        className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer capitalize transition-all ${
                                            eventForm.event_type === k
                                                ? 'bg-[#2CA58D]/10 text-[#2CA58D] border-[#2CA58D]/30 dark:bg-[#2CA58D]/20'
                                                : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                        }`}
                                    >
                                        {k}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Event Title *</label>
                                <AdminInput placeholder="e.g. Art Night" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Description</label>
                                <textarea
                                    placeholder="Describe the event..."
                                    value={eventForm.description}
                                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                    className="w-full px-4 py-3 text-sm rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-[#2CA58D] focus:ring-4 focus:ring-[#2CA58D]/10 outline-none transition-all duration-200 min-h-[80px] resize-y"
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Start Date *</label>
                                    <AdminInput type="datetime-local" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">End Date</label>
                                    <AdminInput type="datetime-local" value={eventForm.end_date} onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Location Name</label>
                                <AdminInput placeholder="e.g. Grand Hall" value={eventForm.location_name} onChange={(e) => setEventForm({ ...eventForm, location_name: e.target.value })} />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">City</label>
                                    <AdminInput placeholder="Istanbul" value={eventForm.city} onChange={(e) => setEventForm({ ...eventForm, city: e.target.value })} />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Country</label>
                                    <AdminInput placeholder="Turkey" value={eventForm.country} onChange={(e) => setEventForm({ ...eventForm, country: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Event Type</label>
                                    <AdminInput placeholder="e.g. Workshop" value={eventForm.event_type} onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })} />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Capacity</label>
                                    <AdminInput type="number" placeholder="50" value={eventForm.capacity} onChange={(e) => setEventForm({ ...eventForm, capacity: parseInt(e.target.value) || 0 })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Image URL</label>
                                <AdminInput placeholder="https://..." value={eventForm.image_url} onChange={(e) => setEventForm({ ...eventForm, image_url: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-5">
                            <AdminButton variant="outline" onClick={() => setShowEvent(null)} className="flex-1">Cancel</AdminButton>
                            <AdminButton onClick={handleCreateEvent} disabled={loading || !eventForm.title || !eventForm.date} isLoading={loading} className="flex-1">
                                Create Event
                            </AdminButton>
                        </div>
                    </AdminCard>
                </div>
            )}

            {/* Interests Modal */}
            {showInterests && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm"
                    onClick={() => setShowInterests(null)}>
                    <AdminCard onClick={(e) => e.stopPropagation()} className="w-full max-w-[520px] relative z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[80vh] overflow-auto">
                        <h3 className="text-lg font-bold mb-4 text-zinc-900 dark:text-white">Interested Users</h3>
                        {showInterests.map(ei => (
                            <div key={ei.eventId} className="mb-4">
                                <div className="font-semibold text-sm mb-2 text-zinc-900 dark:text-white">
                                    {ei.eventTitle} ({ei.interestCount} interested)
                                </div>
                                {ei.interestedUsers.length === 0 ? (
                                    <div className="text-zinc-400 text-[13px]">No interests yet.</div>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        {ei.interestedUsers.map((u, i) => (
                                            <div key={i} className="flex justify-between items-center px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-[13px]">
                                                <span className="font-medium text-zinc-900 dark:text-white">{u.fullName || '—'}</span>
                                                <span className="text-zinc-400">{u.email}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <AdminButton variant="ghost" onClick={() => setShowInterests(null)} className="w-full mt-3">Close</AdminButton>
                    </AdminCard>
                </div>
            )}

            {/* Prospects Table */}
            <AdminCard noPadding>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800">
                            {['Business', 'Status', 'Events', 'Interests', 'Contact', 'Claim URL', 'Follow-up', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {(data?.data || []).length === 0 && (
                            <tr><td colSpan={8} className="px-10 py-10 text-center text-zinc-400">No prospects yet. Create your first one!</td></tr>
                        )}
                        {(data?.data || []).map(p => {
                            const days = daysSince(p.status === 'pitched' ? (p.last_contacted_at || p.updated_at || p.created_at) : null);
                            const stale = days !== null && days >= 7;
                            return (
                            <tr key={p.id} className={`border-b border-zinc-100 dark:border-zinc-800/50 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30 ${stale ? 'bg-amber-50/50 dark:bg-amber-500/5' : ''}`}>
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-3">
                                        {p.logo_url ? (
                                            <img
                                                src={p.logo_url}
                                                alt={`${p.business_name} logo`}
                                                referrerPolicy="no-referrer"
                                                className="w-9 h-9 rounded-full object-cover border border-zinc-200 shrink-0"
                                                onError={(e) => {
                                                    // Fallback if image fails to load
                                                    (e.target as HTMLElement).style.display = 'none';
                                                    const parent = (e.target as HTMLElement).parentElement;
                                                    if (parent) {
                                                        const fallback = parent.querySelector('.logo-fallback');
                                                        if (fallback) fallback.setAttribute('style', 'display: flex; width: 36px; height: 36px; border-radius: 50%; background: #d1fae5; color: #059669; align-items: center; justify-content: center; flex-shrink: 0;');
                                                    }
                                                }}
                                            />
                                        ) : null}
                                        {(!p.logo_url) ? (
                                            <div className="w-9 h-9 rounded-full bg-[#2CA58D]/10 text-[#2CA58D] flex items-center justify-center shrink-0">
                                                <Store size={18} />
                                            </div>
                                        ) : (
                                            <div
                                                className="logo-fallback hidden w-9 h-9 rounded-full bg-[#2CA58D]/10 text-[#2CA58D] items-center justify-center shrink-0"
                                            >
                                                <Store size={18} />
                                            </div>
                                        )}
                                        {p.instagram && (
                                            <a href={`https://instagram.com/${p.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" title="Open Instagram" className="text-[#E1306C] text-xs font-bold no-underline hover:opacity-80">IG</a>
                                        )}
                                        <div>
                                            <div className="font-semibold text-sm text-zinc-900 dark:text-white">{p.business_name}</div>
                                            <div className="text-xs text-zinc-400">{p.instagram || p.contact_email || '—'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3.5">
                                    <AdminBadge variant={STATUS_BADGE_VARIANT[p.status ?? ''] || 'neutral'}>
                                        {p.status}
                                    </AdminBadge>
                                </td>
                                <td className="px-4 py-3.5 text-sm text-zinc-600 dark:text-zinc-300">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={14} /> {p.eventCount}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5 text-sm">
                                    <span className={`flex items-center gap-1 ${p.totalInterests > 0 ? 'text-[#2CA58D] font-semibold' : 'text-zinc-400 font-normal'}`}>
                                        <Users size={14} /> {p.totalInterests}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5 text-xs text-zinc-400">
                                    {p.contact_phone || p.contact_email || '—'}
                                </td>
                                <td className="px-4 py-3.5 text-xs">
                                    {p.claim_token ? (
                                        <button
                                            onClick={() => {
                                                const url = `${window.location.origin}/ar/claim/${p.claim_token}`;
                                                navigator.clipboard.writeText(url);
                                            }}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[11px] font-semibold cursor-pointer border-none hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors max-w-[120px] truncate"
                                            title={`${window.location.origin}/ar/claim/${p.claim_token}`}
                                        >
                                            <Copy size={10} /> Copy link
                                        </button>
                                    ) : (
                                        <span className="text-zinc-300 dark:text-zinc-600">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-3.5 text-xs">
                                    {p.status === 'pitched' && days !== null ? (
                                        <span className={`flex items-center gap-1 ${stale ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                            <Clock size={12} /> {days}d ago{stale ? ' ⚠️' : ''}
                                        </span>
                                    ) : (p.status === 'free' || p.status === 'paying') ? (
                                        <span className="text-emerald-500 font-medium">✓ Active</span>
                                    ) : p.status === 'lost' ? (
                                        <span className="text-zinc-400 font-medium">✗ Lost</span>
                                    ) : (
                                        <span className="text-zinc-300 dark:text-zinc-600">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-3.5">
                                    <div className="flex gap-1.5 flex-wrap items-center">
                                        <button
                                            onClick={() => setShowEvent(p.id)}
                                            className="px-2.5 py-1.5 rounded-lg bg-[#2CA58D]/10 text-[#2CA58D] text-[11px] font-semibold cursor-pointer border-none hover:bg-[#2CA58D]/20 transition-colors"
                                        >
                                            + Event
                                        </button>
                                        <button
                                            onClick={() => viewInterests(p.id)}
                                            className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold cursor-pointer border-none hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                        >
                                            View
                                        </button>
                                        {p.status !== 'free' && p.status !== 'paying' && !p.claim_token && (
                                            <button
                                                onClick={() => handleContact(p)}
                                                disabled={loading}
                                                className="px-2.5 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[11px] font-semibold cursor-pointer border-none hover:bg-blue-200 dark:hover:bg-blue-500/20 transition-colors"
                                            >
                                                Pitch
                                            </button>
                                        )}
                                        {p.status === 'pitched' && p.contact_phone && (
                                            <a
                                                href={`https://wa.me/${p.contact_phone.replace(/[^0-9]/g, '')}`}
                                                target="_blank"
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#25D366] text-white text-[11px] font-semibold no-underline hover:bg-[#20bd5a] transition-colors"
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
                                                    bio: p.bio || '',
                                                    location: p.location || '',
                                                });
                                            }}
                                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold cursor-pointer border-none hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                        >
                                            <Edit2 size={11} /> Edit
                                        </button>
                                        <button
                                            onClick={() => setDeletingProspect(p)}
                                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] font-semibold cursor-pointer border-none hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                                        >
                                            <Trash2 size={11} /> Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );})}

                    </tbody>
                </table>
            </AdminCard>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-5">
                    {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => { setPage(p); reload(p, statusFilter); }}
                            className={`px-3.5 py-2 rounded-xl border text-[13px] font-semibold cursor-pointer transition-all duration-200 ${
                                p === page
                                    ? 'bg-[#2CA58D] text-white border-[#2CA58D] shadow-md shadow-[#2CA58D]/20'
                                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
