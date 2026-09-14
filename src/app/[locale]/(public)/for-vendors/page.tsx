import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import dynamic from 'next/dynamic';
import { getRequestCountry } from '@/lib/request-country';
import { getCountryPrices } from '@/lib/country-selection';
import { generateLocaleBreadcrumbSchema } from '@/lib/seo';

const VendorHero = dynamic(() => import('@/components/vendor-landing/VendorHero'), {
    loading: () => <div className="h-[70vh] w-full animate-pulse bg-[#fffdfa]" />
});

const VendorLogoStrip = dynamic(() => import('@/components/vendor-landing/VendorLogoStrip'), {
    loading: () => <div className="h-24 w-full animate-pulse bg-[#fffcf9]" />
});

const VendorPainPoints = dynamic(() => import('@/components/vendor-landing/VendorPainPoints'), {
    loading: () => <div className="h-[500px] w-full animate-pulse bg-[#fffcf9]" />
});

const VendorHowItWorks = dynamic(() => import('@/components/vendor-landing/VendorHowItWorks'), {
    loading: () => <div className="h-[400px] w-full animate-pulse bg-white" />
});




const VendorFAQ = dynamic(() => import('@/components/vendor-landing/VendorFAQ'), {
    loading: () => <div className="h-[600px] w-full animate-pulse bg-gray-50" />
});

const VendorPricing = dynamic(() => import('@/components/vendor-landing/VendorPricing'), {
    loading: () => <div className="h-[600px] w-full animate-pulse bg-gray-50" />
});

const VendorLeadCapture = dynamic(() => import('@/components/vendor-landing/VendorLeadCapture'), {
    loading: () => <div className="h-[400px] w-full animate-pulse bg-[#f0faf7]" />
});

const VendorFinalCTA = dynamic(() => import('@/components/vendor-landing/VendorFinalCTA'), {
    loading: () => <div className="h-[300px] w-full animate-pulse bg-[#264653]" />
});

type Props = {
    params: Promise<{
        locale: string;
    }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'VendorLanding.SEO' });

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        openGraph: {
            title: t('og_title'),
            description: t('og_description'),
            images: [
                {
                    url: 'https://nuqta.ist/og-vendor.png',
                    width: 1200,
                    height: 630,
                    alt: t('og_image_alt')
                }
            ],
            type: 'website',
            locale: locale === 'ar' ? 'ar' : 'en_US'
        },
        twitter: {
            card: 'summary_large_image',
            title: t('twitter_title'),
            description: t('twitter_description'),
            images: ['https://nuqta.ist/og-vendor.png']
        },
        alternates: {
            canonical: `https://nuqta.ist/${locale}/for-vendors`,
            languages: {
                'ar': 'https://nuqta.ist/ar/for-vendors',
                'en': 'https://nuqta.ist/en/for-vendors',
                'x-default': 'https://nuqta.ist/ar/for-vendors',
            }
        }
    };
}

export default async function VendorLandingPage({ params }: Props) {
    const { locale } = await params;

    const { country } = await getRequestCountry();
    const prices = country ? getCountryPrices(country) : null;
    const breadcrumbSchema = generateLocaleBreadcrumbSchema(locale, [
        { name: locale === 'ar' ? 'الرئيسية' : 'Home', path: '' },
        { name: locale === 'ar' ? 'للمنظمين' : 'For Vendors', path: '/for-vendors' },
    ]);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                '@context': 'https://schema.org', '@type': 'SoftwareApplication',
                name: 'Nuqta', applicationCategory: 'BusinessApplication', operatingSystem: 'Web',
                description: 'Event pages, registrations and guest management for local organizers.',
                ...(country && prices ? { offers: Object.entries(prices).map(([name, price]) => ({
                    '@type': 'Offer', name, price: price.monthly, priceCurrency: country.currency_code,
                })), areaServed: { '@type': 'Country', name: country.name_en } } : {}),
            }).replace(/</g, '\u003c') }} />
            <main>
                <VendorHero />
                <VendorLogoStrip />
                <VendorPainPoints />
                <VendorHowItWorks />
                <VendorPricing />
                <VendorLeadCapture />
                <VendorFAQ />
                <VendorFinalCTA />
            </main>
        </>
    );
}
