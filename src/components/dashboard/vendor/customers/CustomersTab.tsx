'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Mail, Calendar, Award, Phone, MessageCircle } from 'lucide-react';
import { getVendorCustomers } from '@/actions/vendor/bookings';
import { useTranslations, useLocale } from 'next-intl';
import { getDemoCustomers } from '@/lib/demoData';

export default function CustomersTab({ demoMode = false }: { demoMode?: boolean }) {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const t = useTranslations('Dashboard.vendor.customers');
    const locale = useLocale();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            if (demoMode) {
                const demoCustomers = getDemoCustomers();
                setCustomers(demoCustomers.map(c => ({
                    id: c.id,
                    name: c.full_name,
                    email: c.email,
                    avatar: null,
                    phone: c.phone || null,
                    age: null,
                    gender: null,
                    bookings_count: c.total_bookings,
                    total_spent: c.total_spent,
                    last_booking: new Date().toISOString(),
                    types_preferred: ['cultural', 'entertainment']
                })));
            } else {
                const data = await getVendorCustomers();
                setCustomers(data);
            }
            setLoading(false);
        };
        load();
    }, [demoMode]);

    const filtered = customers.filter(c =>
        c.name?.includes(filter) || c.email?.includes(filter) || c.phone?.includes(filter)
    );

    const formatWhatsAppUrl = (phone: string) => {
        const cleaned = phone.replace(/[^0-9+]/g, '').replace(/^\+/, '');
        return `https://wa.me/${cleaned}`;
    };

    const genderLabel = (gender: string) =>
        gender === 'Male' ? t('table.male') : gender === 'Female' ? t('table.female') : gender;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{t('title')}</h3>
                    <p className="text-sm text-gray-500">{t('subtitle')}</p>
                </div>
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ring-primary/20 w-full lg:w-64"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">{t('loading')}</div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-gray-400 shadow-sm">
                    {t('no_results')}
                </div>
            ) : (
                <>
                    {/* Mobile: Card Layout */}
                    <div className="flex flex-col gap-3 lg:hidden">
                        {filtered.map((customer) => (
                            <div key={customer.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                                {/* Header: Avatar + Name + Badge */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                                        {customer.avatar ? <img src={customer.avatar} className="w-full h-full rounded-full" /> : customer.name?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                            {customer.name}
                                            {customer.bookings_count > 3 && <Award className="w-4 h-4 text-amber-500 shrink-0" />}
                                        </div>
                                        <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                                            {customer.age && <span>{customer.age} {t('table.years_old')}</span>}
                                            {customer.age && customer.gender && <span>·</span>}
                                            {customer.gender && <span>{genderLabel(customer.gender)}</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Contact */}
                                <div className="flex flex-col gap-1.5 mb-3">
                                    {customer.email && (
                                        <a href={`mailto:${customer.email}`} className="text-xs text-gray-600 hover:text-primary flex items-center gap-1.5 transition-colors">
                                            <Mail className="w-3 h-3 shrink-0" /> {customer.email}
                                        </a>
                                    )}
                                    {customer.phone && (
                                        <div className="flex items-center gap-2">
                                            <a href={`tel:${customer.phone}`} className="text-xs text-gray-600 hover:text-primary flex items-center gap-1.5 transition-colors">
                                                <Phone className="w-3 h-3 shrink-0" /> {customer.phone}
                                            </a>
                                            <a
                                                href={formatWhatsAppUrl(customer.phone)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0 flex items-center"
                                            >
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" width={18} height={18} style={{ display: 'block' }} />
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Stats row */}
                                <div className="flex items-center gap-4 pt-3 border-t border-gray-100 text-xs">
                                    <div>
                                        <span className="text-gray-400">{t('table.bookings')}: </span>
                                        <span className="font-bold text-gray-800">{customer.bookings_count}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">{t('table.total_spent')}: </span>
                                        <span className="font-bold text-gray-900">{customer.total_spent} {t('currency')}</span>
                                    </div>
                                    <div className="mr-auto text-gray-400">
                                        {new Date(customer.last_booking).toLocaleDateString(locale)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop: Table Layout */}
                    <div className="hidden lg:block bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right" dir="rtl">
                                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
                                    <tr>
                                        <th className="px-6 py-4">{t('table.customer')}</th>
                                        <th className="px-6 py-4">{t('table.contact')}</th>
                                        <th className="px-6 py-4">{t('table.demographics')}</th>
                                        <th className="px-6 py-4">{t('table.bookings')}</th>
                                        <th className="px-6 py-4">{t('table.total_spent')}</th>
                                        <th className="px-6 py-4">{t('table.last_booking')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                        {customer.avatar ? <img src={customer.avatar} className="w-full h-full rounded-full" /> : customer.name?.[0]}
                                                    </div>
                                                    <div className="font-bold text-gray-900">{customer.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {customer.email && (
                                                        <a href={`mailto:${customer.email}`} className="text-xs text-gray-600 hover:text-primary flex items-center gap-1.5 transition-colors">
                                                            <Mail className="w-3 h-3 shrink-0" /> {customer.email}
                                                        </a>
                                                    )}
                                                    {customer.phone && (
                                                        <div className="flex items-center gap-1.5">
                                                            <a href={`tel:${customer.phone}`} className="text-xs text-gray-600 hover:text-primary flex items-center gap-1.5 transition-colors">
                                                                <Phone className="w-3 h-3 shrink-0" /> {customer.phone}
                                                            </a>
                                                            <a
                                                                href={formatWhatsAppUrl(customer.phone)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="w-5 h-5 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors shrink-0"
                                                                title="WhatsApp"
                                                            >
                                                                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                                </svg>
                                                            </a>
                                                        </div>
                                                    )}
                                                    {!customer.email && !customer.phone && (
                                                        <span className="text-xs text-gray-300">—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    {customer.age && (
                                                        <span className="text-xs text-gray-600">{customer.age} {t('table.years_old')}</span>
                                                    )}
                                                    {customer.gender && (
                                                        <span className="text-xs text-gray-500">{genderLabel(customer.gender)}</span>
                                                    )}
                                                    {!customer.age && !customer.gender && (
                                                        <span className="text-xs text-gray-300">—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2" title={customer.bookings_count > 3 ? t('vip_tooltip') : ""}>
                                                    <span className="font-bold text-gray-800">{customer.bookings_count}</span>
                                                    {customer.bookings_count > 3 && <Award className="w-4 h-4 text-amber-500" />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                {customer.total_spent} {t('currency')}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(customer.last_booking).toLocaleDateString(locale)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
