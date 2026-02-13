import VendorDashboard from '@/components/dashboard/VendorDashboard';
import { getDemoVendorData, getDemoAnalytics, getDemoEvents } from '@/lib/demoData';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/navigation';

/**
 * Demo Vendor Dashboard Page
 * Allows prospective vendors to explore the dashboard with mock data
 * No authentication required
 * Now under (public) route group so it gets Navbar/Footer/BottomNav
 */
export default async function DemoVendorDashboardPage() {
    const t = await getTranslations('DemoVendor');
    const demoVendorData = getDemoVendorData();
    const demoAnalytics = getDemoAnalytics();
    const demoEvents = getDemoEvents();

    // Count active (published) events for demo
    const activeEventsCount = demoEvents.filter(e => e.status === 'published').length;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />
            <div className="absolute top-40 -right-20 w-96 h-96 bg-purple-100 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />

            {/* Demo Banner */}
            <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm">
                <div className="container mx-auto px-4 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full">
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                            <span className="text-xs font-bold text-amber-700">{t('demo_mode')}</span>
                        </div>
                    </div>
                    <Link
                        href="/register?role=vendor"
                        className="px-4 md:px-6 py-2 bg-primary text-white font-bold rounded-xl text-sm shadow-lg hover:bg-primary/90 transition-all"
                    >
                        {t('register_now')}
                    </Link>
                </div>
            </div>

            <main className="flex-1 container mx-auto p-4 md:p-8 relative z-10">
                <VendorDashboard
                    demoMode={true}
                    initialVendorData={demoVendorData}
                    initialPendingBookingsCount={demoAnalytics.pendingBookings}
                    initialActiveEventsCount={activeEventsCount}
                />
            </main>
        </div>
    );
}
