'use client';

import { useState, useCallback } from 'react';
import { AdminCard } from '@/components/admin/ui/AdminCard';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { autoProspectPipeline, scoutInstagramProfile } from '@/actions/admin';
import {
    Wand2,
    Instagram,
    Search,
    Plus,
    Trash2,
    Rocket,
    Check,
    Copy,
    RotateCcw,
    Mail,
    Phone,
    MapPin,
    Calendar,
    FileText,
    Users,
    Sparkles,
    ExternalLink,
    AlertCircle,
    MessageCircle,
    Clock,
} from 'lucide-react';

// ─── Event Templates ────────────────────────────────────────────────────────

const EVENT_TEMPLATES: Record<string, { event_type: string; capacity: number; description: string }> = {
    workshop: { event_type: 'workshop', capacity: 30, description: 'A hands-on workshop experience with practical exercises and expert guidance.' },
    concert: { event_type: 'concert', capacity: 200, description: 'Live music performance event featuring talented artists.' },
    exhibition: { event_type: 'exhibition', capacity: 100, description: 'Art and culture exhibition showcasing unique creative works.' },
    conference: { event_type: 'conference', capacity: 150, description: 'Industry conference with keynote speakers and networking.' },
    food: { event_type: 'food', capacity: 50, description: 'Food tasting and culinary experience with local flavors.' },
    fitness: { event_type: 'fitness', capacity: 25, description: 'Fitness and wellness session for all levels.' },
    kids: { event_type: 'kids', capacity: 30, description: 'Fun and educational activity for children.' },
    networking: { event_type: 'networking', capacity: 80, description: 'Professional networking event to connect and grow.' },
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface EventFormData {
    id: string;
    title: string;
    date: string;
    description: string;
    location_name: string;
    city: string;
    country: string;
    event_type: string;
    capacity: number;
    image_url: string;
}

interface PipelineResult {
    success?: boolean;
    error?: string;
    prospectId?: string;
    claimUrl?: string;
    eventIds?: string[];
    emailSent?: boolean;
    emailScheduled?: boolean;
}

// Pre-written pitch message template (Arabic + English)
const PITCH_AR = (name: string, claimUrl: string) =>
    `مرحباً ${name} 👋

أنا من فريق Nuqta — منصة لإدارة الفعاليات والحجوزات.

أعجبنا شغلكم وأنشأنا لكم صفحة جاهزة مجاناً على المنصة مع فعالياتكم 🌟

يمكنكم استلامها من هنا:
${claimUrl}

المنصة تساعدكم في إدارة الحجوزات وإرسال رسائل تأكيد تلقائية بالعربي والإنجليزي ✨

هل تحبوا أشرح أكثر؟`;

// ─── Helpers ────────────────────────────────────────────────────────────────

function createEmptyEvent(): EventFormData {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return {
        id: crypto.randomUUID(),
        title: '',
        date: nextWeek.toISOString().split('T')[0],
        description: '',
        location_name: '',
        city: '',
        country: '',
        event_type: '',
        capacity: 50,
        image_url: '',
    };
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ProspectBuilderClient() {
    // Business info state
    const [businessName, setBusinessName] = useState('');
    const [instagram, setInstagram] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');
    const [bio, setBio] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [website, setWebsite] = useState('');

    // Events state
    const [events, setEvents] = useState<EventFormData[]>([createEmptyEvent()]);

    // UI state
    const [sendPitch, setSendPitch] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScouting, setIsScouting] = useState(false);
    const [result, setResult] = useState<PipelineResult | null>(null);
    const [copied, setCopied] = useState(false);
    const [scoutError, setScoutError] = useState('');

    // ─── Scout Instagram ─────────────────────────────────────────────────

    const handleScout = useCallback(async () => {
        const handle = instagram.replace(/^@/, '').trim();
        if (!handle) return;

        setIsScouting(true);
        setScoutError('');

        try {
            const data = await scoutInstagramProfile(handle);
            if (data?.businessName) setBusinessName(data.businessName);
            if (data?.bio) setBio(data.bio);
            if (data?.logoUrl) setLogoUrl(data.logoUrl);
            if (data?.website) setWebsite(data.website);
            if ((data as Record<string, unknown>)?.location) setLocation((data as Record<string, unknown>).location as string);
            if ((data as Record<string, unknown>)?.contactEmail) setEmail((data as Record<string, unknown>).contactEmail as string);
            if ((data as Record<string, unknown>)?.contactPhone) setPhone((data as Record<string, unknown>).contactPhone as string);
        } catch {
            setScoutError('Failed to scout profile. Try again or enter details manually.');
        } finally {
            setIsScouting(false);
        }
    }, [instagram]);

    // ─── Event Management ────────────────────────────────────────────────

    const addEvent = useCallback(() => {
        if (events.length >= 3) return;
        setEvents(prev => [...prev, createEmptyEvent()]);
    }, [events.length]);

    const removeEvent = useCallback((id: string) => {
        setEvents(prev => prev.filter(e => e.id !== id));
    }, []);

    const updateEvent = useCallback((id: string, field: keyof EventFormData, value: string | number) => {
        setEvents(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
    }, []);

    const applyTemplate = useCallback((eventId: string, templateKey: string) => {
        const template = EVENT_TEMPLATES[templateKey];
        if (!template) return;
        setEvents(prev => prev.map(e => e.id === eventId ? {
            ...e,
            event_type: template.event_type,
            capacity: template.capacity,
            description: template.description,
        } : e));
    }, []);

    // ─── Submit Pipeline ─────────────────────────────────────────────────

    const handleSubmit = useCallback(async () => {
        if (!businessName.trim()) return;
        const validEvents = events.filter(e => e.title.trim() && e.date);
        if (validEvents.length === 0) return;

        setIsSubmitting(true);
        setResult(null);

        try {
            const res = await autoProspectPipeline({
                business_name: businessName.trim(),
                contact_email: email.trim() || undefined,
                contact_phone: phone.trim() || undefined,
                instagram: instagram.trim() || undefined,
                website: website.trim() || undefined,
                bio: bio.trim() || undefined,
                logo_url: logoUrl.trim() || undefined,
                location: location.trim() || undefined,
                events: validEvents.map(e => ({
                    title: e.title,
                    date: e.date,
                    description: e.description || undefined,
                    location_name: e.location_name || undefined,
                    city: e.city || undefined,
                    country: e.country || undefined,
                    event_type: e.event_type || undefined,
                    capacity: e.capacity || undefined,
                    image_url: e.image_url || undefined,
                })),
                sendPitch,
                locale: 'ar',
            });
            setResult(res);
        } catch {
            setResult({ error: 'Something went wrong. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    }, [businessName, email, phone, instagram, website, bio, logoUrl, location, events, sendPitch]);

    // ─── Copy Claim URL ──────────────────────────────────────────────

    const copyClaimUrl = useCallback(() => {
        if (!result?.claimUrl) return;
        navigator.clipboard.writeText(result.claimUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [result?.claimUrl]);

    // ─── Open Instagram DM ───────────────────────────────────────────

    const [dmCopied, setDmCopied] = useState(false);

    const openInstagramDM = useCallback(() => {
        const handle = instagram.replace(/^@/, '').trim();
        if (!handle || !result?.claimUrl) return;

        // Copy pitch message to clipboard
        const message = PITCH_AR(businessName, result.claimUrl);
        navigator.clipboard.writeText(message);
        setDmCopied(true);
        setTimeout(() => setDmCopied(false), 3000);

        // Open Instagram DM
        window.open(`https://ig.me/m/${handle}`, '_blank');
    }, [instagram, result?.claimUrl, businessName]);

    // ─── Reset Form ──────────────────────────────────────────────────────

    const resetForm = useCallback(() => {
        setBusinessName('');
        setInstagram('');
        setEmail('');
        setPhone('');
        setLocation('');
        setBio('');
        setLogoUrl('');
        setWebsite('');
        setEvents([createEmptyEvent()]);
        setResult(null);
        setCopied(false);
        setScoutError('');
    }, []);

    // ─── Validation ──────────────────────────────────────────────────────

    const isValid = businessName.trim().length > 0 && events.some(e => e.title.trim() && e.date);

    // ─── Render ──────────────────────────────────────────────────────────

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-gradient-to-br from-[#2CA58D] to-[#258f7a] rounded-2xl shadow-lg shadow-[#2CA58D]/20">
                    <Wand2 className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-zinc-900">Prospect Builder</h1>
                    <p className="text-sm text-zinc-500">Create page → Add events → Send pitch — all in one click</p>
                </div>
            </div>

            {/* Success Result */}
            {result?.success && (
                <AdminCard className="border-emerald-200 bg-emerald-50/80">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-2xl bg-emerald-100">
                            <Check className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="flex-1 space-y-3">
                            <div>
                                <h3 className="text-lg font-bold text-emerald-900">Prospect Created Successfully!</h3>
                                <p className="text-sm text-emerald-700 mt-1">
                                    {result.eventIds?.length || 0} event{(result.eventIds?.length || 0) !== 1 ? 's' : ''} added
                                    {result.emailSent && ' • Pitch email sent'}
                                    {result.emailScheduled && ' • Email scheduled for morning'}
                                </p>
                            </div>

                            {/* Email scheduling notice */}
                            {result.emailScheduled && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-200">
                                    <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                    <p className="text-xs text-amber-700 font-medium">
                                        Outside business hours — pitch email will be sent at 9AM automatically
                                    </p>
                                </div>
                            )}

                            {/* Claim URL */}
                            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-emerald-200">
                                <span className="text-sm font-mono text-zinc-700 truncate flex-1">{result.claimUrl}</span>
                                <button
                                    onClick={copyClaimUrl}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold hover:bg-emerald-200 transition-colors"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                                <a
                                    href={result.claimUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4 text-emerald-600" />
                                </a>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Instagram DM button */}
                                {instagram.trim() && (
                                    <AdminButton onClick={openInstagramDM} variant="outline" size="sm">
                                        <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                                        {dmCopied ? '✅ Message copied — paste in Instagram' : 'Send Instagram DM'}
                                    </AdminButton>
                                )}

                                <AdminButton onClick={resetForm} variant="ghost" size="sm">
                                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                    Create Another
                                </AdminButton>
                            </div>
                        </div>
                    </div>
                </AdminCard>
            )}

            {/* Error Result */}
            {result?.error && (
                <AdminCard className="border-red-200 bg-red-50/80">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-700 font-medium">{result.error}</p>
                    </div>
                </AdminCard>
            )}

            {/* Business Info Section */}
            {!result?.success && (
                <>
                    <AdminCard>
                        <div className="flex items-center gap-2 mb-5">
                            <Sparkles className="w-4.5 h-4.5 text-[#2CA58D]" />
                            <h2 className="text-base font-bold text-zinc-900">Business Info</h2>
                        </div>

                        <div className="space-y-4">
                            {/* Instagram + Scout */}
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Instagram Handle</label>
                                    <AdminInput
                                        value={instagram}
                                        onChange={e => setInstagram(e.target.value)}
                                        placeholder="@organizer_handle"
                                        icon={<Instagram className="w-4 h-4" />}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <AdminButton
                                        onClick={handleScout}
                                        variant="outline"
                                        isLoading={isScouting}
                                        disabled={!instagram.trim()}
                                        className="h-11"
                                    >
                                        <Search className="w-4 h-4 mr-1.5" />
                                        Scout
                                    </AdminButton>
                                </div>
                            </div>

                            {scoutError && (
                                <p className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {scoutError}
                                </p>
                            )}

                            {/* Scouted preview */}
                            {logoUrl && (
                                <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                                    <img
                                        src={logoUrl}
                                        alt=""
                                        className="w-12 h-12 rounded-xl object-cover"
                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-zinc-900 truncate">{businessName || 'Unknown'}</p>
                                        {bio && <p className="text-xs text-zinc-500 truncate">{bio}</p>}
                                    </div>
                                    <div className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">
                                        Scouted
                                    </div>
                                </div>
                            )}

                            {/* Name + Email row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Business Name *</label>
                                    <AdminInput
                                        value={businessName}
                                        onChange={e => setBusinessName(e.target.value)}
                                        placeholder="Event organizer name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Email</label>
                                    <AdminInput
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="contact@organizer.com"
                                        type="email"
                                        icon={<Mail className="w-4 h-4" />}
                                    />
                                </div>
                            </div>

                            {/* Phone + Location row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Phone</label>
                                    <AdminInput
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="+20 xxx xxx xxxx"
                                        icon={<Phone className="w-4 h-4" />}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Location</label>
                                    <AdminInput
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        placeholder="Cairo, Egypt"
                                        icon={<MapPin className="w-4 h-4" />}
                                    />
                                </div>
                            </div>
                        </div>
                    </AdminCard>

                    {/* Events Section */}
                    <AdminCard>
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4.5 h-4.5 text-[#2CA58D]" />
                                <h2 className="text-base font-bold text-zinc-900">Events</h2>
                                <span className="text-xs text-zinc-400 font-medium">({events.length}/3)</span>
                            </div>
                            {events.length < 3 && (
                                <AdminButton onClick={addEvent} variant="ghost" size="sm">
                                    <Plus className="w-3.5 h-3.5 mr-1" />
                                    Add Event
                                </AdminButton>
                            )}
                        </div>

                        <div className="space-y-5">
                            {events.map((event, index) => (
                                <div
                                    key={event.id}
                                    className="p-5 bg-zinc-50/80 rounded-2xl border border-zinc-100 space-y-4"
                                >
                                    {/* Event header */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                            Event {index + 1}
                                        </span>
                                        {events.length > 1 && (
                                            <button
                                                onClick={() => removeEvent(event.id)}
                                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Event type quick-select */}
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-500 mb-2">Quick Template</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {Object.keys(EVENT_TEMPLATES).map(key => (
                                                <button
                                                    key={key}
                                                    onClick={() => applyTemplate(event.id, key)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                                        event.event_type === key
                                                            ? 'bg-[#2CA58D] text-white shadow-sm'
                                                            : 'bg-white text-zinc-600 border border-zinc-200 hover:border-[#2CA58D] hover:text-[#2CA58D]'
                                                    }`}
                                                >
                                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Title + Date */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Title *</label>
                                            <AdminInput
                                                value={event.title}
                                                onChange={e => updateEvent(event.id, 'title', e.target.value)}
                                                placeholder="Event title"
                                                icon={<FileText className="w-4 h-4" />}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Date *</label>
                                            <AdminInput
                                                type="date"
                                                value={event.date}
                                                onChange={e => updateEvent(event.id, 'date', e.target.value)}
                                                icon={<Calendar className="w-4 h-4" />}
                                            />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Description</label>
                                        <textarea
                                            value={event.description}
                                            onChange={e => updateEvent(event.id, 'description', e.target.value)}
                                            placeholder="Short event description..."
                                            rows={2}
                                            className="w-full px-4 py-3 text-sm rounded-2xl border-2 border-zinc-200 bg-white transition-all duration-200 outline-none focus:border-[#2CA58D] focus:ring-4 focus:ring-[#2CA58D]/10 resize-none placeholder:text-zinc-400"
                                        />
                                    </div>

                                    {/* Location + Capacity */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Venue</label>
                                            <AdminInput
                                                value={event.location_name}
                                                onChange={e => updateEvent(event.id, 'location_name', e.target.value)}
                                                placeholder="Venue name"
                                                icon={<MapPin className="w-4 h-4" />}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-500 mb-1.5">City</label>
                                            <AdminInput
                                                value={event.city}
                                                onChange={e => updateEvent(event.id, 'city', e.target.value)}
                                                placeholder="Cairo"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Capacity</label>
                                            <AdminInput
                                                type="number"
                                                value={String(event.capacity)}
                                                onChange={e => updateEvent(event.id, 'capacity', parseInt(e.target.value) || 0)}
                                                placeholder="50"
                                                icon={<Users className="w-4 h-4" />}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AdminCard>

                    {/* Action Section */}
                    <AdminCard>
                        <div className="space-y-4">
                            {/* Send pitch toggle */}
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={sendPitch}
                                        onChange={e => setSendPitch(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-6 rounded-full bg-zinc-200 peer-checked:bg-[#2CA58D] transition-colors" />
                                    <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
                                </div>
                                <div>
                                    <span className="text-sm font-semibold text-zinc-900">Send pitch email immediately</span>
                                    {!email.trim() && sendPitch && (
                                        <p className="text-[11px] text-amber-500 font-medium mt-0.5">
                                            No email provided — pitch won&apos;t be sent
                                        </p>
                                    )}
                                </div>
                            </label>

                            {/* Submit button */}
                            <AdminButton
                                onClick={handleSubmit}
                                isLoading={isSubmitting}
                                disabled={!isValid}
                                size="lg"
                                className="w-full"
                            >
                                <Rocket className="w-5 h-5 mr-2" />
                                {isSubmitting ? 'Building prospect...' : 'Create & Pitch'}
                            </AdminButton>

                            {!isValid && (
                                <p className="text-xs text-zinc-400 text-center">
                                    Enter a business name and at least one event with a title and date
                                </p>
                            )}
                        </div>
                    </AdminCard>
                </>
            )}
        </div>
    );
}
