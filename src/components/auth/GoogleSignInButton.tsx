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

// Inline Google SVG to avoid external URL being blocked by Safari/ad-blockers
function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        </svg>
    );
}

interface GoogleSignInButtonProps {
    locale: string;
    role?: 'user' | 'vendor';
    redirectUrl?: string;
    className?: string;
    children: React.ReactNode;
    onError?: (error: string) => void;
}

const GoogleSignInButton = memo(function GoogleSignInButton({
    locale,
    role = 'user',
    redirectUrl,
    className,
    children,
    onError,
}: GoogleSignInButtonProps) {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);
    const [scriptReady, setScriptReady] = useState(false);
    const [gsiAvailable, setGsiAvailable] = useState(false);
    const googleButtonRef = useRef<HTMLDivElement>(null);
    const initializedRef = useRef(false);
    const roleRef = useRef(role);
    const redirectUrlRef = useRef(redirectUrl);

    useEffect(() => { roleRef.current = role; }, [role]);
    useEffect(() => { redirectUrlRef.current = redirectUrl; }, [redirectUrl]);

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

            // Redirect: use redirectUrl if available, otherwise role-based
            const currentRedirectUrl = redirectUrlRef.current;
            if (currentRedirectUrl) {
                window.location.href = currentRedirectUrl;
            } else if (finalRole === 'vendor') {
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

        try {
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
            setGsiAvailable(true);
        } catch (err) {
            console.warn('Google Sign-In initialization failed, using OAuth fallback:', err);
            setGsiAvailable(false);
        }
    }, [handleCredentialResponse]);

    // Fallback for Safari/Firefox where GIS doesn't work: use Supabase OAuth redirect
    const handleOAuthFallback = useCallback(async () => {
        setIsLoading(true);
        try {
            const currentRedirectUrl = redirectUrlRef.current;
            const callbackUrl = new URL('/auth/callback', window.location.origin);
            callbackUrl.searchParams.set('locale', locale);
            if (roleRef.current) callbackUrl.searchParams.set('role', roleRef.current);
            if (currentRedirectUrl) callbackUrl.searchParams.set('next', currentRedirectUrl);

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: callbackUrl.toString(),
                },
            });
            if (error) throw error;
        } catch (err: any) {
            console.error('Google OAuth fallback error:', err);
            setIsLoading(false);
            onError?.(err.message || 'Authentication failed');
        }
    }, [supabase, locale, onError]);

    // Check if GSI has rendered an iframe (the actual Google button)
    // If not after a timeout, the GIS script was likely blocked (Safari ITP)
    useEffect(() => {
        if (!scriptReady) return;
        const timer = setTimeout(() => {
            const iframe = googleButtonRef.current?.querySelector('iframe');
            if (!iframe) {
                console.warn('Google Sign-In iframe not found — falling back to OAuth');
                setGsiAvailable(false);
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [scriptReady]);

    return (
        <>
            {/* Preconnect to Google domains for faster script + popup loading */}
            <link rel="preconnect" href="https://accounts.google.com" />
            <link rel="preconnect" href="https://apis.google.com" />
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onReady={initializeGoogle}
                onError={() => {
                    console.warn('Google GSI script failed to load — using OAuth fallback');
                    setGsiAvailable(false);
                }}
            />
            <div
                className={`relative overflow-hidden ${className || ''}`}
                style={{ cursor: isLoading ? 'wait' : 'pointer' }}
                onClick={!gsiAvailable && !isLoading ? handleOAuthFallback : undefined}
            >
                <div className="flex items-center justify-center gap-2 pointer-events-none">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
                </div>
                {/* Only show the invisible GIS overlay if GIS is actually working */}
                {!isLoading && gsiAvailable && (
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
                {/* Hidden ref for GIS initialization even when not showing overlay */}
                {!gsiAvailable && (
                    <div ref={googleButtonRef} style={{ display: 'none' }} />
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

export { GoogleIcon };
export default GoogleSignInButton;
