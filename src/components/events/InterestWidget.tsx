'use client';

import { useState, useTransition } from 'react';
import { Heart, Users, Loader2, Check, LogIn } from 'lucide-react';
import { useRouter } from '@/navigation';
import { useLocale } from 'next-intl';
import { expressInterest } from '@/actions/public/interests';

interface InterestWidgetProps {
    eventId: string;
    user: any;
    initialInterested: boolean;
    interestCount: number;
}

export default function InterestWidget({ eventId, user, initialInterested, interestCount }: InterestWidgetProps) {
    const [interested, setInterested] = useState(initialInterested);
    const [count, setCount] = useState(interestCount);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const locale = useLocale();

    const handleInterest = () => {
        if (!user) {
            router.push('/login');
            return;
        }

        startTransition(async () => {
            const result = await expressInterest(eventId);
            if (result.success) {
                setInterested(true);
                if (!result.alreadyInterested) {
                    setCount(c => c + 1);
                }
            }
        });
    };

    return (
        <div
            style={{
                background: 'linear-gradient(135deg, #faf5ff 0%, #f0f9ff 50%, #fdf4ff 100%)',
                borderRadius: '2rem',
                padding: '32px 28px',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                textAlign: 'center',
            }}
        >
            {/* Badge */}
            <div
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    color: '#7c3aed',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '16px',
                }}
            >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed' }} />
                Coming Soon
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Interested in this event?
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: 1.6 }}>
                This event is being organized. Express your interest to help make it happen!
            </p>

            {/* Interest Count */}
            {count > 0 && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        marginBottom: '16px',
                        color: '#8b5cf6',
                        fontWeight: 700,
                        fontSize: '14px',
                    }}
                >
                    <Users size={16} />
                    {count} {count === 1 ? 'person' : 'people'} interested
                </div>
            )}

            {/* Button */}
            {interested ? (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '16px 24px',
                        borderRadius: '14px',
                        background: '#dcfce7',
                        color: '#166534',
                        fontWeight: 700,
                        fontSize: '15px',
                    }}
                >
                    <Check size={18} />
                    You&apos;re interested! We&apos;ll notify you.
                </div>
            ) : (
                <button
                    onClick={handleInterest}
                    disabled={isPending}
                    style={{
                        width: '100%',
                        padding: '16px 24px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
                        transition: 'all 0.2s',
                    }}
                >
                    {isPending ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : user ? (
                        <>
                            <Heart size={18} />
                            I&apos;m Interested
                        </>
                    ) : (
                        <>
                            <LogIn size={18} />
                            Sign in to express interest
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
