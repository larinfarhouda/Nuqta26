import VendorHero from '@/components/vendor-landing/VendorHero';
import dynamic from 'next/dynamic';

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

export default function VendorLandingPage() {
    return (
        <main className="min-h-screen bg-white">
            <VendorHero />
            <VendorBenefits />
            <VendorTestimonials />
            <VendorPricing />
        </main>
    );
}
