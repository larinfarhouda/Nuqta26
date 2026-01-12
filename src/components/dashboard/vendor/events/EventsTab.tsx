'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Users, Activity, Trash2, Edit3 } from 'lucide-react';
import { getVendorEvents, deleteEvent } from '@/actions/vendor/events';
import EventForm from './EventForm';

export default function EventsTab({ vendorData }: { vendorData?: any }) {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any>(null);

    const loadEvents = async () => {
        setLoading(true);
        const data = await getVendorEvents();
        setEvents(data);
        setLoading(false);
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الفعالية؟')) return;
        const res = await deleteEvent(id);
        if (res.success) {
            setEvents(prev => prev.filter(e => e.id !== id));
        } else {
            alert('خطأ أثناء الحذف');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">الفعاليات</h3>
                    <p className="text-sm text-gray-500">قم بإدارة فعالياتك وتتبع المبيعات</p>
                </div>
                <button
                    onClick={() => { setEditingEvent(null); setIsFormOpen(true); }}
                    className="bg-primary text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:shadow-lg shadow-primary/20 transition-all"
                >
                    <Plus className="w-4 h-4" /> فعالية جديدة
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">جاري التحميل...</div>
            ) : (
                <div className="grid gap-4">
                    {events.map(event => (
                        <div key={event.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative group overflow-hidden">
                            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                                <div className="flex gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center text-primary font-bold text-xl uppercase">
                                        {event.title[0]}
                                    </div>
                                    <div>
                                        <div className="flex gap-2 mb-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${event.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {event.status === 'published' ? 'منشور' : 'مسودة'}
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                                {event.event_type || 'عام'}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-lg line-clamp-1">{event.title}</h4>
                                        <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(event.date).toLocaleDateString('ar-EG')}</span>
                                            {event.location_name && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location_name}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 border-t lg:border-t-0 pt-4 lg:pt-0">
                                    <div className="text-center">
                                        <div className="text-xs text-gray-400">التذاكر</div>
                                        <div className="font-bold text-gray-800">{event.tickets?.[0]?.sold || 0} / {event.tickets?.[0]?.quantity || '-'}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-400">السعة</div>
                                        <div className="font-bold text-gray-800">{event.capacity || '-'}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleDelete(event.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-lg">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => { setEditingEvent(event); setIsFormOpen(true); }} className="p-2 text-primary hover:bg-primary/10 transition-colors bg-gray-50 rounded-lg">
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {events.length === 0 && (
                        <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <Activity className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm font-bold text-gray-500">لا توجد فعاليات قادمة</p>
                        </div>
                    )}
                </div>
            )}

            {isFormOpen && (
                <EventForm
                    event={editingEvent}
                    vendorData={vendorData}
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={() => { setIsFormOpen(false); loadEvents(); }}
                />
            )}
        </div>
    );
}
