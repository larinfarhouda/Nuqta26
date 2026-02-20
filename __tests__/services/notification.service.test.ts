/**
 * NotificationService Tests
 * Tests for email notification sending logic
 */

import { NotificationService } from '@/services/notification.service';

// Mock the sendEmail utility
jest.mock('@/utils/mail', () => ({
    sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock React to avoid JSX transform issues
jest.mock('react', () => ({
    createElement: jest.fn().mockReturnValue('mock-react-element'),
}));

// Mock all email templates
jest.mock('@/components/emails/BookingUserTemplate', () => 'BookingUserTemplate');
jest.mock('@/components/emails/BookingVendorTemplate', () => 'BookingVendorTemplate');
jest.mock('@/components/emails/WelcomeTemplate', () => 'WelcomeTemplate');
jest.mock('@/components/emails/EventReminderTemplate', () => 'EventReminderTemplate');
jest.mock('@/components/emails/ReviewReceivedTemplate', () => 'ReviewReceivedTemplate');
jest.mock('@/components/emails/EventSoldOutTemplate', () => 'EventSoldOutTemplate');
jest.mock('@/components/emails/NewSignupAdminTemplate', () => 'NewSignupAdminTemplate');

import { sendEmail } from '@/utils/mail';

const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;

describe('NotificationService', () => {
    let notificationService: NotificationService;

    beforeEach(() => {
        notificationService = new NotificationService();
        jest.clearAllMocks();
    });

    describe('sendBookingConfirmation', () => {
        const params = {
            customerEmail: 'user@example.com',
            customerName: 'John',
            eventTitle: 'Music Concert',
            eventDate: '2026-03-01',
            bookingId: 'booking-123',
            totalAmount: 100,
            ticketCount: 2,
        };

        it('should send email with correct to and subject (Arabic default)', async () => {
            await notificationService.sendBookingConfirmation(params);

            expect(mockSendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'user@example.com',
                    subject: expect.stringContaining('Music Concert'),
                })
            );
        });

        it('should not throw when sendEmail fails', async () => {
            mockSendEmail.mockRejectedValueOnce(new Error('SMTP error'));

            await expect(
                notificationService.sendBookingConfirmation(params)
            ).resolves.not.toThrow();
        });

        it('should use English subject when locale is en', async () => {
            await notificationService.sendBookingConfirmation({ ...params, locale: 'en' });

            expect(mockSendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: expect.stringMatching(/^Booking Request Received/),
                })
            );
        });
    });

    describe('sendBookingStatusUpdate', () => {
        it('should send status update email', async () => {
            await notificationService.sendBookingStatusUpdate({
                customerEmail: 'user@example.com',
                customerName: 'John',
                eventTitle: 'Concert',
                bookingId: 'booking-123',
                status: 'confirmed',
            });

            expect(mockSendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'user@example.com',
                    subject: expect.stringContaining('Concert'),
                })
            );
        });

        it('should not throw on failure', async () => {
            mockSendEmail.mockRejectedValueOnce(new Error('fail'));

            await expect(
                notificationService.sendBookingStatusUpdate({
                    customerEmail: 'user@example.com',
                    customerName: 'John',
                    eventTitle: 'Concert',
                    bookingId: 'b-1',
                    status: 'confirmed',
                })
            ).resolves.not.toThrow();
        });
    });

    describe('sendVendorNewBooking', () => {
        it('should send notification to vendor email', async () => {
            await notificationService.sendVendorNewBooking({
                vendorEmail: 'vendor@example.com',
                vendorName: 'Vendor Co',
                customerName: 'John',
                eventTitle: 'Concert',
                bookingId: 'b-1',
                totalAmount: 200,
                ticketCount: 3,
            });

            expect(mockSendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'vendor@example.com',
                })
            );
        });
    });

    describe('sendPasswordReset', () => {
        it('should send password reset email', async () => {
            await notificationService.sendPasswordReset({
                email: 'user@example.com',
                resetLink: 'https://nuqta.ist/reset?token=abc',
            });

            expect(mockSendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'user@example.com',
                    subject: 'Password Reset Request',
                })
            );
        });

        it('should re-throw on failure (unlike other methods)', async () => {
            mockSendEmail.mockRejectedValueOnce(new Error('SMTP error'));

            await expect(
                notificationService.sendPasswordReset({
                    email: 'user@example.com',
                    resetLink: 'https://nuqta.ist/reset',
                })
            ).rejects.toThrow('SMTP error');
        });
    });

    describe('sendWelcomeEmail', () => {
        it('should send welcome email', async () => {
            await notificationService.sendWelcomeEmail({
                email: 'user@example.com',
                name: 'John',
            });

            expect(mockSendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'user@example.com',
                    subject: 'Welcome to Nuqta!',
                })
            );
        });
    });

    describe('sendReviewRequest', () => {
        it('should send review request email', async () => {
            await notificationService.sendReviewRequest({
                customerEmail: 'user@example.com',
                customerName: 'John',
                eventTitle: 'Concert',
                eventId: 'event-123',
            });

            expect(mockSendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'user@example.com',
                    subject: 'How was Concert?',
                })
            );
        });
    });

    describe('sendEventSoldOut', () => {
        it('should send sold out notification', async () => {
            await notificationService.sendEventSoldOut({
                vendorEmail: 'vendor@example.com',
                vendorName: 'Vendor',
                eventTitle: 'Concert',
                eventId: 'event-123',
                soldCount: 500,
            });

            expect(mockSendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'vendor@example.com',
                    subject: expect.stringContaining('Sold Out'),
                })
            );
        });
    });

    describe('sendReviewReceived', () => {
        it('should send review notification to vendor', async () => {
            await notificationService.sendReviewReceived({
                vendorEmail: 'vendor@example.com',
                vendorName: 'Vendor',
                eventTitle: 'Concert',
                rating: 5,
                comment: 'Great!',
                reviewUrl: 'https://nuqta.ist/reviews/123',
            });

            expect(mockSendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'vendor@example.com',
                    subject: expect.stringContaining('5⭐'),
                })
            );
        });
    });

    describe('sendEventReminder', () => {
        it('should send reminder to customer', async () => {
            await notificationService.sendEventReminder({
                customerEmail: 'user@example.com',
                customerName: 'John',
                eventTitle: 'Concert',
                eventDate: '2026-03-01',
                location: 'Istanbul',
                bookingId: 'b-1',
            });

            expect(mockSendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'user@example.com',
                    subject: 'Reminder: Concert is tomorrow!',
                })
            );
        });
    });

    describe('sendNewSignupNotification', () => {
        it('should send admin notification for new vendor signup', async () => {
            await notificationService.sendNewSignupNotification({
                userName: 'New Vendor',
                userEmail: 'vendor@example.com',
                userRole: 'vendor',
                signupMethod: 'email',
            });

            expect(mockSendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'nuqta.events@gmail.com',
                    subject: expect.stringContaining('Vendor'),
                })
            );
        });

        it('should send admin notification for new customer signup', async () => {
            await notificationService.sendNewSignupNotification({
                userName: 'New User',
                userEmail: 'user@example.com',
                userRole: 'user',
                signupMethod: 'google',
            });

            expect(mockSendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: expect.stringContaining('Customer'),
                })
            );
        });

        it('should not throw on failure', async () => {
            mockSendEmail.mockRejectedValueOnce(new Error('fail'));

            await expect(
                notificationService.sendNewSignupNotification({
                    userName: 'Test',
                    userEmail: 'test@example.com',
                    userRole: 'user',
                    signupMethod: 'email',
                })
            ).resolves.not.toThrow();
        });
    });
});
