import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { BadgeCheck, MessageCircle, Star, MapPin } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/navigation';

export default async function VendorProfilePage({
    params
}: {
    params: Promise<{ id: string; locale: string }>;
}) {
    const { id, locale } = await params;
    const supabase = await createClient();
    const t = await getTranslations('Index'); // Using generic translations for now

    const { data: vendor } = await supabase
        .from('vendors')
        .select('*, profiles(*)')
        .eq('id', id)
        .single();

    if (!vendor || vendor.status !== 'approved') {
        // In real app, we might show suspended/pending message or 404
        // For now, if I'm the owner I should see it, but let's stick to public view
        // Assuming RLS allows viewing if approved.

        // Check if I am the owner to allow preview
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id !== id && vendor?.status !== 'approved') {
            return notFound();
        }
    }

    // Formatting WhatsApp
    const whatsappLink = vendor.whatsapp_number ? `https://wa.me/${vendor.whatsapp_number}` : '#';

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Hero / Cover */}
            <div className="h-48 md:h-64 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                <div className="absolute -bottom-16 left-4 md:left-8 flex items-end">
                    <div className="w-32 h-32 bg-white rounded-xl shadow-lg p-1 overflow-hidden">
                        {/* Avatar */}
                        <img
                            src={vendor.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${vendor.business_name}`}
                            alt={vendor.business_name}
                            className="w-full h-full object-cover rounded-lg"
                        />
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 pt-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                            {vendor.business_name}
                            {vendor.is_verified && (
                                <div className="group relative">
                                    <BadgeCheck className="w-6 h-6 text-blue-500 fill-blue-100" />
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                                        Official Verified Business
                                    </span>
                                </div>
                            )}
                        </h1>
                        <p className="text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-4 h-4" /> Istanbul, Turkey
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">{vendor.category}</span>
                        </div>
                    </div>

                    <div className="hidden md:block mt-4 md:mt-0">
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-lg">
                            <MessageCircle className="w-5 h-5" />
                            Contact on WhatsApp
                        </a>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <h2 className="text-xl font-bold mb-4">About</h2>
                            <p className="text-gray-700 leading-relaxed">
                                {vendor.description_ar || "No description provided."}
                            </p>
                        </div>

                        {/* Reviews Section (Gated) */}
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Reviews</h2>
                                <Link href="/login" className="text-blue-600 text-sm hover:underline">
                                    Write a Review
                                </Link>
                            </div>

                            {/* Mock Reviews */}
                            <div className="space-y-4">
                                {[1, 2].map(i => (
                                    <div key={i} className="border-b pb-4 last:border-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex text-yellow-400">
                                                {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                                            </div>
                                            <span className="text-sm text-gray-500">2 days ago</span>
                                        </div>
                                        <p className="text-gray-700">ممتازة جداً، أنصح بالتعامل معهم.</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <h3 className="font-bold mb-4">Opening Hours</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Monday - Friday</span>
                                    <span>09:00 - 18:00</span>
                                </div>
                                <div className="flex justify-between text-red-500">
                                    <span>Sunday</span>
                                    <span>Closed</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Bottom Bar (Mobile Only) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
                <a href={whatsappLink} className="block w-full bg-green-600 text-white text-center py-3 rounded-lg font-bold shadow flex items-center justify-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                </a>
            </div>
        </div>
    );
}
