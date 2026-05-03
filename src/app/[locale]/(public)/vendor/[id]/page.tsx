import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';

/**
 * Legacy vendor profile route — redirects to /v/[slug]
 * Kept for backwards compatibility with old links
 */
export default async function VendorProfileRedirect({
    params
}: {
    params: Promise<{ id: string; locale: string }>;
}) {
    const { id, locale } = await params;
    const supabase = await createClient();

    // Look up vendor slug by ID
    const { data: vendor } = await supabase
        .from('vendors')
        .select('slug')
        .eq('id', id)
        .single();

    if (!vendor?.slug) {
        return notFound();
    }

    // Permanent redirect to the canonical /v/[slug] route
    redirect(`/${locale}/v/${vendor.slug}`);
}
