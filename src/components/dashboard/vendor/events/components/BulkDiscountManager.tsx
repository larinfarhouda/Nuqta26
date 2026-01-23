'use client';

import { Tag, Plus, Trash2, Percent, DollarSign } from 'lucide-react';

interface BulkDiscount {
    id?: string;
    min_quantity: number;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
}

interface Props {
    discounts: BulkDiscount[];
    setDiscounts: (discounts: BulkDiscount[]) => void;
}

export default function BulkDiscountManager({ discounts, setDiscounts }: Props) {
    const addDiscount = () => {
        setDiscounts([
            ...discounts,
            { min_quantity: 2, discount_type: 'percentage', discount_value: 10 }
        ]);
    };

    const removeDiscount = (index: number) => {
        setDiscounts(discounts.filter((_, i) => i !== index));
    };

    const updateDiscount = (index: number, data: Partial<BulkDiscount>) => {
        const newDiscounts = [...discounts];
        newDiscounts[index] = { ...newDiscounts[index], ...data };
        setDiscounts(newDiscounts);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-black text-gray-900">Bulk Discounts</h3>
                </div>
                <button
                    type="button"
                    onClick={addDiscount}
                    className="flex items-center gap-2 text-primary font-bold hover:bg-primary/10 px-3 py-1 rounded-xl transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Add Rule
                </button>
            </div>

            <div className="space-y-3">
                {discounts.map((discount, index) => (
                    <div key={index} className="flex flex-wrap items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-500 whitespace-nowrap">Buy at least</span>
                            <input
                                type="number"
                                min="2"
                                value={discount.min_quantity || 2}
                                onChange={(e) => updateDiscount(index, { min_quantity: parseInt(e.target.value) })}
                                className="w-20 px-3 py-2 rounded-xl border border-gray-200 font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                            <span className="text-sm font-bold text-gray-500">tickets</span>
                        </div>

                        <div className="flex items-center gap-2 flex-grow">
                            <span className="text-sm font-bold text-gray-500">get</span>
                            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => updateDiscount(index, { discount_type: 'percentage' })}
                                    className={`p-2 rounded-lg transition-all ${discount.discount_type === 'percentage' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <Percent className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateDiscount(index, { discount_type: 'fixed' })}
                                    className={`p-2 rounded-lg transition-all ${discount.discount_type === 'fixed' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <DollarSign className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="relative flex-grow max-w-[120px]">
                                <input
                                    type="number"
                                    value={discount.discount_value}
                                    onChange={(e) => updateDiscount(index, { discount_value: parseFloat(e.target.value) })}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold focus:ring-2 focus:ring-primary/20 outline-none pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                                    {discount.discount_type === 'percentage' ? '%' : '₺'}
                                </span>
                            </div>
                            <span className="text-sm font-bold text-gray-500">off</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => removeDiscount(index)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                ))}

                {discounts.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-[2rem]">
                        <p className="text-sm font-bold text-gray-400">No bulk discounts set for this event.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
