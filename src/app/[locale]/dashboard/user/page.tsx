import { getUserBookings } from '@/actions/user';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/navigation';
import BookingPaymentDialog from '@/components/dashboard/user/BookingPaymentDialog';

import { getTranslations } from 'next-intl/server';

export default async function UserOverviewPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const bookings = await getUserBookings();
    const t = await getTranslations('Dashboard.user');

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-xl">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900">{t('my_registrations')}</h1>
                </div>

                <form action={async () => {
                    'use server';
                    // Inline server action to keep it simple or import it
                    // Since I created a file, I should use it, but for client import we need a client component or pass server action.
                    // This is a server component page, so I can import server action directly.
                    const { signOut } = await import('@/actions/auth');
                    await signOut();
                }}>
                    <button className="px-4 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition shadow-sm border border-red-100">
                        {t('sign_out')}
                    </button>
                </form>
            </div>

            {bookings.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-bold text-gray-500">{t('no_registrations')}</p>
                    <p className="text-sm text-gray-400">{t('browse_events')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {bookings.map((booking: any) => (
                        <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6 flex flex-col md:flex-row gap-6 shadow-sm hover:shadow-md transition-shadow">
                            {/* Event Image */}
                            <div className="w-full md:w-48 h-32 bg-gray-100 rounded-xl relative overflow-hidden flex-shrink-0">
                                {booking.event?.image_url ? (
                                    <Image src={booking.event.image_url} alt="Event" fill className="object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-xs text-gray-400">{t('no_image')}</div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{booking.event?.title}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {t(`status.${booking.status}`)}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-1 text-sm text-gray-500 mb-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(booking.event?.date).toLocaleDateString(locale)} at {new Date(booking.event?.date).toLocaleTimeString(locale)}</span>
                                        </div>
                                        {booking.event?.location_name && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                <span>{booking.event.location_name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-4 border-t border-gray-50 mt-auto">
                                    <div className="text-xs text-gray-400">
                                        {t('booking_id')}: <span className="font-mono">{booking.id.slice(0, 8)}</span>
                                    </div>
                                    <div className="ml-auto flex items-center gap-4">
                                        {booking.status === 'pending_payment' && (
                                            <BookingPaymentDialog booking={booking} />
                                        )}
                                        <Link href={`/events/${booking.event_id}`} className="text-sm font-bold text-primary hover:underline">
                                            {t('view_details')}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
