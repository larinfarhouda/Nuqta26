import { Metadata } from 'next';
import PrivacyPageClient from './PrivacyPageClient';
import { generateLocaleBreadcrumbSchema, generateWebPageSchema } from '@/lib/seo';

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
                'x-default': 'https://nuqta.ist/ar/privacy',
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
        twitter: {
            card: 'summary',
            title,
            description,
        },
    };
}

export default async function PrivacyPage({ params }: Props) {
    const { locale } = await params;

    const breadcrumbSchema = generateLocaleBreadcrumbSchema(locale, [
        { name: locale === 'ar' ? 'الرئيسية' : 'Home', path: '' },
        { name: locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy', path: '/privacy' },
    ]);

    const webPageSchema = generateWebPageSchema({
        name: locale === 'ar' ? 'سياسة الخصوصية | نقطة' : 'Privacy Policy | Nuqta',
        description: locale === 'ar'
            ? 'سياسة الخصوصية لمنصة نقطة. تعرف على كيفية حماية بياناتك الشخصية.'
            : 'Privacy Policy for Nuqta. Learn how we protect your personal data.',
        url: `https://nuqta.ist/${locale}/privacy`,
        locale,
    });

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
            />
            <PrivacyPageClient />
        </>
    );
}
