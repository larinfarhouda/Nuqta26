/**
 * Admin Repositories — Barrel Export
 * 
 * The admin data access layer is split into focused repositories
 * for maintainability and single-responsibility:
 * 
 * - DashboardRepository: Platform stats, trends, categories
 * - VendorManagementRepository: Vendor directory, status, subscription
 * - PaymentRepository: Bank transfer queue, confirmation/rejection
 * - ModerationRepository: Flagged reviews, event featuring
 * - ProspectRepository: Phantom listings, claim tokens, conversion
 * - ActivityRepository: Activity logs, user engagement
 */
export { AdminDashboardRepository } from './dashboard.repository';
export { AdminVendorRepository } from './vendor-management.repository';
export { AdminPaymentRepository } from './payment.repository';
export { AdminModerationRepository } from './moderation.repository';
export { AdminProspectRepository } from './prospect.repository';
export { AdminActivityRepository } from './activity.repository';
