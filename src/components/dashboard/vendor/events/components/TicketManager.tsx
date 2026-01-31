import { Plus, Trash2, Users } from 'lucide-react';
import { Control, FieldErrors, UseFormRegister, useFieldArray } from 'react-hook-form';

interface TicketManagerProps {
    control: Control<any>;
    register: UseFormRegister<any>;
    errors: FieldErrors<any>;
}

export default function TicketManager({ control, register, errors }: TicketManagerProps) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: "tickets"
    });

    return (
        <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary"><Users className="w-5 h-5" /></div>
                <h4 className="font-bold text-gray-900 text-lg">التذاكر والسعة</h4>
            </div>

            <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700">السعة القصوى للفعالية</label>
                <input {...register('capacity')} type="number" className={`input-field text-gray-900 ${errors.capacity ? 'border-red-500' : ''}`} placeholder="0" />
                {errors.capacity && <p className="text-red-500 text-xs font-bold mt-1">{errors.capacity.message as string}</p>}
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-700">أنواع التذاكر</label>
                    <button type="button" onClick={() => append({ name: '', price: 0, quantity: 10 })} className="text-xs font-bold bg-black text-white px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-gray-800 transition-colors">
                        <Plus className="w-3 h-3" /> إضافة تذكرة
                    </button>
                </div>

                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4 relative group">
                        {fields.length > 1 && (
                            <button type="button" onClick={() => remove(index)} className="absolute top-2 left-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500">اسم التذكرة (مثال: VIP)</label>
                                <input {...register(`tickets.${index}.name` as const)} className="input-field h-10 text-sm text-gray-900" placeholder="تذكرة عامة" />
                                {(errors.tickets as any)?.[index]?.name && <p className="text-red-500 text-xs mt-1">{(errors.tickets as any)[index]?.name?.message as string}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500">السعر</label>
                                    <div className="relative">
                                        <input type="number" {...register(`tickets.${index}.price` as const)} className="input-field h-10 text-sm text-gray-900 pl-8" />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₺</span>
                                    </div>
                                    {(errors.tickets as any)?.[index]?.price && <p className="text-red-500 text-xs mt-1">{(errors.tickets as any)[index]?.price?.message as string}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500">العدد المتاح</label>
                                    <input type="number" {...register(`tickets.${index}.quantity` as const)} className="input-field h-10 text-sm text-gray-900" />
                                    {(errors.tickets as any)?.[index]?.quantity && <p className="text-red-500 text-xs mt-1">{(errors.tickets as any)[index]?.quantity?.message as string}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {errors.tickets && <p className="text-red-500 text-xs font-bold mt-1">{(errors.tickets as any).message}</p>}
            </div>
        </div>
    );
}
