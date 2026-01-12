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
                // Fetch the current profile to see what we have
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

                let finalRole = profile?.role;

                // If user purposefully signed up as vendor via social login (role param present), ensure they are a vendor
                if (roleParam && roleParam === 'vendor') {
                    if (!profile || profile.role !== 'vendor') {
                        await supabase.from('profiles').update({ role: 'vendor' }).eq('id', user.id);
                        finalRole = 'vendor';
                    }
                }

                // Determine redirect path
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
