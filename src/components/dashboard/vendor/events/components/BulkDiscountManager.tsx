'use client';

import { Tag, Plus, Trash2, Percent, DollarSign } from 'lucide-react';
import { BulkDiscountInput } from '@/types/dto/discount.dto';
import { useTranslations } from 'next-intl';

// Extend the DTO with id for local state management
interface BulkDiscountWithId extends BulkDiscountInput {
    id: string;
}

interface Props {
    discounts: BulkDiscountWithId[];
    setDiscounts: (discounts: BulkDiscountWithId[]) => void;
}

export default function BulkDiscountManager({ discounts, setDiscounts }: Props) {
    const t = useTranslations('Dashboard.vendor.bulk_discounts');
    const addDiscount = () => {
        setDiscounts([
            ...discounts,
            { id: crypto.randomUUID(), min_quantity: 2, discount_type: 'percentage', discount_value: 10 }
        ]);
    };

    const removeDiscount = (id: string) => {
        setDiscounts(discounts.filter((d) => d.id !== id));
    };

    const updateDiscount = (id: string, data: Partial<BulkDiscountWithId>) => {
        setDiscounts(discounts.map(d => d.id === id ? { ...d, ...data } : d));
    };


    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-black text-gray-900">{t('title')}</h3>
                </div>
                <button
                    type="button"
                    onClick={addDiscount}
                    className="flex items-center gap-2 text-primary font-bold hover:bg-primary/10 px-3 py-1 rounded-xl transition-all"
                >
                    <Plus className="w-4 h-4" />
                    {t('add_rule')}
                </button>
            </div>

            <div className="space-y-3">
                {discounts.map((discount) => (
                    <div key={discount.id} className="flex flex-wrap items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-500 whitespace-nowrap">{t('buy_at_least')}</span>
                            <input
                                type="number"
                                min="2"
                                value={discount.min_quantity || ''}
                                onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                    updateDiscount(discount.id, { min_quantity: isNaN(val) ? 0 : val });
                                }}
                                className="w-20 px-3 py-2 rounded-xl border border-gray-200 font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                            <span className="text-sm font-bold text-gray-500">{t('tickets')}</span>
                        </div>

                        <div className="flex items-center gap-2 flex-grow">
                            <span className="text-sm font-bold text-gray-500">{t('get')}</span>
                            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => updateDiscount(discount.id, { discount_type: 'percentage' })}
                                    aria-label="Set percentage discount"
                                    aria-pressed={discount.discount_type === 'percentage'}
                                    className={`p-2 rounded-lg transition-all ${discount.discount_type === 'percentage' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <Percent className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateDiscount(discount.id, { discount_type: 'fixed' })}
                                    aria-label="Set fixed discount"
                                    aria-pressed={discount.discount_type === 'fixed'}
                                    className={`p-2 rounded-lg transition-all ${discount.discount_type === 'fixed' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <DollarSign className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="relative flex-grow max-w-[120px]">
                                <input
                                    type="number"
                                    value={discount.discount_value || ''}
                                    onChange={(e) => {
                                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                        updateDiscount(discount.id, { discount_value: isNaN(val) ? 0 : val });
                                    }}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                                    {discount.discount_type === 'percentage' ? '%' : '₺'}
                                </span>
                            </div>
                            <span className="text-sm font-bold text-gray-500">{t('off')}</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => removeDiscount(discount.id)}
                            aria-label="Remove discount rule"
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                ))}

                {discounts.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-[2rem]">
                        <p className="text-sm font-bold text-gray-400">{t('no_discounts')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
