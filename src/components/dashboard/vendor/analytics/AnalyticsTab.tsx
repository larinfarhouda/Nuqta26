'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, Calendar, DollarSign, PieChart } from 'lucide-react';
import { getVendorAnalytics, getSegmentationData } from '@/actions/vendor/analytics';

export default function AnalyticsTab() {
    const [analytics, setAnalytics] = useState<any>(null);
    const [segmentation, setSegmentation] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const [a, s] = await Promise.all([getVendorAnalytics(), getSegmentationData()]);
            setAnalytics(a);
            setSegmentation(s);
            setLoading(false);
        };
        load();
    }, []);

    if (loading) return <div className="text-center py-20">جاري تحليل البيانات...</div>;
    if (!analytics) return <div className="text-center py-20">لا توجد بيانات متاحة بعد.</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div>
                <h3 className="text-xl font-bold text-gray-900">الإحصائيات والتحليلات</h3>
                <p className="text-sm text-gray-500">نظرة عامة على أداء فعالياتك</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card bg-[#2CA58D]/5 border-[#2CA58D]/20 border p-6 rounded-3xl">
                    <DollarSign className="text-[#2CA58D] w-6 h-6 mb-2" />
                    <div className="text-3xl font-black text-gray-900">{analytics.revenue}</div>
                    <div className="text-xs font-bold text-[#2CA58D] uppercase">إجمالي المبيعات (ر.س)</div>
                </div>
                <div className="stat-card bg-indigo-50 border-indigo-100 border p-6 rounded-3xl">
                    <Users className="text-indigo-600 w-6 h-6 mb-2" />
                    <div className="text-3xl font-black text-gray-900">{analytics.sales}</div>
                    <div className="text-xs font-bold text-indigo-500 uppercase">التذاكر المباعة</div>
                </div>
                <div className="stat-card bg-purple-50 border-purple-100 border p-6 rounded-3xl">
                    <Calendar className="text-purple-600 w-6 h-6 mb-2" />
                    <div className="text-3xl font-black text-gray-900">{analytics.events}</div>
                    <div className="text-xs font-bold text-purple-500 uppercase">الفعاليات الكلية</div>
                </div>
                <div className="stat-card bg-amber-50 border-amber-100 border p-6 rounded-3xl">
                    <TrendingUp className="text-amber-600 w-6 h-6 mb-2" />
                    <div className="text-3xl font-black text-gray-900">{analytics.recentSales}</div>
                    <div className="text-xs font-bold text-amber-500 uppercase">مبيعات آخر 30 يوم</div>
                </div>
            </div>

            {/* Segmentation / Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Event Types Distribution */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <PieChart className="w-5 h-5 text-gray-400" />
                        <h4 className="font-bold text-gray-900">أنواع الفعاليات المفضلة</h4>
                    </div>
                    <div className="space-y-4">
                        {segmentation?.typeDistribution.map((item: any) => (
                            <div key={item.name} className="flex items-center gap-4">
                                <div className="w-20 text-xs font-bold text-gray-500">{item.name}</div>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full"
                                        style={{ width: `${(item.value / Math.max(...segmentation.typeDistribution.map((i: any) => i.value))) * 100}%` }}
                                    />
                                </div>
                                <div className="w-10 text-xs font-bold text-gray-900 text-left">{item.value}</div>
                            </div>
                        ))}
                        {segmentation?.typeDistribution.length === 0 && <p className="text-sm text-gray-400 text-center">لا توجد بيانات كافية</p>}
                    </div>
                </div>

                {/* Customer Loyalty */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <Users className="w-5 h-5 text-gray-400" />
                        <h4 className="font-bold text-gray-900">ولاء العملاء</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        {segmentation?.customerLoyalty.map((item: any) => (
                            <div key={item.name} className="p-4 bg-gray-50 rounded-2xl">
                                <div className="text-2xl font-black text-gray-900">{item.value}</div>
                                <div className="text-xs font-bold text-gray-500 mt-1">
                                    {item.name === 'One-time' && 'مرة واحدة'}
                                    {item.name === 'Recurring' && 'متكرر'}
                                    {item.name === 'Loyal' && 'مخلص (VIP)'}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 p-4 bg-blue-50 text-blue-800 text-xs rounded-xl leading-relaxed">
                        <span className="font-bold block mb-1">نصيحة:</span>
                        ركز على العملاء "المتكررين" وقدم لهم عروضاً خاصة لتحويلهم إلى عملاء "VIP" لزيادة المبيعات طويلة الأمد.
                    </div>
                </div>

                {/* Gender Distribution */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <Users className="w-5 h-5 text-gray-400" />
                        <h4 className="font-bold text-gray-900">توزيع الجنس</h4>
                    </div>
                    <div className="space-y-4">
                        {segmentation?.genderDistribution.map((item: any) => (
                            <div key={item.name} className="flex items-center gap-4">
                                <div className="w-20 text-xs font-bold text-gray-500">
                                    {item.name === 'Male' ? 'ذكر' : item.name === 'Female' ? 'أنثى' : 'غير محدد'}
                                </div>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${item.name === 'Male' ? 'bg-blue-500' : 'bg-pink-500'}`}
                                        style={{ width: `${(item.value / (segmentation.genderDistribution.reduce((a: any, b: any) => a + b.value, 0) || 1)) * 100}%` }}
                                    />
                                </div>
                                <div className="w-10 text-xs font-bold text-gray-900 text-left">{item.value}</div>
                            </div>
                        ))}
                        {(!segmentation?.genderDistribution || segmentation.genderDistribution.length === 0) && <p className="text-sm text-gray-400 text-center">لا توجد بيانات كافية</p>}
                    </div>
                </div>

                {/* Age Distribution */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <Users className="w-5 h-5 text-gray-400" />
                        <h4 className="font-bold text-gray-900">الفئات العمرية</h4>
                    </div>
                    <div className="space-y-4">
                        {segmentation?.ageDistribution.map((item: any) => (
                            <div key={item.name} className="flex items-center gap-4">
                                <div className="w-20 text-xs font-bold text-gray-500">{item.name}</div>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{ width: `${(item.value / (Math.max(...segmentation.ageDistribution.map((i: any) => i.value)) || 1)) * 100}%` }}
                                    />
                                </div>
                                <div className="w-10 text-xs font-bold text-gray-900 text-left">{item.value}</div>
                            </div>
                        ))}
                        {(!segmentation?.ageDistribution || segmentation.ageDistribution.length === 0) && <p className="text-sm text-gray-400 text-center">لا توجد بيانات كافية</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
