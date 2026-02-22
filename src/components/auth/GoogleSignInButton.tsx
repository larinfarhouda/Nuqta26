'use client';

import Script from 'next/script';
import { createClient } from '@/utils/supabase/client';
import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { Loader2 } from 'lucide-react';

declare const google: {
    accounts: {
        id: {
            initialize: (config: any) => void;
            renderButton: (element: HTMLElement, config: any) => void;
        };
    };
};

interface GoogleSignInButtonProps {
    locale: string;
    role?: 'user' | 'vendor';
    className?: string;
    children: React.ReactNode;
    onError?: (error: string) => void;
}

const GoogleSignInButton = memo(function GoogleSignInButton({
    locale,
    role = 'user',
    className,
    children,
    onError,
}: GoogleSignInButtonProps) {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);
    const [scriptReady, setScriptReady] = useState(false);
    const googleButtonRef = useRef<HTMLDivElement>(null);
    const initializedRef = useRef(false);
    const roleRef = useRef(role);

    useEffect(() => { roleRef.current = role; }, [role]);

    const handleCredentialResponse = useCallback(async (response: any) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
            });
            if (error) throw error;

            const user = data.user;
            if (!user) throw new Error('No user returned');

            const currentRole = roleRef.current;

            // Parallel: fetch profile + conditionally check vendor existence
            const profilePromise = supabase
                .from('profiles')
                .select('role, created_at')
                .eq('id', user.id)
                .single();

            const vendorPromise = currentRole === 'vendor'
                ? supabase.from('vendors').select('id').eq('id', user.id).single()
                : null;

            const [{ data: profile }, vendorResult] = await Promise.all([
                profilePromise,
                vendorPromise,
            ]);

            let finalRole = profile?.role || user.user_metadata?.role || 'user';

            // Handle vendor role assignment (fire parallel mutations)
            if (currentRole === 'vendor') {
                if (finalRole !== 'vendor') {
                    await supabase.from('profiles').update({ role: 'vendor' }).eq('id', user.id);
                    finalRole = 'vendor';
                }

                if (!vendorResult?.data) {
                    await supabase.from('vendors').insert({
                        id: user.id,
                        business_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Business Name',
                        category: 'other',
                        subscription_tier: 'starter',
                    } as any);
                }
            }

            // Fire-and-forget: new user tracking (don't block redirect)
            if (profile?.created_at) {
                const diffSeconds = (Date.now() - new Date(profile.created_at).getTime()) / 1000;
                if (diffSeconds < 60) {
                    // Run async without awaiting — user gets redirected immediately
                    handleNewUserTracking(supabase, user, finalRole);
                }
            }

            // Redirect immediately — don't wait for tracking
            if (finalRole === 'vendor') {
                window.location.href = `/${locale}/dashboard/vendor`;
            } else if (finalRole === 'admin') {
                window.location.href = `/${locale}/admin`;
            } else {
                window.location.href = `/${locale}`;
            }
        } catch (err: any) {
            console.error('Google sign-in error:', err);
            setIsLoading(false);
            onError?.(err.message || 'Authentication failed');
        }
    }, [supabase, locale, onError]);

    const initializeGoogle = useCallback(() => {
        if (initializedRef.current || !googleButtonRef.current) return;
        initializedRef.current = true;

        google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            callback: handleCredentialResponse,
            use_fedcm_for_prompt: true,
        });

        google.accounts.id.renderButton(googleButtonRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'center',
            width: googleButtonRef.current.offsetWidth || 400,
        });

        setScriptReady(true);
    }, [handleCredentialResponse]);

    return (
        <>
            {/* Preconnect to Google domains for faster script + popup loading */}
            <link rel="preconnect" href="https://accounts.google.com" />
            <link rel="preconnect" href="https://apis.google.com" />
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onReady={initializeGoogle}
            />
            <div className={`relative overflow-hidden ${className || ''}`} style={{ cursor: isLoading ? 'wait' : 'pointer' }}>
                <div className="flex items-center justify-center gap-2 pointer-events-none">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
                </div>
                {!isLoading && (
                    <div
                        ref={googleButtonRef}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0.01,
                            zIndex: 10,
                            overflow: 'hidden',
                        }}
                    />
                )}
            </div>
        </>
    );
});

/** Fire-and-forget: save referral source + send admin notification */
async function handleNewUserTracking(supabase: any, user: any, finalRole: string) {
    try {
        let referralSource: Record<string, string> | null = null;
        try {
            const cookies = document.cookie.split('; ');
            const refCookie = cookies.find((c) => c.startsWith('__nuqta_ref='));
            if (refCookie) {
                referralSource = JSON.parse(decodeURIComponent(refCookie.split('=').slice(1).join('=')));
            }
        } catch { /* ignore */ }

        if (referralSource) {
            await supabase.from('profiles').update({ referral_source: referralSource }).eq('id', user.id);
        }

        const referralInfo: Record<string, string> = {};
        if (referralSource?.utm_source) referralInfo['Referral Source'] = referralSource.utm_source;
        if (referralSource?.utm_medium) referralInfo['Referral Medium'] = referralSource.utm_medium;
        if (referralSource?.utm_campaign) referralInfo['Referral Campaign'] = referralSource.utm_campaign;
        if (referralSource?.landing_page) referralInfo['Landing Page'] = referralSource.landing_page;

        fetch('/api/notify-signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
                userEmail: user.email || 'No email',
                userRole: finalRole === 'vendor' ? 'vendor' : 'user',
                signupMethod: 'google',
                additionalInfo: Object.keys(referralInfo).length > 0 ? referralInfo : undefined,
            }),
        }).catch(() => { });
    } catch { /* silently ignore tracking errors */ }
}

export default GoogleSignInButton;
