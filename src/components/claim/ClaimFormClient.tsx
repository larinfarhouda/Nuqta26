'use client';

import { useState } from 'react';
import { Store, Calendar, Check, ArrowRight, Loader2, Users, PartyPopper, ExternalLink } from 'lucide-react';
import { useRouter } from '@/navigation';
import { claimProspectBusiness } from '@/actions/public/claim';

interface ClaimFormClientProps {
    prospect: any;
    events: { id: string; title: string; date: string; status: string | null }[];
    user: any;
    locale: string;
    interestCount?: number;
}

export default function ClaimFormClient({ prospect, events, user, locale, interestCount = 0 }: ClaimFormClientProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [claimed, setClaimed] = useState(false);
    const [error, setError] = useState('');

    const handleClaim = async () => {
        if (!user) {
            // Redirect to signup with claim redirect
            router.push(`/register?redirect=/claim/${prospect.claim_token}&role=vendor`);
            return;
        }

        setLoading(true);
        setError('');

        const result = await claimProspectBusiness(prospect.claim_token);

        if (result.success) {
            setClaimed(true);
        } else {
            setError(result.error || 'Something went wrong. Please try again.');
        }

        setLoading(false);
    };

    // ─── Success State ──────────────────────────────────────────────────────
    if (claimed) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 50%, #fdf4ff 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 20px',
                }}
            >
                <div
                    style={{
                        maxWidth: '480px',
                        width: '100%',
                        background: '#fff',
                        borderRadius: '24px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                        padding: '48px 32px',
                        textAlign: 'center',
                    }}
                >
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: '#dcfce7', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 24px',
                    }}>
                        <PartyPopper size={40} style={{ color: '#16a34a' }} />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
                        Welcome to Nuqta! 🎉
                    </h1>
                    <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.6, marginBottom: '8px' }}>
                        <strong>{prospect.business_name}</strong> is now yours.
                    </p>
                    <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '28px' }}>
                        Your events have been transferred to your vendor dashboard.
                        You can now manage bookings, see who&apos;s interested, and start selling tickets.
                    </p>

                    <a
                        href={`/${locale}/dashboard/vendor`}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '16px 32px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '16px',
                            textDecoration: 'none',
                            boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
                        }}
                    >
                        Go to Dashboard
                        <ExternalLink size={18} />
                    </a>
                </div>
            </div>
        );
    }

    // ─── Claim Form ─────────────────────────────────────────────────────────
    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #faf5ff 0%, #f0f9ff 50%, #fdf4ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
            }}
        >
            <div
                style={{
                    maxWidth: '520px',
                    width: '100%',
                    background: '#fff',
                    borderRadius: '24px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        padding: '40px 32px',
                        textAlign: 'center',
                        color: '#fff',
                    }}
                >
                    <div
                        style={{
                            width: '72px', height: '72px', borderRadius: '20px',
                            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px',
                        }}
                    >
                        {prospect.logo_url ? (
                            <img
                                src={prospect.logo_url}
                                alt={prospect.business_name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }}
                            />
                        ) : (
                            <Store size={32} style={{ color: '#fff' }} />
                        )}
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
                        Your Page is Ready! ✨
                    </h1>
                    <p style={{ fontSize: '15px', opacity: 0.9 }}>
                        {prospect.business_name}
                    </p>
                </div>

                <div style={{ padding: '32px' }}>
                    {/* Social Proof — Interest Count */}
                    {interestCount > 0 && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '16px 20px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, #faf5ff, #ede9fe)',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            marginBottom: '24px',
                        }}>
                            <Users size={20} style={{ color: '#7c3aed', flexShrink: 0 }} />
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '16px', color: '#7c3aed' }}>
                                    {interestCount} {interestCount === 1 ? 'person' : 'people'} interested
                                </div>
                                <div style={{ fontSize: '12px', color: '#8b5cf6' }}>
                                    in your events on Nuqta
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Events Listed */}
                    {events.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                                Your events on Nuqta:
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {events.map(e => (
                                    <div
                                        key={e.id}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            padding: '12px 16px', borderRadius: '12px',
                                            background: '#f8fafc', border: '1px solid #e2e8f0',
                                        }}
                                    >
                                        <Calendar size={16} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{e.title}</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                {new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Benefits */}
                    <div style={{ marginBottom: '28px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                            What you get:
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                            'Your own vendor page — already live on Nuqta',
                            'Manage your events, bookings & schedule',
                            'See who\'s interested and accept payments',
                            'Analytics dashboard — free to start',
                            ].map((benefit, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        fontSize: '14px', color: '#475569',
                                    }}
                                >
                                    <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                                    {benefit}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            padding: '12px 16px', borderRadius: '12px',
                            background: '#fef2f2', border: '1px solid #fecaca',
                            color: '#991b1b', fontSize: '13px', fontWeight: 500,
                            marginBottom: '16px',
                        }}>
                            {error}
                        </div>
                    )}

                    {/* CTA Button */}
                    <button
                        onClick={handleClaim}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '16px 24px',
                            borderRadius: '14px',
                            background: loading
                                ? '#cbd5e1'
                                : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                            color: '#fff',
                            border: 'none',
                            cursor: loading ? 'wait' : 'pointer',
                            fontWeight: 700,
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: loading ? 'none' : '0 4px 14px rgba(139, 92, 246, 0.3)',
                            transition: 'all 0.2s',
                        }}
                    >
                        {loading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : user ? (
                            <>
                                Get Started — It&apos;s Free
                                <ArrowRight size={18} />
                            </>
                        ) : (
                            <>
                                Sign Up Free
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    <p style={{
                        fontSize: '12px', color: '#94a3b8', textAlign: 'center',
                        marginTop: '16px', lineHeight: 1.5,
                    }}>
                        By signing up, you agree to Nuqta&apos;s vendor terms.
                        Free starter plan — no credit card needed.
                    </p>
                </div>
            </div>
        </div>
    );
}
