import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    // Check role from user metadata
    const role = user?.user_metadata?.role;

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar user={user} role={role} />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
            <BottomNav isLoggedIn={!!user} role={role} />
        </div>
    );
}
