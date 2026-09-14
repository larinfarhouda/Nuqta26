import { resolveCountry, getCountryPrices } from '@/lib/country-selection';
import type { Country } from '@/repositories/country.repository';
const countries = [
    { id: 'tr', is_active: true, subscription_pro_monthly_price: 999, subscription_pro_annual_price: 9990 },
    { id: 'eg', is_active: true, subscription_pro_monthly_price: 1500, subscription_pro_annual_price: 15000 },
    { id: 'ae', is_active: true, subscription_pro_monthly_price: 50, subscription_pro_annual_price: 500 },
    { id: 'gb', is_active: false },
] as Country[];
describe('visitor country selection', () => {
    test('IP country applies on the first request without a cookie', () => expect(resolveCountry(countries, null, 'EG')?.id).toBe('eg'));
    test('manual choice overrides IP country', () => expect(resolveCountry(countries, 'tr', 'EG')?.id).toBe('tr'));
    test('new active countries work without a code mapping', () => expect(resolveCountry(countries, null, 'AE')?.id).toBe('ae'));
    test.each(['US', 'GB', undefined])('unsupported or missing IP %s does not impersonate another country', ip => expect(resolveCountry(countries, null, ip)).toBeNull());
    test('invalid and inactive cookies do not override a supported location', () => {
        expect(resolveCountry(countries, 'invalid', 'EG')?.id).toBe('eg');
        expect(resolveCountry(countries, 'gb', 'TR')?.id).toBe('tr');
    });
    test('country settings determine pricing instead of old hardcoded defaults', () => expect(getCountryPrices(countries[1]).pro).toEqual({ monthly: 1500, annual: 15000 }));
});
