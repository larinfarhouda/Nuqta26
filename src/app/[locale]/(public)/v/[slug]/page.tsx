import { getPublicVendor } from '@/actions/public/vendors';
import VendorProfileClient from '@/components/vendor/VendorProfileClient';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { trackPageView } from '@/actions/public/track';
import { getDemoVendorData, DEMO_VENDOR_SLUG, getDemoEvents, getDemoGallery } from '@/lib/demoData';
import {
    generateCanonicalUrl,
    generateLanguageAlternates,
    createVendorDescription,
    generateImageUrl
} from '@/lib/seo';

export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
    const { slug, locale } = await params;

    // Handle demo vendor
    if (slug === DEMO_VENDOR_SLUG) {
        const demoVendor = getDemoVendorData();
        const description = createVendorDescription(demoVendor);
        const canonicalUrl = generateCanonicalUrl(`v/${slug}`, locale || 'en');
        const alternates = generateLanguageAlternates(`v/${slug}`);
        const imageUrl = generateImageUrl(demoVendor.company_logo);

        return {
            title: `${demoVendor.business_name} | Nuqta`,
            description,
            alternates: {
                canonical: canonicalUrl,
                languages: Object.fromEntries(
                    alternates.map(alt => [alt.hreflang, alt.href])
                ),
            },
            openGraph: {
                type: 'profile',
                title: demoVendor.business_name,
                description,
                images: [{ url: imageUrl, width: 1200, height: 630, alt: demoVendor.business_name }],
                url: canonicalUrl,
                siteName: 'Nuqta',
            },
            twitter: {
                card: 'summary_large_image',
                title: demoVendor.business_name,
                description,
                images: [imageUrl],
            },
        };
    }

    const vendor = await getPublicVendor(slug);

    if (!vendor) {
        return {
            title: 'Vendor Not Found',
        };
    }

    const description = createVendorDescription(vendor);
    const canonicalUrl = generateCanonicalUrl(`v/${slug}`, locale || 'en');
    const alternates = generateLanguageAlternates(`v/${slug}`);
    const imageUrl = generateImageUrl(vendor.company_logo);

    return {
        title: `${vendor.business_name} | Nuqta`,
        description,
        alternates: {
            canonical: canonicalUrl,
            languages: Object.fromEntries(
                alternates.map(alt => [alt.hreflang, alt.href])
            ),
        },
        openGraph: {
            type: 'profile',
            title: vendor.business_name,
            description,
            images: [{ url: imageUrl, width: 1200, height: 630, alt: vendor.business_name }],
            url: canonicalUrl,
            siteName: 'Nuqta',
        },
        twitter: {
            card: 'summary_large_image',
            title: vendor.business_name,
            description,
            images: [imageUrl],
        },
    };
}

export default async function VendorProfilePage({ params }: { params: any }) {
    const { slug } = await params;

    // Handle demo vendor
    if (slug === DEMO_VENDOR_SLUG) {
        const vendor = getDemoVendorData();
        const demoEvents = getDemoEvents().filter(e => e.status === 'published'); // Only show published events
        const demoGallery = getDemoGallery();

        // Attach events and gallery to vendor object
        const vendorWithData = {
            ...vendor,
            events: demoEvents,
            gallery: demoGallery
        };

        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: vendor.business_name,
            image: vendor.company_logo,
            description: vendor.description_ar,
            url: `https://nuqta.ist/v/${slug}`,
            telephone: vendor.whatsapp_number,
            address: {
                '@type': 'PostalAddress',
                addressLocality: 'Istanbul',
                addressCountry: 'TR'
            },
            geo: vendor.location_lat && vendor.location_long ? {
                '@type': 'GeoCoordinates',
                latitude: vendor.location_lat,
                longitude: vendor.location_long
            } : undefined,
        };

        return (
            <>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
                <VendorProfileClient vendor={vendorWithData} />
            </>
        );
    }

    const vendor = await getPublicVendor(slug);

    if (!vendor) return notFound();

    // Track page view (fire-and-forget)
    trackPageView('vendor', vendor.id, { slug, businessName: vendor.business_name });

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: vendor.business_name,
        image: vendor.company_logo,
        description: vendor.description_ar,
        url: `https://nuqta.ist/v/${slug}`,
        telephone: vendor.whatsapp_number,
        address: {
            '@type': 'PostalAddress',
            addressLocality: (vendor as any).district || 'Istanbul',
            addressCountry: 'TR'
        },
        geo: vendor.location_lat && vendor.location_long ? {
            '@type': 'GeoCoordinates',
            latitude: vendor.location_lat,
            longitude: vendor.location_long
        } : undefined,
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <VendorProfileClient vendor={vendor} />
        </>
    );
}
