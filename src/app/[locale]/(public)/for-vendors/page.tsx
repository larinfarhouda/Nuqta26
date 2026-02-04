import VendorHero from '@/components/vendor-landing/VendorHero';
import dynamic from 'next/dynamic';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

// Dynamic imports for below-fold content
const VendorBenefits = dynamic(() => import('@/components/vendor-landing/VendorBenefits'), {
    loading: () => <div className="h-96 bg-white animate-pulse" />
});

const VendorTestimonials = dynamic(() => import('@/components/vendor-landing/VendorTestimonials'), {
    loading: () => <div className="h-96 bg-[#fffcf9] animate-pulse" />
});

const VendorPricing = dynamic(() => import('@/components/vendor-landing/VendorPricing'), {
    loading: () => <div className="h-96 bg-[#fffcf9] animate-pulse" />
});

const VendorFAQ = dynamic(() => import('@/components/vendor-landing/VendorFAQ'), {
    loading: () => <div className="h-96 bg-gray-50 animate-pulse" />
});

// SEO Metadata
export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'VendorLanding.SEO' });

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords').split(', '),
        alternates: {
            canonical: `https://nuqta.ist/${locale}/for-vendors`,
            languages: {
                'en': 'https://nuqta.ist/en/for-vendors',
                'ar': 'https://nuqta.ist/ar/for-vendors',
                'x-default': 'https://nuqta.ist/en/for-vendors'
            }
        },
        openGraph: {
            title: t('og_title'),
            description: t('og_description'),
            url: `https://nuqta.ist/${locale}/for-vendors`,
            type: 'website',
            images: [{
                url: '/images/og-vendor-landing.jpg',
                width: 1200,
                height: 630,
                alt: t('og_image_alt')
            }],
            locale: locale === 'ar' ? 'ar_AR' : 'en_US',
            siteName: 'Nuqta',
        },
        twitter: {
            card: 'summary_large_image',
            title: t('twitter_title'),
            description: t('twitter_description'),
            images: ['/images/og-vendor-landing.jpg'],
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
    };
}

export default function VendorLandingPage() {
    return (
        <>
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'SoftwareApplication',
                        name: 'Nuqta',
                        applicationCategory: 'BusinessApplication',
                        operatingSystem: 'Web',
                        offers: [
                            {
                                '@type': 'Offer',
                                name: 'Starter Plan',
                                price: '0',
                                priceCurrency: 'TRY',
                                description: 'Free plan with 1 event'
                            },
                            {
                                '@type': 'Offer',
                                name: 'Growth Plan',
                                price: '999',
                                priceCurrency: 'TRY',
                                description: 'For active organizers with 3 events per month'
                            },
                            {
                                '@type': 'Offer',
                                name: 'Professional Plan',
                                price: '1999',
                                priceCurrency: 'TRY',
                                description: 'Unlimited events for large organizations'
                            }
                        ],
                        aggregateRating: {
                            '@type': 'AggregateRating',
                            ratingValue: '4.8',
                            ratingCount: '300',
                            bestRating: '5',
                            worstRating: '1'
                        },
                        description: 'Professional event management platform for Arab organizers in Turkey. Automated bilingual bookings, verified reviews, and comprehensive event tools.',
                        featureList: [
                            'Automated bilingual email notifications (Arabic/English)',
                            'Advanced dashboard for performance and sales analytics',
                            'Professional customer and attendance list management',
                            'Discount coupons and group offers',
                            'Multiple ticket types',
                            'Unlimited photo gallery',
                            'Custom public page',
                            'Priority technical support'
                        ],
                        inLanguage: ['en', 'ar'],
                        availableLanguage: ['English', 'Arabic'],
                    })
                }}
            />

            {/* Organization Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Organization',
                        name: 'Nuqta',
                        url: 'https://nuqta.ist',
                        logo: 'https://nuqta.ist/icon0.svg',
                        description: 'Turkey\'s first event management platform dedicated to the Arab community',
                        address: {
                            '@type': 'PostalAddress',
                            addressCountry: 'TR',
                            addressLocality: 'Istanbul'
                        },
                        sameAs: [
                            'https://twitter.com/nuqta_ist'
                        ],
                        contactPoint: {
                            '@type': 'ContactPoint',
                            contactType: 'Customer Support',
                            availableLanguage: ['English', 'Arabic']
                        }
                    })
                }}
            />

            <main className="min-h-screen bg-white">
                <VendorHero />
                <VendorBenefits />
                <VendorTestimonials />
                <VendorFAQ />
                <VendorPricing />
            </main>
        </>
    );
}
