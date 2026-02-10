import { Metadata } from 'next';
import PrivacyPageClient from './PrivacyPageClient';

type Props = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;

    const title = locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy';
    const description = locale === 'ar'
        ? 'سياسة الخصوصية لمنصة نقطة. تعرف على كيفية حماية بياناتك الشخصية.'
        : 'Privacy Policy for Nuqta. Learn how we protect your personal data.';

    return {
        title,
        description,
        alternates: {
            canonical: `https://nuqta.ist/${locale}/privacy`,
            languages: {
                'ar': 'https://nuqta.ist/ar/privacy',
                'en': 'https://nuqta.ist/en/privacy',
            },
        },
        openGraph: {
            title,
            description,
            url: `https://nuqta.ist/${locale}/privacy`,
            siteName: 'Nuqta',
            type: 'website',
            locale: locale === 'ar' ? 'ar_TR' : 'en_US',
        },
    };
}

export default function PrivacyPage() {
    return <PrivacyPageClient />;
}
