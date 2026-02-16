import { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';
import { generateLocaleBreadcrumbSchema, generateWebPageSchema, generateSpeakableSchema } from '@/lib/seo';

type Props = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;

    const title = locale === 'ar' ? 'من نحن' : 'About Us';
    const description = locale === 'ar'
        ? 'تعرف على نقطة - المنصة الرقمية للفعاليات والتذاكر في مجتمع اسطنبول العربي.'
        : 'Learn about Nuqta - the digital marketplace for events and ticketing in Istanbul\'s Arabic-speaking community.';

    return {
        title,
        description,
        alternates: {
            canonical: `https://nuqta.ist/${locale}/about`,
            languages: {
                'ar': 'https://nuqta.ist/ar/about',
                'en': 'https://nuqta.ist/en/about',
                'x-default': 'https://nuqta.ist/ar/about',
            },
        },
        openGraph: {
            title,
            description,
            url: `https://nuqta.ist/${locale}/about`,
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

export default async function AboutPage({ params }: Props) {
    const { locale } = await params;

    const breadcrumbSchema = generateLocaleBreadcrumbSchema(locale, [
        { name: locale === 'ar' ? 'الرئيسية' : 'Home', path: '' },
        { name: locale === 'ar' ? 'من نحن' : 'About Us', path: '/about' },
    ]);

    const webPageSchema = {
        ...generateWebPageSchema({
            name: locale === 'ar' ? 'من نحن | نقطة' : 'About Us | Nuqta',
            description: locale === 'ar'
                ? 'تعرف على نقطة - المنصة الرقمية للفعاليات والتذاكر في مجتمع اسطنبول العربي.'
                : 'Learn about Nuqta - the digital marketplace for events and ticketing in Istanbul\'s Arabic-speaking community.',
            url: `https://nuqta.ist/${locale}/about`,
            locale,
            type: 'AboutPage',
        }),
        mainEntity: {
            '@type': 'Organization',
            '@id': 'https://nuqta.ist/#organization',
        },
        speakable: generateSpeakableSchema(),
    };

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
            <AboutPageClient />
        </>
    );
}
