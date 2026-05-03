import type { Metadata } from 'next';
import SuggestVendorClient from '@/components/suggest/SuggestVendorClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const isArabic = locale === 'ar';
    return {
        title: isArabic ? 'اقترح منظم فعاليات | نقطة' : 'Suggest a Vendor | Nuqta',
        description: isArabic
            ? 'اقترح منظم فعاليات تود رؤيته على نقطة'
            : 'Suggest an event organizer you\'d like to see on Nuqta',
    };
}

export default async function SuggestVendorPage() {
    return <SuggestVendorClient />;
}
