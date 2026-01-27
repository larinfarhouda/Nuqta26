import { Tables } from '@/types/database.types';

// Base types from database
export type Vendor = Tables<'vendors'>;
export type VendorGallery = Tables<'vendor_gallery'>;

/**
 * Public Vendor Profile DTO
 */
export interface PublicVendorDTO {
    id: string;
    slug: string;
    business_name: string;
    description_ar: string | null;
    company_logo: string | null;
    whatsapp_number: string | null;
    website: string | null;
    category: string;
    instagram: string | null;
    banner_url: string | null;
    location_lat: number | null;
    location_long: number | null;
    gallery: GalleryItem[];
    events: VendorEventItem[];
}

/**
 * Gallery Item
 */
export interface GalleryItem {
    id: string;
    image_url: string;
    caption: string | null;
}

/**
 * Vendor Event Item
 */
export interface VendorEventItem {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    date: string;
    location_name: string | null;
    city: string | null;
    district: string | null;
    image_url: string | null;
    category: {
        name_en: string;
        name_ar: string | null;
        icon: string;
        slug: string;
    };
    tickets: TicketInfo[];
    price: number;
}

/**
 * Ticket Info
 */
export interface TicketInfo {
    id: string;
    name: string;
    price: number | null;
    capacity: number;
    sold: number | null;
}
