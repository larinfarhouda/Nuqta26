import { CountryRepository, Country, City, Bank, PaymentMethod, VendorPaymentMethod } from '@/repositories/country.repository';

/**
 * Country Service
 * Business logic for multi-country support
 */
export class CountryService {
    constructor(private countryRepo: CountryRepository) {}

    /**
     * Get all active countries (for selectors)
     */
    async getActiveCountries(): Promise<Country[]> {
        return this.countryRepo.findAllCountries(true);
    }

    /**
     * Get all countries including inactive (for admin)
     */
    async getAllCountries(): Promise<Country[]> {
        return this.countryRepo.findAllCountries(false);
    }

    /**
     * Get a single country by ID
     */
    async getCountry(id: string): Promise<Country | null> {
        return this.countryRepo.findCountryById(id);
    }

    /**
     * Get full country config (country + cities + banks + payment methods)
     */
    async getFullConfig(countryId: string) {
        return this.countryRepo.getFullCountryConfig(countryId);
    }

    /**
     * Get all countries with their cities
     */
    async getCountriesWithCities() {
        return this.countryRepo.getAllCountriesWithCities();
    }

    /**
     * Get cities for a country
     */
    async getCities(countryId: string): Promise<City[]> {
        return this.countryRepo.findCitiesByCountry(countryId);
    }

    /**
     * Get banks for a country
     */
    async getBanks(countryId: string): Promise<Bank[]> {
        return this.countryRepo.findBanksByCountry(countryId);
    }

    /**
     * Get payment methods for a country
     */
    async getPaymentMethods(countryId: string): Promise<PaymentMethod[]> {
        return this.countryRepo.findPaymentMethodsByCountry(countryId);
    }

    /**
     * Get vendor's active payment methods (with joined payment method details)
     */
    async getVendorPaymentMethods(vendorId: string): Promise<VendorPaymentMethod[]> {
        return this.countryRepo.findVendorPaymentMethods(vendorId, true);
    }

    /**
     * Get all vendor payment methods including inactive (for vendor settings)
     */
    async getAllVendorPaymentMethods(vendorId: string): Promise<VendorPaymentMethod[]> {
        return this.countryRepo.findVendorPaymentMethods(vendorId, false);
    }

    /**
     * Save/update a vendor's payment method
     */
    async saveVendorPaymentMethod(
        vendorId: string,
        paymentMethodId: string,
        details: Record<string, string>,
        isActive: boolean
    ): Promise<VendorPaymentMethod> {
        return this.countryRepo.upsertVendorPaymentMethod(vendorId, paymentMethodId, details, isActive);
    }

    /**
     * Format a price with the country's currency symbol
     */
    formatPrice(amount: number, country: Country): string {
        if (amount === 0) return '';
        return `${amount.toLocaleString()} ${country.currency_symbol}`;
    }

    /**
     * Get subscription price for a country/tier
     */
    getSubscriptionPrice(
        country: Country,
        tier: 'growth' | 'professional',
        isFounder: boolean
    ): number {
        if (tier === 'growth') {
            return isFounder ? country.subscription_growth_founder_price : country.subscription_growth_price;
        }
        return isFounder ? country.subscription_professional_founder_price : country.subscription_professional_price;
    }

    // ── Admin CRUD ─────────────────────────────────────────────

    async createCountry(country: Omit<Country, 'sort_order'> & { sort_order?: number }) {
        return this.countryRepo.createCountry(country);
    }

    async updateCountry(id: string, updates: Partial<Country>) {
        return this.countryRepo.updateCountry(id, updates);
    }

    async createCity(city: Omit<City, 'sort_order' | 'is_active'> & { sort_order?: number; is_active?: boolean }) {
        return this.countryRepo.createCity(city);
    }

    async updateCity(id: string, updates: Partial<City>) {
        return this.countryRepo.updateCity(id, updates);
    }

    async deleteCity(id: string) {
        return this.countryRepo.deleteCity(id);
    }

    async createBank(bank: { country_id: string; name: string; sort_order?: number }) {
        return this.countryRepo.createBank(bank);
    }

    async updateBank(id: string, updates: Partial<Bank>) {
        return this.countryRepo.updateBank(id, updates);
    }

    async deleteBank(id: string) {
        return this.countryRepo.deleteBank(id);
    }

    async createPaymentMethod(pm: Omit<PaymentMethod, 'id' | 'sort_order' | 'is_active'> & { sort_order?: number; is_active?: boolean }) {
        return this.countryRepo.createPaymentMethod(pm);
    }

    async updatePaymentMethod(id: string, updates: Partial<PaymentMethod>) {
        return this.countryRepo.updatePaymentMethod(id, updates);
    }

    async deletePaymentMethod(id: string) {
        return this.countryRepo.deletePaymentMethod(id);
    }
}
