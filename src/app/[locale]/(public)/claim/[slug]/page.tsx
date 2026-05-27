import { createAdminClient, createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import ClaimFormClient from '@/components/claim/ClaimFormClient';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const isArabic = locale === 'ar';

    return {
        title: isArabic ? 'صفحتك جاهزة | نقطة' : 'Your Page is Ready | Nuqta',
        description: isArabic
            ? 'صفحتك كمنظم فعاليات جاهزة على نقطة. سجل مجاناً وابدأ بإدارة فعالياتك.'
            : 'Your event organizer page is already live on Nuqta. Sign up free to manage your events.',
        robots: { index: false, follow: false },
    };
}

export default async function ClaimPage({ params }: { params: any }) {
    const { slug, locale } = await params;

    let adminClient;
    try {
        adminClient = await createAdminClient();
    } catch {
        return notFound();
    }

    // Find prospect vendor by claim_token matching slug
    const { data: prospect } = await adminClient
        .from('prospect_vendors')
        .select('*')
        .eq('claim_token', slug)
        .single();

    if (!prospect) return notFound();

    if (prospect.status === 'free' || prospect.status === 'paying') {
        // Already signed up — redirect to dashboard
        redirect(`/${locale}/dashboard/vendor`);
    }

    // Get user session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get events for this prospect
    const { data: events } = await adminClient
        .from('events')
        .select('id, title, date, status')
        .eq('prospect_vendor_id', prospect.id);

    // Get total interest count across all phantom events (social proof)
    let interestCount = 0;
    if (events && events.length > 0) {
        const eventIds = events.map(e => e.id);
        const { count } = await adminClient
            .from('event_interests')
            .select('*', { count: 'exact', head: true })
            .in('event_id', eventIds);
        interestCount = count || 0;
    }

    return (
        <ClaimFormClient
            prospect={prospect}
            events={events || []}
            user={user}
            locale={locale}
            interestCount={interestCount}
        />
    );
}
