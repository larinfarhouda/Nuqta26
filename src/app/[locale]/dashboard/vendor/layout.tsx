import { createClient } from '@/utils/supabase/server';
import { redirect } from '@/navigation';
import { getTranslations } from 'next-intl/server';
import LogoutButton from '@/components/auth/LogoutButton';

export default async function VendorDashboardLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const supabase = await createClient();
    const t = await getTranslations('Vendor');

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect({ href: '/login', locale });
        return null;
    }

    // Check role from profiles table (OAuth users don't have it in user_metadata)
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const role = profile?.role || user.user_metadata?.role;

    if (role !== 'vendor') {
        redirect({ href: '/', locale });
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden" dir="rtl">
            {/* Unified Background for Dashboard */}
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />
            <div className="absolute top-40 -right-20 w-96 h-96 bg-purple-100 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />

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
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none mt-0.5">بوابة المنظمين</span>
                        </div>
                    </div>

                    {/* User Profile Pill */}
                    <div className="flex items-center gap-4">
                        <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-gray-100/50 hover:bg-gray-100 text-gray-500 transition-colors relative">
                            <span className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                        </button>

                        <div className="flex items-center gap-3 pl-4 md:border-l border-gray-200">
                            <div className="flex items-center gap-3 bg-white/50 hover:bg-white pr-4 pl-1 py-1 rounded-full border border-gray-100 shadow-sm transition-all cursor-pointer group">
                                <div className="w-9 h-9 bg-gradient-to-br from-primary to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white group-hover:scale-105 transition-transform">
                                    {user?.email?.[0].toUpperCase()}
                                </div>
                                <div className="hidden md:flex flex-col text-right">
                                    <span className="text-xs font-bold text-gray-900 leading-tight">حساب المنظم</span>
                                    <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{user?.email}</span>
                                </div>
                            </div>
                            <LogoutButton variant="icon" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto p-4 md:p-8 relative z-10">
                {children}
            </main>
        </div>
    );
}
