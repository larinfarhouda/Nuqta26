import { getPublicEvent } from '@/actions/public/events';
import EventBookingForm from '@/components/events/EventBookingForm';
import { Calendar, MapPin, Share2, Clock } from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';

export default async function EventPage({ params }: { params: { id: string } }) {
    const event = await getPublicEvent(params.id);

    if (!event) return notFound();

    return (
        <div className="min-h-screen bg-gray-50/50 pb-24" dir="rtl">
            {/* Hero Image */}
            <div className="relative h-[40vh] lg:h-[50vh] w-full bg-gray-200">
                {event.image_url ? (
                    <Image src={event.image_url} alt={event.title} fill className="object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
                        <span className="text-4xl font-bold opacity-20">NO IMAGE</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                <div className="absolute bottom-0 left-0 w-full p-6 lg:p-12 text-white">
                    <div className="max-w-6xl mx-auto">
                        <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-bold rounded-full mb-4">
                            {event.event_type || 'فعالية'}
                        </span>
                        <h3 className="text-3xl lg:text-5xl font-black mb-4 leading-tight max-w-2xl">{event.title}</h3>

                        {/* Recurrence Badge */}
                        {event.is_recurring && (
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl mb-4 text-white font-bold text-sm">
                                <Clock className="w-4 h-4" />
                                <span>
                                    فعالية متكررة: {event.recurrence_type === 'custom' ? 'أيام محددة' : event.recurrence_type}
                                    {event.recurrence_days && ` (${JSON.parse(event.recurrence_days || '[]').map((d: string) => ({ sun: 'الأحد', mon: 'الاثنين', tue: 'الثلاثاء', wed: 'الأربعاء', thu: 'الخميس', fri: 'الجمعة', sat: 'السبت' }[d] || d)).join('، ')})`}
                                </span>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-6 text-sm lg:text-base font-medium opacity-90">
                            <span className="flex items-center gap-2"><Calendar className="w-5 h-5" /> {new Date(event.date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            {event.location_name && <span className="flex items-center gap-2"><MapPin className="w-5 h-5" /> {event.location_name}</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 -mt-8 relative z-10 grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Description */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">حول الفعالية</h2>
                        <div className="prose prose-lg text-gray-600 leading-relaxed whitespace-pre-line">
                            {event.description || 'لا يوجد وصف متاح.'}
                        </div>
                    </div>

                    {/* Map Section */}
                    {event.location_lat && event.location_long && (
                        <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 overflow-hidden">
                            <iframe
                                width="100%"
                                height="400"
                                style={{ border: 0, borderRadius: '1.5rem' }}
                                loading="lazy"
                                allowFullScreen
                                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${event.location_lat},${event.location_long}`}>
                            </iframe>
                            <div className="p-4 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-900 text-lg">الموقع</p>
                                    <p className="text-gray-500 text-sm">{event.location_name || 'احداثيات موضحة على الخريطة'}</p>
                                </div>
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${event.location_lat},${event.location_long}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
                                >
                                    اتجاهات القيادة
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Vendor Info */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden relative border border-gray-200">
                            {event.vendors?.company_logo && <Image src={event.vendors.company_logo} alt="Vendor" fill className="object-cover" />}
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">منظم الفعالية</p>
                            <h3 className="text-xl font-bold text-gray-900">{event.vendors?.business_name || 'غير معروف'}</h3>
                        </div>
                    </div>
                </div>

                {/* Booking Sidebar */}
                <div className="relative">
                    <EventBookingForm event={event} tickets={event.tickets || []} />
                </div>
            </div>
        </div>
    );
}
