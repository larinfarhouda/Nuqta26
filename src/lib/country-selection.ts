import type { Country } from '@/repositories/country.repository';

export function resolveCountry(countries: Country[], selection?: string | null, detected?: string | null) {
    const active = countries.filter(country => country.is_active);
    const find = (id?: string | null) => active.find(country => country.id === id?.toLowerCase());
    return find(selection) || find(detected) || null;
}

export function getCountryPrices(country: Country) {
    return {
        free: { monthly: 0, annual: 0 },
        pro: { monthly: country.subscription_pro_monthly_price, annual: country.subscription_pro_annual_price },
        business: { monthly: country.subscription_business_monthly_price, annual: country.subscription_business_annual_price },
    };
}
