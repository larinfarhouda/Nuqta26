import { BaseRepository } from './base.repository';

// Types for the new country-related tables
export interface Country {
    id: string;
    name_en: string;
    name_ar: string;
    currency_code: string;
    currency_symbol: string;
    currency_name_ar: string;
    phone_code: string;
    phone_placeholder: string;
    iban_regex: string | null;
    iban_placeholder: string | null;
    timezone: string;
    is_active: boolean;
    sort_order: number;
    subscription_growth_price: number;
    subscription_professional_price: number;
    subscription_growth_founder_price: number;
    subscription_professional_founder_price: number;
}

export interface City {
    id: string;
    country_id: string;
    name_en: string;
    name_ar: string;
    is_active: boolean;
    sort_order: number;
}

export interface Bank {
    id: string;
    country_id: string;
    name: string;
    is_active: boolean;
    sort_order: number;
}

export interface PaymentMethod {
    id: string;
    country_id: string;
    method_type: string;
    label_en: string;
    label_ar: string;
    description_en: string | null;
    description_ar: string | null;
    icon: string | null;
    required_fields: string[] | any; // Json in DB, array of field keys in practice
    is_active: boolean;
    sort_order: number;
}

export interface VendorPaymentMethod {
    id: string;
    vendor_id: string;
    payment_method_id: string;
    details: Record<string, string>;
    is_active: boolean;
    payment_methods?: PaymentMethod; // joined
}

/**
 * Country Repository
 * Handles all database operations for multi-country support
 */
export class CountryRepository extends BaseRepository {

    // ── Countries ──────────────────────────────────────────────

    async findAllCountries(activeOnly = true): Promise<Country[]> {
        let query = this.client
            .from('countries')
            .select('*')
            .order('sort_order', { ascending: true });

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) this.handleError(error, 'CountryRepository.findAllCountries');
        return data || [];
    }

    async findCountryById(id: string): Promise<Country | null> {
        const { data, error } = await this.client
            .from('countries')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (this.isNotFoundError(error)) return null;
            this.handleError(error, 'CountryRepository.findCountryById');
        }
        return data;
    }

    async createCountry(country: Omit<Country, 'sort_order'> & { sort_order?: number }): Promise<Country> {
        const { data, error } = await this.client
            .from('countries')
            .insert(country)
            .select()
            .single();

        if (error) this.handleError(error, 'CountryRepository.createCountry');
        return data;
    }

    async updateCountry(id: string, updates: Partial<Country>): Promise<Country> {
        const { data, error } = await this.client
            .from('countries')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) this.handleError(error, 'CountryRepository.updateCountry');
        return data;
    }

    // ── Cities ─────────────────────────────────────────────────

    async findCitiesByCountry(countryId: string, activeOnly = true): Promise<City[]> {
        let query = this.client
            .from('cities')
            .select('*')
            .eq('country_id', countryId)
            .order('sort_order', { ascending: true });

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) this.handleError(error, 'CountryRepository.findCitiesByCountry');
        return data || [];
    }

    async createCity(city: Omit<City, 'sort_order' | 'is_active'> & { sort_order?: number; is_active?: boolean }): Promise<City> {
        const { data, error } = await this.client
            .from('cities')
            .insert(city)
            .select()
            .single();

        if (error) this.handleError(error, 'CountryRepository.createCity');
        return data;
    }

    async updateCity(id: string, updates: Partial<City>): Promise<City> {
        const { data, error } = await this.client
            .from('cities')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) this.handleError(error, 'CountryRepository.updateCity');
        return data;
    }

    async deleteCity(id: string): Promise<void> {
        const { error } = await this.client.from('cities').delete().eq('id', id);
        if (error) this.handleError(error, 'CountryRepository.deleteCity');
    }

    // ── Banks ──────────────────────────────────────────────────

    async findBanksByCountry(countryId: string, activeOnly = true): Promise<Bank[]> {
        let query = this.client
            .from('banks')
            .select('*')
            .eq('country_id', countryId)
            .order('sort_order', { ascending: true });

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) this.handleError(error, 'CountryRepository.findBanksByCountry');
        return data || [];
    }

    async createBank(bank: { country_id: string; name: string; sort_order?: number }): Promise<Bank> {
        const { data, error } = await this.client
            .from('banks')
            .insert(bank)
            .select()
            .single();

        if (error) this.handleError(error, 'CountryRepository.createBank');
        return data;
    }

    async updateBank(id: string, updates: Partial<Bank>): Promise<Bank> {
        const { data, error } = await this.client
            .from('banks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) this.handleError(error, 'CountryRepository.updateBank');
        return data;
    }

    async deleteBank(id: string): Promise<void> {
        const { error } = await this.client.from('banks').delete().eq('id', id);
        if (error) this.handleError(error, 'CountryRepository.deleteBank');
    }

    // ── Payment Methods ────────────────────────────────────────

    async findPaymentMethodsByCountry(countryId: string, activeOnly = true): Promise<PaymentMethod[]> {
        let query = this.client
            .from('payment_methods')
            .select('*')
            .eq('country_id', countryId)
            .order('sort_order', { ascending: true });

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) this.handleError(error, 'CountryRepository.findPaymentMethodsByCountry');
        return (data || []) as PaymentMethod[];
    }

    async createPaymentMethod(pm: Omit<PaymentMethod, 'id' | 'sort_order' | 'is_active'> & { sort_order?: number; is_active?: boolean }): Promise<PaymentMethod> {
        const { data, error } = await this.client
            .from('payment_methods')
            .insert(pm)
            .select()
            .single();

        if (error) this.handleError(error, 'CountryRepository.createPaymentMethod');
        return data as PaymentMethod;
    }

    async updatePaymentMethod(id: string, updates: Partial<PaymentMethod>): Promise<PaymentMethod> {
        const { data, error } = await this.client
            .from('payment_methods')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) this.handleError(error, 'CountryRepository.updatePaymentMethod');
        return data as PaymentMethod;
    }

    async deletePaymentMethod(id: string): Promise<void> {
        const { error } = await this.client.from('payment_methods').delete().eq('id', id);
        if (error) this.handleError(error, 'CountryRepository.deletePaymentMethod');
    }

    // ── Vendor Payment Methods ─────────────────────────────────

    async findVendorPaymentMethods(vendorId: string, activeOnly = true): Promise<VendorPaymentMethod[]> {
        let query = this.client
            .from('vendor_payment_methods')
            .select('*, payment_methods(*)')
            .eq('vendor_id', vendorId);

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) this.handleError(error, 'CountryRepository.findVendorPaymentMethods');
        return (data || []) as VendorPaymentMethod[];
    }

    async upsertVendorPaymentMethod(
        vendorId: string,
        paymentMethodId: string,
        details: Record<string, string>,
        isActive: boolean
    ): Promise<VendorPaymentMethod> {
        const { data, error } = await this.client
            .from('vendor_payment_methods')
            .upsert({
                vendor_id: vendorId,
                payment_method_id: paymentMethodId,
                details,
                is_active: isActive,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'vendor_id,payment_method_id' })
            .select('*, payment_methods(*)')
            .single();

        if (error) this.handleError(error, 'CountryRepository.upsertVendorPaymentMethod');
        return data as VendorPaymentMethod;
    }

    async deleteVendorPaymentMethod(id: string): Promise<void> {
        const { error } = await this.client.from('vendor_payment_methods').delete().eq('id', id);
        if (error) this.handleError(error, 'CountryRepository.deleteVendorPaymentMethod');
    }

    // ── Full Country Config (for frontend) ─────────────────────

    /**
     * Get a complete country config with all related data.
     * Used to hydrate the country context on the frontend.
     */
    async getFullCountryConfig(countryId: string) {
        const [country, cities, banks, paymentMethods] = await Promise.all([
            this.findCountryById(countryId),
            this.findCitiesByCountry(countryId),
            this.findBanksByCountry(countryId),
            this.findPaymentMethodsByCountry(countryId),
        ]);

        if (!country) return null;

        return { ...country, cities, banks, paymentMethods };
    }

    /**
     * Get all active countries with their cities (lightweight).
     * Used for country selector components.
     */
    async getAllCountriesWithCities() {
        const countries = await this.findAllCountries();
        const result = await Promise.all(
            countries.map(async (country) => ({
                ...country,
                cities: await this.findCitiesByCountry(country.id),
            }))
        );
        return result;
    }
}
