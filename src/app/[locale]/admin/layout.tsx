import { createClient } from '@/utils/supabase/server';
import { redirect } from '@/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { ToastProvider } from '@/components/ui/Toast';

export default async function AdminLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect({ href: '/login', locale });
        return null;
    }

    if (!user.id) return null;

    // Check role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        redirect({ href: '/', locale });
    }

    return (
        <ToastProvider>
            <div className="flex min-h-screen bg-zinc-50" style={{ colorScheme: 'light' }}>
                <AdminSidebar locale={locale} userEmail={user.email || ''} />
                <main className="flex-1 p-6 overflow-auto min-w-0">
                    {children}
                </main>
            </div>
        </ToastProvider>
    );
}
