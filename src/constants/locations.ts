export interface City {
    id: string;
    name_en: string;
    name_ar: string;
}

export interface Country {
    id: string;
    name_en: string;
    name_ar: string;
    cities: City[];
}

export const COUNTRIES: Country[] = [
    {
        id: 'tr',
        name_en: 'Turkey',
        name_ar: 'تركيا',
        cities: [
            { id: 'istanbul', name_en: 'Istanbul', name_ar: 'إسطنبول' },
            { id: 'ankara', name_en: 'Ankara', name_ar: 'أنقرة' },
            { id: 'izmir', name_en: 'Izmir', name_ar: 'إزمير' },
            { id: 'antalya', name_en: 'Antalya', name_ar: 'أنطاليا' },
            { id: 'bursa', name_en: 'Bursa', name_ar: 'بورصة' },
        ]
    }
];

export const ALL_CITIES = COUNTRIES.flatMap(country => country.cities);
