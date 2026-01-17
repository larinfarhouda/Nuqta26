import VendorHero from '@/components/vendor-landing/VendorHero';
import VendorBenefits from '@/components/vendor-landing/VendorBenefits';
import VendorPricing from '@/components/vendor-landing/VendorPricing';
import VendorTestimonials from '@/components/vendor-landing/VendorTestimonials';

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
