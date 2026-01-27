import { Tables } from '@/types/database.types';

// Base types from database
export type Profile = Tables<'profiles'>;

/**
 * Update User Profile Input
 */
export interface UpdateProfileInput {
    full_name: string;
    age?: number | null;
    gender?: string | null;
    country?: string | null;
    city?: string | null;
    district?: string | null;
    phone?: string | null;
}

/**
 * User Profile DTO
 */
export type UserProfileDTO = Profile;
