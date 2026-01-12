import { createClient } from '@/utils/supabase/server';
import { redirect } from '@/navigation';

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
        redirect({ href: '/login', locale }); // Or a specific admin login
        return null; // Ensure TS knows execution stops here (or we return early)
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
        <div className="min-h-screen bg-gray-100 p-8">
            <header className="mb-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Admin Control Tower</h1>
                <div className="text-sm">{user.email}</div>
            </header>
            <main>
                {children}
            </main>
        </div>
    );
}
