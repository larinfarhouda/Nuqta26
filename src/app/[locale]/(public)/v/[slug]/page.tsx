
import { getPublicVendor } from '@/actions/public/vendors';
import VendorProfileClient from '@/components/vendor/VendorProfileClient';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
    const { slug } = await params;
    const vendor = await getPublicVendor(slug);

    if (!vendor) {
        return {
            title: 'Vendor Not Found',
        };
    }

    return {
        title: `${vendor.business_name} | Nuqta`,
        description: vendor.description_ar?.substring(0, 160) || 'Discover this amazing organizer on Nuqta.',
        openGraph: {
            title: vendor.business_name,
            description: vendor.description_ar?.substring(0, 160),
            images: vendor.company_logo ? [vendor.company_logo] : [],
        },
    };
}

export default async function VendorProfilePage({ params }: { params: any }) {
    const { slug } = await params;
    const vendor = await getPublicVendor(slug);

    if (!vendor) return notFound();

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
