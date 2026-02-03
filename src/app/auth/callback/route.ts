import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

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

                // If roleParam is vendor and user isn't already a vendor, update profile
                if (roleParam && roleParam === 'vendor' && finalRole !== 'vendor') {
                    await supabase.from('profiles').update({ role: 'vendor' }).eq('id', user.id);

                    // Ensure vendor entry exists (defense in depth)
                    const { data: existingVendor } = await supabase
                        .from('vendors')
                        .select('id')
                        .eq('id', user.id)
                        .single();

                    if (!existingVendor) {
                        // Create minimal vendor entry with required fields
                        // User can complete profile later in vendor dashboard
                        await supabase.from('vendors').insert({
                            business_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Business Name',
                            category: 'other',  // Default category
                            subscription_tier: 'starter'
                        });
                    }

                    finalRole = 'vendor';
                }

                const next = searchParams.get('next');
                if (next) {
                    // If next is already localized or starts with /, use it
                    // Otherwise, prefix with locale
                    const target = next.startsWith('/') ? next : `/${next}`;
                    const localizedTarget = next.match(/^\/(ar|en)\//) ? target : `/${locale}${target}`;
                    return NextResponse.redirect(`${origin}${localizedTarget}`);
                }

                // Determine redirect path based on actual role
                if (finalRole === 'vendor') {
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
