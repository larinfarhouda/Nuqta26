'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Mail, Calendar, Award } from 'lucide-react';
import { getVendorCustomers } from '@/actions/vendor/bookings';

export default function CustomersTab() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await getVendorCustomers();
            setCustomers(data);
            setLoading(false);
        };
        load();
    }, []);

    const filtered = customers.filter(c =>
        c.name.includes(filter) || c.email?.includes(filter)
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">العملاء</h3>
                    <p className="text-sm text-gray-500">قائمة عملائك وتاريخ حجوزاتهم</p>
                </div>
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="بحث بالاسم أو البريد..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ring-primary/20 w-full lg:w-64"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">جاري التحميل...</div>
            ) : (
                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right" dir="rtl">
                            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
                                <tr>
                                    <th className="px-6 py-4">العميل</th>
                                    <th className="px-6 py-4">مرات الحجز</th>
                                    <th className="px-6 py-4">إجمالي الإنفاق</th>
                                    <th className="px-6 py-4">آخر حجز</th>
                                    <th className="px-6 py-4">الاهتمامات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                    {customer.avatar ? <img src={customer.avatar} className="w-full h-full rounded-full" /> : customer.name[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{customer.name}</div>
                                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" /> {customer.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2" title={customer.bookings_count > 3 ? "عميل مميز (مكرر)" : ""}>
                                                <span className="font-bold text-gray-800">{customer.bookings_count}</span>
                                                {customer.bookings_count > 3 && <Award className="w-4 h-4 text-amber-500" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            {customer.total_spent} ر.س
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(customer.last_booking).toLocaleDateString('ar-EG')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {customer.types_preferred.slice(0, 3).map((t: string) => (
                                                    <span key={t} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">{t}</span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                            لا توجد نتائج
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
