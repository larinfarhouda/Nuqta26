import { Metadata } from 'next';
import ContactPageClient from './ContactPageClient';

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
    };
}

export default function ContactPage() {
    return <ContactPageClient />;
}
