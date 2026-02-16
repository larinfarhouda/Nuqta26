import { Metadata } from 'next';
import ContactPageClient from './ContactPageClient';
import { generateLocaleBreadcrumbSchema, generateWebPageSchema, generateSpeakableSchema } from '@/lib/seo';

type Props = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;

    const title = locale === 'ar' ? 'تواصل معنا' : 'Contact Us';
    const description = locale === 'ar'
        ? 'تواصل مع فريق نقطة. نحن هنا لمساعدتك في أي استفسارات حول الفعاليات والتذاكر في اسطنبول.'
        : 'Get in touch with the Nuqta team. We are here to help with any questions about events and ticketing in Istanbul.';

    return {
        title,
        description,
        alternates: {
            canonical: `https://nuqta.ist/${locale}/contact`,
            languages: {
                'ar': 'https://nuqta.ist/ar/contact',
                'en': 'https://nuqta.ist/en/contact',
                'x-default': 'https://nuqta.ist/ar/contact',
            },
        },
        openGraph: {
            title,
            description,
            url: `https://nuqta.ist/${locale}/contact`,
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

export default async function ContactPage({ params }: Props) {
    const { locale } = await params;

    const breadcrumbSchema = generateLocaleBreadcrumbSchema(locale, [
        { name: locale === 'ar' ? 'الرئيسية' : 'Home', path: '' },
        { name: locale === 'ar' ? 'تواصل معنا' : 'Contact Us', path: '/contact' },
    ]);

    const contactPageSchema = {
        ...generateWebPageSchema({
            name: locale === 'ar' ? 'تواصل معنا | نقطة' : 'Contact Us | Nuqta',
            description: locale === 'ar'
                ? 'تواصل مع فريق نقطة. نحن هنا لمساعدتك في أي استفسارات حول الفعاليات والتذاكر في اسطنبول.'
                : 'Get in touch with the Nuqta team. We are here to help with any questions about events and ticketing in Istanbul.',
            url: `https://nuqta.ist/${locale}/contact`,
            locale,
            type: 'ContactPage',
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
                dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
            />
            <ContactPageClient />
        </>
    );
}
