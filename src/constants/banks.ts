// Major banks operating in Turkey
export const TURKISH_BANKS = [
    "Akbank",
    "Albaraka Türk",
    "Alternatifbank",
    "Anadolubank",
    "Burgan Bank",
    "Denizbank",
    "Fibabanka",
    "Garanti BBVA",
    "Halkbank",
    "HSBC Turkey",
    "ING Bank",
    "İş Bankası",
    "Kuveyt Türk",
    "Odeabank",
    "QNB Finansbank",
    "Şekerbank",
    "Turkish Bank",
    "Türk Ekonomi Bankası (TEB)",
    "Türkiye Finans",
    "Vakıfbank",
    "Yapı Kredi",
    "Ziraat Bankası",
] as const;

export type TurkishBank = typeof TURKISH_BANKS[number];
