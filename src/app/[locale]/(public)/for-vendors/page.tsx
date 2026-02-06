import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import dynamic from 'next/dynamic';

const VendorHero = dynamic(() => import('@/components/vendor-landing/VendorHero'), {
    ssr: true,
    loading: () => <div className="h-screen w-full animate-pulse bg-gray-50" />
});

const VendorBenefits = dynamic(() => import('@/components/vendor-landing/VendorBenefits'), {
    ssr: true,
    loading: () => <div className="h-[600px] w-full animate-pulse bg-gray-50" />
});

const VendorTestimonials = dynamic(() => import('@/components/vendor-landing/VendorTestimonials'), {
    ssr: true,
    loading: () => <div className="h-[800px] w-full animate-pulse bg-gray-50" />
});

const VendorFAQ = dynamic(() => import('@/components/vendor-landing/VendorFAQ'), {
    ssr: true,
    loading: () => <div className="h-[600px] w-full animate-pulse bg-gray-50" />
});

const VendorPricing = dynamic(() => import('@/components/vendor-landing/VendorPricing'), {
    ssr: true,
    loading: () => <div className="h-[800px] w-full animate-pulse bg-gray-50" />
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
                    url: '/og-vendor.png',
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
            images: ['/og-vendor.png']
        },
        alternates: {
            canonical: `https://nuqta.ist/${locale}/for-vendors`,
            languages: {
                'ar': 'https://nuqta.ist/ar/for-vendors',
                'en': 'https://nuqta.ist/en/for-vendors'
            }
        }
    };
}

export default async function VendorLandingPage() {
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

            {/* Product Schema with Reviews */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Product',
                        name: 'Nuqta Event Management Platform',
                        description: 'Professional event management platform for Arab organizers in Turkey. Save 15 hours per event with full automation, bilingual system, and verified reviews.',
                        brand: {
                            '@type': 'Brand',
                            name: 'Nuqta'
                        },
                        offers: {
                            '@type': 'AggregateOffer',
                            priceCurrency: 'TRY',
                            lowPrice: '0',
                            highPrice: '1999',
                            offerCount: '3'
                        },
                        aggregateRating: {
                            '@type': 'AggregateRating',
                            ratingValue: '4.8',
                            reviewCount: '300',
                            bestRating: '5'
                        },
                        review: [
                            {
                                '@type': 'Review',
                                author: {
                                    '@type': 'Person',
                                    name: 'Sarah Al-Mansour'
                                },
                                reviewRating: {
                                    '@type': 'Rating',
                                    ratingValue: '5',
                                    bestRating: '5'
                                },
                                reviewBody: 'After using Nuqta for 3 months, attendance increased 40% and I save 15 hours per event.'
                            },
                            {
                                '@type': 'Review',
                                author: {
                                    '@type': 'Person',
                                    name: 'Muna Al-Kurdi'
                                },
                                reviewRating: {
                                    '@type': 'Rating',
                                    ratingValue: '5',
                                    bestRating: '5'
                                },
                                reviewBody: 'No-show rate dropped from 20% to 5%, revenue increased 65%. The bilingual system handles everything automatically.'
                            },
                            {
                                '@type': 'Review',
                                author: {
                                    '@type': 'Person',
                                    name: 'Laila Hassan'
                                },
                                reviewRating: {
                                    '@type': 'Rating',
                                    ratingValue: '5',
                                    bestRating: '5'
                                },
                                reviewBody: 'Got 4.9/5.0 rating from 85 verified attendees. My business grew beyond imagination with the verified reviews system.'
                            }
                        ]
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
                        name: 'How to Grow Your Event Attendance with Nuqta',
                        description: 'Step-by-step guide to automating your event management and growing attendance by over 127%',
                        totalTime: 'PT2M',
                        step: [
                            {
                                '@type': 'HowToStep',
                                position: 1,
                                name: 'Create Free Account',
                                text: 'Register for free in 2 minutes without credit card.'
                            },
                            {
                                '@type': 'HowToStep',
                                position: 2,
                                name: 'Create Your First Event',
                                text: 'Set up your event with bilingual descriptions, ticket types, and pricing.'
                            },
                            {
                                '@type': 'HowToStep',
                                position: 3,
                                name: 'Share Event Link',
                                text: 'Share your event with 5,000+ active Arab users in Turkey.'
                            },
                            {
                                '@type': 'HowToStep',
                                position: 4,
                                name: 'Automated Management',
                                text: 'System sends automatic bilingual confirmations and manages attendance. Save 15 hours per event.'
                            },
                            {
                                '@type': 'HowToStep',
                                position: 5,
                                name: 'Collect Verified Reviews',
                                text: 'Only real attendees can review. Build authentic reputation with 100% verified reviews.'
                            }
                        ]
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
