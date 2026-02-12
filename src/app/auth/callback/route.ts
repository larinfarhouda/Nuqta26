import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { NotificationService } from '@/services/notification.service';
import { trackActivity } from '@/lib/track-activity';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const roleParam = searchParams.get('role');
    const locale = searchParams.get('locale') || 'ar'; // Default to Arabic if missing

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Get actual role from profiles table (more reliable than user metadata for OAuth)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                // Determine final role
                let finalRole = profile?.role || user.user_metadata?.role || 'user';

                console.log('🔍 Auth Callback Debug:', {
                    userId: user.id,
                    email: user.email,
                    profileRole: profile?.role,
                    metadataRole: user.user_metadata?.role,
                    finalRole,
                    roleParam
                });

                //Handle vendor role assignment and vendor entry creation
                if (roleParam && roleParam === 'vendor') {
                    // Update profile role if needed
                    if (finalRole !== 'vendor') {
                        await supabase.from('profiles').update({ role: 'vendor' }).eq('id', user.id);
                        finalRole = 'vendor';
                    }

                    // ALWAYS check and create vendor entry for vendor role
                    // This handles both new OAuth signups and role upgrades
                    const { data: existingVendor } = await supabase
                        .from('vendors')
                        .select('id')
                        .eq('id', user.id)
                        .single();

                    if (!existingVendor) {
                        console.log('Creating vendor entry for OAuth user:', user.id);
                        // Type assertion needed due to incorrect auto-generated types
                        await supabase.from('vendors').insert({
                            id: user.id,
                            business_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Business Name',
                            category: 'other',
                            subscription_tier: 'starter'
                        } as any);
                    }
                }

                // Check if this is a new user (profile created within last 60 seconds)
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('created_at, full_name')
                    .eq('id', user.id)
                    .single();

                if (profileData && profileData.created_at) {
                    const createdAt = new Date(profileData.created_at);
                    const now = new Date();
                    const diffSeconds = (now.getTime() - createdAt.getTime()) / 1000;

                    if (diffSeconds < 60) {
                        // New user — send admin notification (fire-and-forget)
                        const notificationService = new NotificationService();
                        notificationService.sendNewSignupNotification({
                            userName: profileData.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
                            userEmail: user.email || 'No email',
                            userRole: finalRole === 'vendor' ? 'vendor' : 'user',
                            signupMethod: 'google',
                        }).catch(() => { /* silently ignore */ });
                    }
                }

                // Track login activity
                trackActivity({
                    userId: user.id,
                    userRole: finalRole === 'vendor' ? 'vendor' : 'customer',
                    action: 'user_login',
                    details: { method: 'oauth' },
                });

                const next = searchParams.get('next');
                if (next) {
                    // If next is already localized or starts with /, use it
                    // Otherwise, prefix with locale
                    const target = next.startsWith('/') ? next : `/${next}`;
                    const localizedTarget = next.match(/^\/(ar|en)\//) ? target : `/${locale}${target}`;
                    return NextResponse.redirect(`${origin}${localizedTarget}`);
                }

                // Determine redirect path based on actual role
                console.log('🎯 Auth Callback - Redirecting based on role:', {
                    finalRole,
                    profileRole: profile?.role,
                    userId: user.id,
                    email: user.email
                });

                if (finalRole === 'vendor') {
                    console.log('→ Redirecting to vendor dashboard');
                    return NextResponse.redirect(`${origin}/${locale}/dashboard/vendor`);
                } else if (finalRole === 'admin') {
                    return NextResponse.redirect(`${origin}/${locale}/admin`);
                } else {
                    return NextResponse.redirect(`${origin}/${locale}`);
                }
            }
        }
    }

    // Return the user to an error page with some instructions
    return NextResponse.redirect(`${origin}/${locale}/login?error=auth_code_error`);
}
