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
                        await supabase.from('vendors').insert({
                            id: user.id,  // Required field
                            business_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Business Name',
                            category: 'other',  // Default category
                            subscription_tier: 'starter'
                        });
                    }
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
