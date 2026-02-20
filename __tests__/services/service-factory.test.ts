// Mock problematic imports that use browser APIs
jest.mock('@react-email/components', () => ({}));
jest.mock('@react-email/render', () => ({ render: jest.fn() }));
jest.mock('@/components/emails/BookingUserTemplate', () => ({ default: jest.fn() }));
jest.mock('@/components/emails/BookingVendorTemplate', () => ({ default: jest.fn() }));
jest.mock('@/components/emails/NewSignupAdminTemplate', () => ({ default: jest.fn() }));
jest.mock('@/components/emails/WelcomeTemplate', () => ({ default: jest.fn() }));
jest.mock('@/components/emails/NotificationTemplate', () => ({ default: jest.fn() }));
jest.mock('@/components/emails/EventReminderTemplate', () => ({ default: jest.fn() }));
jest.mock('@/components/emails/EventSoldOutTemplate', () => ({ default: jest.fn() }));
jest.mock('@/components/emails/ReviewReceivedTemplate', () => ({ default: jest.fn() }));
jest.mock('@/components/emails/AuthActionTemplate', () => ({ default: jest.fn() }));
jest.mock('@/components/emails/EmailLayout', () => ({ default: jest.fn() }));
jest.mock('@/utils/mail', () => ({ sendEmail: jest.fn() }));

import { ServiceFactory } from '@/services/service-factory';

const mockSupabase = {} as any;

describe('ServiceFactory', () => {
    let factory: ServiceFactory;

    beforeEach(() => {
        factory = new ServiceFactory(mockSupabase);
    });

    it('should create EventService', () => {
        expect(factory.getEventService()).toBeDefined();
    });

    it('should create BookingService', () => {
        expect(factory.getBookingService()).toBeDefined();
    });

    it('should create UserService', () => {
        expect(factory.getUserService()).toBeDefined();
    });

    it('should create VendorService', () => {
        expect(factory.getVendorService()).toBeDefined();
    });

    it('should create CategoryService', () => {
        expect(factory.getCategoryService()).toBeDefined();
    });

    it('should create ReviewService', () => {
        expect(factory.getReviewService()).toBeDefined();
    });

    it('should create DiscountService', () => {
        expect(factory.getDiscountService()).toBeDefined();
    });

    it('should create AnalyticsService', () => {
        expect(factory.getAnalyticsService()).toBeDefined();
    });

    it('should create NotificationService', () => {
        expect(factory.getNotificationService()).toBeDefined();
    });

    it('should create AdminService', () => {
        expect(factory.getAdminService()).toBeDefined();
    });

    it('should return BookingRepository', () => {
        expect(factory.getBookingRepository()).toBeDefined();
    });

    it('should return EventRepository', () => {
        expect(factory.getEventRepository()).toBeDefined();
    });

    it('should return same repo instance across calls', () => {
        const repo1 = factory.getEventRepository();
        const repo2 = factory.getEventRepository();
        expect(repo1).toBe(repo2);
    });
});
