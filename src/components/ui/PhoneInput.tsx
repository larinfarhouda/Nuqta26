'use client';

import { useState, useEffect } from 'react';
import { useCountry } from '@/hooks/useCountry';
import { UseFormRegister, UseFormSetValue } from 'react-hook-form';

export const COUNTRY_CODES = [
    { code: '+90', country: 'TR', label: 'Turkey (+90)' },
    { code: '+971', country: 'AE', label: 'UAE (+971)' },
    { code: '+20', country: 'EG', label: 'Egypt (+20)' },
    { code: '+965', country: 'KW', label: 'Kuwait (+965)' },
    { code: '+974', country: 'QA', label: 'Qatar (+974)' },
    { code: '+973', country: 'BH', label: 'Bahrain (+973)' },
    { code: '+968', country: 'OM', label: 'Oman (+968)' },
    { code: '+1', country: 'US', label: 'USA (+1)' },
    { code: '+44', country: 'GB', label: 'UK (+44)' },
];

interface PhoneInputProps {
    register: UseFormRegister<any>;
    setValue: UseFormSetValue<any>;
    name: string;
    countryId?: string;
    initialValue?: string | null;
    placeholder?: string;
    className?: string;
    error?: string;
}

export default function PhoneInput({
    register,
    setValue,
    name,
    initialValue,
    countryId,
    placeholder,
    className = '',
    error
}: PhoneInputProps) {
    const { country, countries } = useCountry();
    const selected = countries.find(item => item.id === (countryId || country?.id));
    const options = [...COUNTRY_CODES];
    for (const item of countries) {
        if (!options.some(option => option.code === item.phone_code)) options.push({ code: item.phone_code, country: item.id.toUpperCase(), label: item.name_en });
    }
    const initialPrefix = [...options].sort((a, b) => b.code.length - a.code.length)
        .find(option => initialValue?.startsWith(option.code))?.code;
    const [draft, setDraft] = useState<{ number?: string; prefix?: string }>({});
    const phoneNumber = draft.number ?? (initialPrefix ? initialValue!.slice(initialPrefix.length).trim() : initialValue || '');
    const countryCode = draft.prefix ?? initialPrefix ?? selected?.phone_code ?? '';

    // Update the actual form value when either parts change
    useEffect(() => {
        setValue(name, phoneNumber.trim() ? `${countryCode}${phoneNumber.trim()}` : '', { shouldValidate: true });
    }, [countryCode, phoneNumber, name, setValue]);

    return (
        <div className={`space-y-1 ${className}`}>
            <div className="flex gap-2" dir="ltr">
                <select
                    value={countryCode}
                    onChange={(e) => setDraft(current => ({ ...current, prefix: e.target.value }))}
                    className="px-3 py-4 rounded-2xl border border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-gray-900 w-28 text-sm"
                >
                    <option value="" disabled>+</option>
                    {options.map((c) => (
                        <option key={c.code} value={c.code}>
                            {c.country} ({c.code})
                        </option>
                    ))}
                </select>
                <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setDraft(current => ({ ...current, number: e.target.value }))}
                    placeholder={placeholder || selected?.phone_placeholder || 'Phone number'}
                    className={`flex-1 p-4 bg-white/50 border ${error ? 'border-red-300 ring-4 ring-red-50' : 'border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10'} rounded-2xl outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white`}
                />
            </div>
            {error && <span className="text-red-500 text-xs font-bold ml-1">{error}</span>}
        </div>
    );
}
