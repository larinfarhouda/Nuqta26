'use client';

import { useState } from 'react';
import { Store, Calendar, Check, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from '@/navigation';

interface ClaimFormClientProps {
    prospect: any;
    events: { id: string; title: string; date: string; status: string | null }[];
    user: any;
    locale: string;
}

export default function ClaimFormClient({ prospect, events, user, locale }: ClaimFormClientProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleClaim = () => {
        if (!user) {
            // Redirect to signup with claim redirect
            router.push(`/register?redirect=/claim/${prospect.claim_token}&role=vendor`);
            return;
        }

        // If user is already logged in, redirect to vendor dashboard
        // The conversion will happen through the admin panel
        alert('Thank you! The Nuqta team will process your claim shortly. You will receive an email confirmation.');
    };

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
                        Claim Your Business
                    </h1>
                    <p style={{ fontSize: '15px', opacity: 0.9 }}>
                        {prospect.business_name}
                    </p>
                </div>

                <div style={{ padding: '32px' }}>
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
                                'Full control of your vendor profile & events',
                                'See users who expressed interest in your events',
                                'Accept bookings & payments through Nuqta',
                                'Analytics dashboard with real-time insights',
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

                    {/* CTA Button */}
                    <button
                        onClick={handleClaim}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '16px 24px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
                            transition: 'all 0.2s',
                        }}
                    >
                        {loading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : user ? (
                            <>
                                Claim Business
                                <ArrowRight size={18} />
                            </>
                        ) : (
                            <>
                                Sign Up to Claim
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    <p style={{
                        fontSize: '12px', color: '#94a3b8', textAlign: 'center',
                        marginTop: '16px', lineHeight: 1.5,
                    }}>
                        By claiming this business, you agree to Nuqta&apos;s vendor terms.
                        Free starter plan included.
                    </p>
                </div>
            </div>
        </div>
    );
}
