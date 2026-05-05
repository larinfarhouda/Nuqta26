import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import dynamic from 'next/dynamic';
import { generateLocaleBreadcrumbSchema } from '@/lib/seo';

const VendorHero = dynamic(() => import('@/components/vendor-landing/VendorHero'), {
    loading: () => <div className="h-[70vh] w-full animate-pulse bg-gray-950" />
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



const VendorTestimonials = dynamic(() => import('@/components/vendor-landing/VendorTestimonials'), {
    loading: () => <div className="h-[600px] w-full animate-pulse bg-[#fffcf9]" />
});

const VendorFAQ = dynamic(() => import('@/components/vendor-landing/VendorFAQ'), {
    loading: () => <div className="h-[600px] w-full animate-pulse bg-gray-50" />
});

const VendorPricing = dynamic(() => import('@/components/vendor-landing/VendorPricing'), {
    loading: () => <div className="h-[600px] w-full animate-pulse bg-gray-50" />
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
            locale: locale === 'ar' ? 'ar_TR' : 'en_US'
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
                                name: 'Free Plan',
                                price: '0',
                                priceCurrency: 'TRY',
                                description: 'Up to 3 active events with full automation, bilingual emails, and custom landing page'
                            },
                            {
                                '@type': 'Offer',
                                name: 'Pro Plan',
                                price: '299',
                                priceCurrency: 'TRY',
                                description: 'Unlimited events, verified badge, discount codes, CRM, and advanced analytics'
                            },
                            {
                                '@type': 'Offer',
                                name: 'Business Plan',
                                price: '499',
                                priceCurrency: 'TRY',
                                description: 'Everything in Pro plus dedicated account manager and priority WhatsApp support'
                            }
                        ],
                        description: 'Professional event management platform for organizers. Automated bilingual bookings, verified reviews, and comprehensive event tools.',
                        featureList: [
                            'Automated bilingual email notifications (Arabic/English)',
                            'Advanced dashboard for performance and sales analytics',
                            'Professional customer and attendance list management',
                            'Discount coupons and group offers',
                            'Multiple ticket types',
                            'Unlimited photo gallery',
                            'Custom public page',
                            'One-tap social media sharing with branded event cards',
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
                        description: 'Event management platform for organizers',
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

            {/* Product Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Product',
                        name: 'Nuqta Event Management Platform',
                        description: 'Professional event management platform for organizers. Save 14+ hours per event with full automation, bilingual system, and verified reviews.',
                        brand: {
                            '@type': 'Brand',
                            name: 'Nuqta'
                        },
                        offers: {
                            '@type': 'AggregateOffer',
                            priceCurrency: 'TRY',
                            lowPrice: '0',
                            highPrice: '499',
                            offerCount: '3'
                        }
                    })
                }}
            />

            {/* Service Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Service',
                        serviceType: 'Event Management Software',
                        provider: {
                            '@type': 'Organization',
                            name: 'Nuqta'
                        },
                        areaServed: {
                            '@type': 'Country',
                            name: 'Turkey'
                        },
                        audience: {
                            '@type': 'Audience',
                            audienceType: 'Arab Event Organizers in Turkey'
                        }
                    })
                }}
            />

            {/* HowTo Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'HowTo',
                        name: 'How to Automate Your Event Management with Nuqta',
                        description: 'Step-by-step guide to automating your event management and saving 14+ hours per event',
                        totalTime: 'PT2M',
                        step: [
                            {
                                '@type': 'HowToStep',
                                position: 1,
                                name: 'Create Free Account',
                                text: 'Register for free in 2 minutes. No credit card required.'
                            },
                            {
                                '@type': 'HowToStep',
                                position: 2,
                                name: 'Create Your First Event',
                                text: 'Set up your event with bilingual descriptions, ticket types, and pricing. Your professional event page goes live instantly.'
                            },
                            {
                                '@type': 'HowToStep',
                                position: 3,
                                name: 'Share With Your Audience',
                                text: 'Use auto-generated branded share cards and bilingual captions to promote on Instagram, WhatsApp, and Facebook in one tap.'
                            },
                            {
                                '@type': 'HowToStep',
                                position: 4,
                                name: 'Let Automation Handle the Rest',
                                text: 'Bilingual confirmations, reminders, and attendance tracking run automatically. Save 14+ hours per event.'
                            },
                            {
                                '@type': 'HowToStep',
                                position: 5,
                                name: 'Grow With Verified Reviews',
                                text: 'Only real attendees can review. Build authentic reputation and trust that drives repeat bookings.'
                            }
                        ]
                    })
                }}
            />

            <main className="min-h-screen bg-white">
                <VendorHero />
                <VendorLogoStrip />
                <VendorPainPoints />
                <VendorHowItWorks />
                <VendorPricing />
                <VendorTestimonials />
                <VendorFAQ />
                <VendorFinalCTA />
            </main>
        </>
    );
}
