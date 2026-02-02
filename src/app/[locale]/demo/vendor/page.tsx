import VendorDashboard from '@/components/dashboard/VendorDashboard';
import { getDemoVendorData, getDemoAnalytics, getDemoEvents } from '@/lib/demoData';

/**
 * Demo Vendor Dashboard Page
 * Allows prospective vendors to explore the dashboard with mock data
 * No authentication required
 */
export default function DemoVendorDashboardPage() {
    const demoVendorData = getDemoVendorData();
    const demoAnalytics = getDemoAnalytics();
    const demoEvents = getDemoEvents();

    // Count active (published) events for demo
    const activeEventsCount = demoEvents.filter(e => e.status === 'published').length;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden" dir="rtl">
            {/* Unified Background for Dashboard */}
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />
            <div className="absolute top-40 -right-20 w-96 h-96 bg-purple-100 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />

            {/* Demo Header (simpler than authenticated header) */}
            <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm transition-all duration-300">
                <div className="container mx-auto px-4 h-20 flex justify-between items-center">
                    {/* Logo Area */}
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center">
                            <img
                                src="/nuqta_logo_transparent.png"
                                alt="Nuqta Logo"
                                className="w-full h-full object-contain drop-shadow-sm"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-xl leading-none text-gray-900 tracking-tight">Nuqta</span>
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none mt-0.5">وضع التجربة</span>
                        </div>
                    </div>

                    {/* Demo Badge */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full">
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                            <span className="text-xs font-bold text-amber-700">Demo Mode</span>
                        </div>
                        <a
                            href="/register?role=vendor"
                            className="px-4 md:px-6 py-2 bg-primary text-white font-bold rounded-xl text-sm shadow-lg hover:bg-primary/90 transition-all"
                        >
                            سجل الآن
                        </a>
                    </div>
                </div>
            </header>

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
