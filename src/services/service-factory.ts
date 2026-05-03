import { SupabaseClient } from '@supabase/supabase-js';
import { EventRepository } from '@/repositories/event.repository';
import { BookingRepository } from '@/repositories/booking.repository';
import { UserRepository } from '@/repositories/user.repository';
import { VendorRepository } from '@/repositories/vendor.repository';
import { TicketRepository } from '@/repositories/ticket.repository';
import { CategoryRepository } from '@/repositories/category.repository';
import { ReviewRepository } from '@/repositories/review.repository';
import { DiscountRepository } from '@/repositories/discount.repository';
import { AnalyticsRepository } from '@/repositories/analytics.repository';
import { CountryRepository } from '@/repositories/country.repository';
import { SubscriptionTierRepository } from '@/repositories/subscription-tier.repository';
import {
    AdminDashboardRepository,
    AdminVendorRepository,
    AdminPaymentRepository,
    AdminModerationRepository,
    AdminProspectRepository,
    AdminActivityRepository,
} from '@/repositories/admin/index';
import { EventService } from '@/services/event.service';
import { BookingService } from '@/services/booking.service';
import { UserService } from '@/services/user.service';
import { VendorService } from '@/services/vendor.service';
import { CategoryService } from '@/services/category.service';
import { ReviewService } from '@/services/review.service';
import { DiscountService } from '@/services/discount.service';
import { AnalyticsService } from '@/services/analytics.service';
import { NotificationService } from '@/services/notification.service';
import { AdminService } from '@/services/admin.service';
import { CountryService } from '@/services/country.service';
import { SubscriptionTierService } from '@/services/subscription-tier.service';

/**
 * Service Factory
 * Creates and initializes services with their dependencies.
 * Service instances are cached (lazy singleton per factory instance)
 * to avoid unnecessary object allocation.
 */
export class ServiceFactory {
    // Repositories (created eagerly — lightweight constructors)
    private eventRepo: EventRepository;
    private bookingRepo: BookingRepository;
    private userRepo: UserRepository;
    private vendorRepo: VendorRepository;
    private ticketRepo: TicketRepository;
    private categoryRepo: CategoryRepository;
    private reviewRepo: ReviewRepository;
    private discountRepo: DiscountRepository;
    private analyticsRepo: AnalyticsRepository;
    private countryRepo: CountryRepository;
    private subscriptionTierRepo: SubscriptionTierRepository;

    // Admin repositories (focused)
    private adminDashboardRepo: AdminDashboardRepository;
    private adminVendorRepo: AdminVendorRepository;
    private adminPaymentRepo: AdminPaymentRepository;
    private adminModerationRepo: AdminModerationRepository;
    private adminProspectRepo: AdminProspectRepository;
    private adminActivityRepo: AdminActivityRepository;

    // Cached service instances (created lazily)
    private _eventService?: EventService;
    private _bookingService?: BookingService;
    private _userService?: UserService;
    private _vendorService?: VendorService;
    private _categoryService?: CategoryService;
    private _reviewService?: ReviewService;
    private _discountService?: DiscountService;
    private _analyticsService?: AnalyticsService;
    private _notificationService?: NotificationService;
    private _adminService?: AdminService;
    private _countryService?: CountryService;
    private _subscriptionTierService?: SubscriptionTierService;

    constructor(private supabase: SupabaseClient) {
        // Initialize all repositories
        this.eventRepo = new EventRepository(supabase);
        this.bookingRepo = new BookingRepository(supabase);
        this.userRepo = new UserRepository(supabase);
        this.vendorRepo = new VendorRepository(supabase);
        this.ticketRepo = new TicketRepository(supabase);
        this.categoryRepo = new CategoryRepository(supabase);
        this.reviewRepo = new ReviewRepository(supabase);
        this.discountRepo = new DiscountRepository(supabase);
        this.analyticsRepo = new AnalyticsRepository(supabase);
        this.countryRepo = new CountryRepository(supabase);
        this.subscriptionTierRepo = new SubscriptionTierRepository(supabase);

        // Admin repositories (focused, replacing monolithic AdminRepository)
        this.adminDashboardRepo = new AdminDashboardRepository(supabase);
        this.adminVendorRepo = new AdminVendorRepository(supabase);
        this.adminPaymentRepo = new AdminPaymentRepository(supabase);
        this.adminModerationRepo = new AdminModerationRepository(supabase);
        this.adminProspectRepo = new AdminProspectRepository(supabase);
        this.adminActivityRepo = new AdminActivityRepository(supabase);
    }

    /**
     * Get EventService (cached)
     */
    getEventService(): EventService {
        if (!this._eventService) {
            this._eventService = new EventService(
                this.eventRepo,
                this.ticketRepo,
                this.vendorRepo,
                this.reviewRepo,
                this.discountRepo,
                this.categoryRepo
            );
        }
        return this._eventService;
    }

    /**
     * Get BookingService (cached)
     */
    getBookingService(): BookingService {
        if (!this._bookingService) {
            this._bookingService = new BookingService(
                this.bookingRepo,
                this.eventRepo,
                this.ticketRepo,
                this.userRepo,
                this.vendorRepo
            );
        }
        return this._bookingService;
    }

    /**
     * Get UserService (cached)
     */
    getUserService(): UserService {
        if (!this._userService) {
            this._userService = new UserService(this.userRepo);
        }
        return this._userService;
    }

    /**
     * Get VendorService (cached)
     */
    getVendorService(): VendorService {
        if (!this._vendorService) {
            this._vendorService = new VendorService(this.vendorRepo, this.ticketRepo, this.categoryRepo);
        }
        return this._vendorService;
    }

    /**
     * Get CategoryService (cached)
     */
    getCategoryService(): CategoryService {
        if (!this._categoryService) {
            this._categoryService = new CategoryService(this.categoryRepo);
        }
        return this._categoryService;
    }

    /**
     * Get ReviewService (cached)
     */
    getReviewService(): ReviewService {
        if (!this._reviewService) {
            this._reviewService = new ReviewService(this.reviewRepo, this.userRepo);
        }
        return this._reviewService;
    }

    /**
     * Get DiscountService (cached)
     */
    getDiscountService(): DiscountService {
        if (!this._discountService) {
            this._discountService = new DiscountService(this.discountRepo, this.eventRepo);
        }
        return this._discountService;
    }

    /**
     * Get AnalyticsService (cached)
     */
    getAnalyticsService(): AnalyticsService {
        if (!this._analyticsService) {
            this._analyticsService = new AnalyticsService(this.analyticsRepo);
        }
        return this._analyticsService;
    }

    /**
     * Get NotificationService (cached)
     */
    getNotificationService(): NotificationService {
        if (!this._notificationService) {
            this._notificationService = new NotificationService();
        }
        return this._notificationService;
    }

    /**
     * Get AdminService (cached)
     * Uses 6 focused admin repositories instead of monolithic AdminRepository.
     */
    getAdminService(): AdminService {
        if (!this._adminService) {
            this._adminService = new AdminService(
                this.adminDashboardRepo,
                this.adminVendorRepo,
                this.adminPaymentRepo,
                this.adminModerationRepo,
                this.adminProspectRepo,
                this.adminActivityRepo,
            );
        }
        return this._adminService;
    }

    /**
     * Get CountryService (cached)
     */
    getCountryService(): CountryService {
        if (!this._countryService) {
            this._countryService = new CountryService(this.countryRepo);
        }
        return this._countryService;
    }

    /**
     * Get SubscriptionTierService (cached)
     */
    getSubscriptionTierService(): SubscriptionTierService {
        if (!this._subscriptionTierService) {
            this._subscriptionTierService = new SubscriptionTierService(this.subscriptionTierRepo);
        }
        return this._subscriptionTierService;
    }
}
