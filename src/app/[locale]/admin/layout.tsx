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
            <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
                <AdminSidebar locale={locale} userEmail={user.email || ''} />
                <main style={{ flex: 1, padding: '24px', overflow: 'auto', minWidth: 0 }}>
                    {children}
                </main>
            </div>
        </ToastProvider>
    );
}
