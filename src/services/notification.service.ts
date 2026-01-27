import { sendEmail } from '@/utils/mail';
import { logger } from '@/lib/logger/logger';

/**
 * Notification Service
 * Handles sending notifications via email
 * Note: Using simple string messages until React email templates are created
 */
export class NotificationService {
    /**
     * Send booking confirmation email to customer
     */
    async sendBookingConfirmation(params: {
        customerEmail: string;
        customerName: string;
        eventTitle: string;
        eventDate: string;
        bookingId: string;
        totalAmount: number;
        ticketCount: number;
    }) {
        logger.info('NotificationService: Sending booking confirmation', {
            email: params.customerEmail,
            eventTitle: params.eventTitle
        });

        try {
            // TODO: Create React email template for booking confirmation
            await sendEmail({
                to: params.customerEmail,
                subject: `Booking Confirmed: ${params.eventTitle}`,
                react: null // Will be replaced with React email template
            });

            logger.info('Booking confirmation sent successfully', {
                bookingId: params.bookingId
            });
        } catch (error) {
            logger.error('Failed to send booking confirmation', { error, params });
            // Don't throw - notification failure shouldn't break the booking
        }
    }

    /**
     * Send booking status update to customer
     */
    async sendBookingStatusUpdate(params: {
        customerEmail: string;
        customerName: string;
        eventTitle: string;
        bookingId: string;
        status: string;
    }) {
        logger.info('NotificationService: Sending booking status update', {
            email: params.customerEmail,
            status: params.status
        });

        try {
            // TODO: Create React email template for status update
            await sendEmail({
                to: params.customerEmail,
                subject: `Booking Update: ${params.eventTitle}`,
                react: null
            });

            logger.info('Booking status update sent successfully', {
                bookingId: params.bookingId
            });
        } catch (error) {
            logger.error('Failed to send booking status update', { error, params });
        }
    }

    /**
     * Send new booking notification to vendor
     */
    async sendVendorNewBooking(params: {
        vendorEmail: string;
        vendorName: string;
        customerName: string;
        eventTitle: string;
        bookingId: string;
        totalAmount: number;
    }) {
        logger.info('NotificationService: Sending new booking notification to vendor', {
            email: params.vendorEmail
        });

        try {
            // TODO: Create React email template for vendor notification
            await sendEmail({
                to: params.vendorEmail,
                subject: `New Booking: ${params.eventTitle}`,
                react: null
            });

            logger.info('Vendor new booking notification sent successfully');
        } catch (error) {
            logger.error('Failed to send vendor new booking notification', { error, params });
        }
    }

    /**
     * Send password reset email
     */
    async sendPasswordReset(params: {
        email: string;
        resetLink: string;
    }) {
        logger.info('NotificationService: Sending password reset', {
            email: params.email
        });

        try {
            // TODO: Create React email template for password reset
            await sendEmail({
                to: params.email,
                subject: 'Password Reset Request',
                react: null
            });

            logger.info('Password reset email sent successfully');
        } catch (error) {
            logger.error('Failed to send password reset email', { error, params });
            throw error; // Re-throw for password reset failures
        }
    }

    /**
     * Send welcome email to new user
     */
    async sendWelcomeEmail(params: {
        email: string;
        name: string;
    }) {
        logger.info('NotificationService: Sending welcome email', {
            email: params.email
        });

        try {
            // TODO: Create React email template for welcome email
            await sendEmail({
                to: params.email,
                subject: 'Welcome to NuqtaIST!',
                react: null
            });

            logger.info('Welcome email sent successfully');
        } catch (error) {
            logger.error('Failed to send welcome email', { error, params });
        }
    }

    /**
     * Send review request to customer after event
     */
    async sendReviewRequest(params: {
        customerEmail: string;
        customerName: string;
        eventTitle: string;
        eventId: string;
    }) {
        logger.info('NotificationService: Sending review request', {
            email: params.customerEmail
        });

        try {
            // TODO: Create React email template for review request
            await sendEmail({
                to: params.customerEmail,
                subject: `How was ${params.eventTitle}?`,
                react: null
            });

            logger.info('Review request sent successfully');
        } catch (error) {
            logger.error('Failed to send review request', { error, params });
        }
    }
}
