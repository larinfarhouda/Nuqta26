import { SupabaseClient } from '@supabase/supabase-js';
import { EventRepository } from '@/repositories/event.repository';
import { BookingRepository } from '@/repositories/booking.repository';
import { UserRepository } from '@/repositories/user.repository';
import { VendorRepository } from '@/repositories/vendor.repository';
import { TicketRepository } from '@/repositories/ticket.repository';
import { CategoryRepository } from '@/repositories/category.repository';
import { ReviewRepository } from '@/repositories/review.repository';
import { DiscountRepository } from '@/repositories/discount.repository';
import { EventService } from '@/services/event.service';
import { BookingService } from '@/services/booking.service';
import { UserService } from '@/services/user.service';
import { VendorService } from '@/services/vendor.service';
import { CategoryService } from '@/services/category.service';
import { ReviewService } from '@/services/review.service';
import { DiscountService } from '@/services/discount.service';
import { NotificationService } from '@/services/notification.service';

/**
 * Service Factory
 * Creates and initializes services with their dependencies
 */
export class ServiceFactory {
    private eventRepo: EventRepository;
    private bookingRepo: BookingRepository;
    private userRepo: UserRepository;
    private vendorRepo: VendorRepository;
    private ticketRepo: TicketRepository;
    private categoryRepo: CategoryRepository;
    private reviewRepo: ReviewRepository;
    private discountRepo: DiscountRepository;

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
    }

    /**
     * Get EventService
     */
    getEventService(): EventService {
        return new EventService(
            this.eventRepo,
            this.ticketRepo,
            this.vendorRepo,
            this.reviewRepo,
            this.discountRepo,
            this.categoryRepo
        );
    }

    /**
     * Get BookingService
     */
    getBookingService(): BookingService {
        return new BookingService(
            this.bookingRepo,
            this.eventRepo,
            this.ticketRepo,
            this.userRepo,
            this.vendorRepo
        );
    }

    /**
     * Get UserService
     */
    getUserService(): UserService {
        return new UserService(this.userRepo);
    }

    /**
     * Get VendorService
     */
    getVendorService(): VendorService {
        return new VendorService(this.vendorRepo, this.ticketRepo, this.categoryRepo);
    }

    /**
     * Get CategoryService
     */
    getCategoryService(): CategoryService {
        return new CategoryService(this.categoryRepo);
    }

    /**
     * Get ReviewService
     */
    getReviewService(): ReviewService {
        return new ReviewService(this.reviewRepo, this.userRepo);
    }

    /**
     * Get DiscountService
     */
    getDiscountService(): DiscountService {
        return new DiscountService(this.discountRepo, this.eventRepo);
    }

    /**
     * Get NotificationService
     */
    getNotificationService(): NotificationService {
        return new NotificationService();
    }
}
