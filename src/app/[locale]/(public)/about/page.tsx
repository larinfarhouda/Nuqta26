import { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

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
    };
}

export default function AboutPage() {
    return <AboutPageClient />;
}
