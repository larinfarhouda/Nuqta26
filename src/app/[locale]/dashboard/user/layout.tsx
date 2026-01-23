import { createClient } from '@/utils/supabase/server';
import { redirect, Link } from '@/navigation';
import UserSidebar from '@/components/dashboard/UserSidebar';
import LogoutButton from '@/components/auth/LogoutButton';
import BottomNav from '@/components/layout/BottomNav';
import Image from 'next/image';

export default async function UserDashboardLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect({ href: '/login', locale });
        return null;
    }

    // Check role and redirect vendors
    let role = user.user_metadata?.role;
    if (!role) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        role = profile?.role;
    }

    if (role === 'vendor') {
        redirect({ href: '/dashboard/vendor', locale });
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden text-gray-900">
            {/* Background Blobs */}
            <div className="fixed -top-20 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />
            <div className="fixed top-40 -right-20 w-96 h-96 bg-purple-50 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm mb-6">
                <div className="container mx-auto px-6 h-20 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 relative bg-primary rounded-xl flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform overflow-hidden">
                            <Image src="/H-logo-removebg.png" alt="Nuqta Logo" fill className="object-contain p-1.5" />
                        </div>
                        <span className="font-black text-xl text-gray-900">Nuqta</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col text-right">
                            <span className="text-sm font-bold text-gray-500 leading-tight">{user.email}</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white">
                            {user.email?.[0]?.toUpperCase() ?? 'U'}
                        </div>
                        {/* Hide logout button on desktop as it's in the sidebar */}
                        <div className="lg:hidden">
                            <LogoutButton variant="icon" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 md:px-6 pb-12 relative z-10">
                <div className="flex flex-col lg:flex-row gap-8 items-start h-full">
                    {/* Sidebar */}
                    <div className="hidden lg:block sticky top-24 h-[calc(100vh-8rem)]">
                        <UserSidebar />
                    </div>

                    {/* Mobile Sidebar Trigger could go here */}

                    {/* Content */}
                    <div className="flex-1 w-full bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl min-h-[500px] p-6 md:p-8">
                        {children}
                    </div>
                </div>
            </main>

            <BottomNav isLoggedIn={true} role={role} />
        </div>
    );
}
