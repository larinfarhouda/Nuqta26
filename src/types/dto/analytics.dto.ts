/**
 * Analytics DTOs for Vendor Dashboard
 */

/**
 * Vendor Analytics Overview
 */
export interface VendorAnalyticsDTO {
    revenue: number;
    sales: number;
    events: number;
    recentSales: number;
}

/**
 * Event Type Distribution Item
 */
export interface EventTypeDistributionItem {
    name: string;
    value: number;
}

/**
 * Customer Loyalty Category
 */
export interface CustomerLoyaltyItem {
    name: string;
    value: number;
}

/**
 * Gender Distribution Item
 */
export interface GenderDistributionItem {
    name: string;
    value: number;
}

/**
 * Age Distribution Item
 */
export interface AgeDistributionItem {
    name: string;
    value: number;
}

/**
 * Segmentation Data
 */
export interface SegmentationDataDTO {
    typeDistribution: EventTypeDistributionItem[];
    customerLoyalty: CustomerLoyaltyItem[];
    genderDistribution: GenderDistributionItem[];
    ageDistribution: AgeDistributionItem[];
}
