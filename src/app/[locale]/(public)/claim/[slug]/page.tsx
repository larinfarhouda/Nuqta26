import { createAdminClient, createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import ClaimFormClient from '@/components/claim/ClaimFormClient';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const isArabic = locale === 'ar';

    return {
        title: isArabic ? 'استلام صفحتك | نقطة' : 'Claim Your Page | Nuqta',
        description: isArabic
            ? 'استلم صفحة منظم الفعاليات الخاصة بك على نقطة وابدأ بإدارة فعالياتك.'
            : 'Claim your event organizer page on Nuqta and start managing your events.',
        robots: { index: false, follow: false },
    };
}

export default async function ClaimPage({ params }: { params: any }) {
    const { slug, locale } = await params;

    const adminClient = createAdminClient();

    // Find prospect vendor by claim_token matching slug
    const { data: prospect } = await adminClient
        .from('prospect_vendors')
        .select('*')
        .eq('claim_token', slug)
        .single();

    if (!prospect) return notFound();

    if (prospect.status === 'converted') {
        // Already converted — redirect to login
        redirect(`/${locale}/login`);
    }

    // Get user session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get events for this prospect
    const { data: events } = await adminClient
        .from('events')
        .select('id, title, date, status')
        .eq('prospect_vendor_id', prospect.id);

    return (
        <ClaimFormClient
            prospect={prospect}
            events={events || []}
            user={user}
            locale={locale}
        />
    );
}
