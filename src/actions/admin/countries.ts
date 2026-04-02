'use server';

import { createAdminClient, createClient } from '@/utils/supabase/server';
import { ServiceFactory } from '@/services/service-factory';
import { logger } from '@/lib/logger/logger';
import type { Country, City, Bank, PaymentMethod } from '@/repositories/country.repository';

// ─── Admin Guard ────────────────────────────────────────────────────────────

async function requireAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') throw new Error('Forbidden: Admin access required');
    return { user, supabase };
}

function getCountryService() {
    const adminClient = createAdminClient();
    const factory = new ServiceFactory(adminClient);
    return factory.getCountryService();
}

// ─── Read Operations ────────────────────────────────────────────────────────

export async function getAdminCountries() {
    try {
        await requireAdmin();
        const service = getCountryService();
        return await service.getAllCountries();
    } catch (error) {
        logger.error('Failed to get countries', { error });
        return [];
    }
}

export async function getAdminCountryConfig(countryId: string) {
    try {
        await requireAdmin();
        const service = getCountryService();
        return await service.getFullConfig(countryId);
    } catch (error) {
        logger.error('Failed to get country config', { error });
        return null;
    }
}

// ─── Country CRUD ───────────────────────────────────────────────────────────

export async function saveCountry(data: Partial<Country> & { id: string }) {
    try {
        await requireAdmin();
        const service = getCountryService();

        // Check if exists
        const existing = await service.getCountry(data.id);
        if (existing) {
            await service.updateCountry(data.id, data);
        } else {
            await service.createCountry(data as any);
        }
        return { success: true };
    } catch (error) {
        logger.error('Failed to save country', { error });
        return { error: 'Failed to save country' };
    }
}

export async function toggleCountryActive(countryId: string, isActive: boolean) {
    try {
        await requireAdmin();
        const service = getCountryService();
        await service.updateCountry(countryId, { is_active: isActive });
        return { success: true };
    } catch (error) {
        logger.error('Failed to toggle country', { error });
        return { error: 'Failed to toggle country' };
    }
}

// ─── City CRUD ──────────────────────────────────────────────────────────────

export async function addCity(countryId: string, id: string, nameEn: string, nameAr: string) {
    try {
        await requireAdmin();
        const service = getCountryService();
        await service.createCity({ id, country_id: countryId, name_en: nameEn, name_ar: nameAr });
        return { success: true };
    } catch (error) {
        logger.error('Failed to add city', { error });
        return { error: 'Failed to add city' };
    }
}

export async function updateCity(cityId: string, updates: Partial<City>) {
    try {
        await requireAdmin();
        const service = getCountryService();
        await service.updateCity(cityId, updates);
        return { success: true };
    } catch (error) {
        logger.error('Failed to update city', { error });
        return { error: 'Failed to update city' };
    }
}

export async function removeCity(cityId: string) {
    try {
        await requireAdmin();
        const service = getCountryService();
        await service.deleteCity(cityId);
        return { success: true };
    } catch (error) {
        logger.error('Failed to remove city', { error });
        return { error: 'Failed to remove city' };
    }
}

// ─── Bank CRUD ──────────────────────────────────────────────────────────────

export async function addBank(countryId: string, name: string) {
    try {
        await requireAdmin();
        const service = getCountryService();
        await service.createBank({ country_id: countryId, name });
        return { success: true };
    } catch (error) {
        logger.error('Failed to add bank', { error });
        return { error: 'Failed to add bank' };
    }
}

export async function updateBankAction(bankId: string, updates: Partial<Bank>) {
    try {
        await requireAdmin();
        const service = getCountryService();
        await service.updateBank(bankId, updates);
        return { success: true };
    } catch (error) {
        logger.error('Failed to update bank', { error });
        return { error: 'Failed to update bank' };
    }
}

export async function removeBank(bankId: string) {
    try {
        await requireAdmin();
        const service = getCountryService();
        await service.deleteBank(bankId);
        return { success: true };
    } catch (error) {
        logger.error('Failed to remove bank', { error });
        return { error: 'Failed to remove bank' };
    }
}

// ─── Payment Method CRUD ────────────────────────────────────────────────────

export async function addPaymentMethod(data: {
    country_id: string;
    method_type: string;
    label_en: string;
    label_ar: string;
    description_en?: string;
    description_ar?: string;
    icon: string;
    required_fields: string[];
}) {
    try {
        await requireAdmin();
        const service = getCountryService();
        await service.createPaymentMethod(data as any);
        return { success: true };
    } catch (error) {
        logger.error('Failed to add payment method', { error });
        return { error: 'Failed to add payment method' };
    }
}

export async function updatePaymentMethodAction(pmId: string, updates: Partial<PaymentMethod>) {
    try {
        await requireAdmin();
        const service = getCountryService();
        await service.updatePaymentMethod(pmId, updates);
        return { success: true };
    } catch (error) {
        logger.error('Failed to update payment method', { error });
        return { error: 'Failed to update payment method' };
    }
}

export async function removePaymentMethod(pmId: string) {
    try {
        await requireAdmin();
        const service = getCountryService();
        await service.deletePaymentMethod(pmId);
        return { success: true };
    } catch (error) {
        logger.error('Failed to remove payment method', { error });
        return { error: 'Failed to remove payment method' };
    }
}
