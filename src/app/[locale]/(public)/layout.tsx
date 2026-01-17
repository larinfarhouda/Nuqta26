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

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar user={user} />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
            <BottomNav isLoggedIn={!!user} />
        </div>
    );
}
