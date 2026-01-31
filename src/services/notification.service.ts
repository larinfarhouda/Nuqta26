import { sendEmail } from '@/utils/mail';
import { logger } from '@/lib/logger/logger';
import BookingUserTemplate from '@/components/emails/BookingUserTemplate';
import BookingVendorTemplate from '@/components/emails/BookingVendorTemplate';
import WelcomeTemplate from '@/components/emails/WelcomeTemplate';
import EventReminderTemplate from '@/components/emails/EventReminderTemplate';
import ReviewReceivedTemplate from '@/components/emails/ReviewReceivedTemplate';
import EventSoldOutTemplate from '@/components/emails/EventSoldOutTemplate';
import React from 'react';

/**
 * Notification Service
 * Handles sending notifications via email using React Email templates
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
        locale?: 'ar' | 'en';
    }) {
        const locale = params.locale || 'ar';
        logger.info('NotificationService: Sending booking confirmation', {
            email: params.customerEmail,
            eventTitle: params.eventTitle,
            locale
        });

        try {
            await sendEmail({
                to: params.customerEmail,
                subject: locale === 'ar'
                    ? `تم استلام طلب الحجز | Booking Request Received: ${params.eventTitle}`
                    : `Booking Request Received | تم استلام طلب الحجز: ${params.eventTitle}`,
                react: React.createElement(BookingUserTemplate, {
                    userName: params.customerName,
                    eventName: params.eventTitle,
                    bookingId: params.bookingId,
                    status: 'requested',
                    eventDate: params.eventDate,
                    locale,
                })
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
        locale?: 'ar' | 'en';
    }) {
        const locale = params.locale || 'ar';
        logger.info('NotificationService: Sending booking status update', {
            email: params.customerEmail,
            status: params.status,
            locale
        });

        try {
            await sendEmail({
                to: params.customerEmail,
                subject: locale === 'ar'
                    ? `تحديث الحجز | Booking Update: ${params.eventTitle}`
                    : `Booking Update | تحديث الحجز: ${params.eventTitle}`,
                react: React.createElement(BookingUserTemplate, {
                    userName: params.customerName,
                    eventName: params.eventTitle,
                    bookingId: params.bookingId,
                    status: params.status as 'requested' | 'confirmed' | 'cancelled',
                    locale,
                })
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
        ticketCount?: number;
        locale?: 'ar' | 'en';
    }) {
        const locale = params.locale || 'ar';
        logger.info('NotificationService: Sending new booking notification to vendor', {
            email: params.vendorEmail,
            locale
        });

        try {
            await sendEmail({
                to: params.vendorEmail,
                subject: locale === 'ar'
                    ? `طلب حجز جديد | New Booking: ${params.eventTitle}`
                    : `New Booking | طلب حجز جديد: ${params.eventTitle}`,
                react: React.createElement(BookingVendorTemplate, {
                    vendorName: params.vendorName,
                    eventName: params.eventTitle,
                    customerName: params.customerName,
                    quantity: params.ticketCount || 1,
                    totalAmount: params.totalAmount,
                    bookingId: params.bookingId,
                    locale,
                })
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
            // Note: Password reset is typically handled by Supabase Auth
            // This is a fallback for custom reset flows
            await sendEmail({
                to: params.email,
                subject: 'Password Reset Request',
                react: null // Using Supabase's built-in template
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
        locale?: 'en' | 'ar';
    }) {
        logger.info('NotificationService: Sending welcome email', {
            email: params.email
        });

        try {
            await sendEmail({
                to: params.email,
                subject: 'Welcome to Nuqta!',
                react: React.createElement(WelcomeTemplate, {
                    name: params.name,
                    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://nuqta.ist'}/dashboard`,
                    locale: params.locale || 'en',
                })
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
            await sendEmail({
                to: params.customerEmail,
                subject: `How was ${params.eventTitle}?`,
                react: null // TODO: Create ReviewRequestTemplate
            });

            logger.info('Review request sent successfully');
        } catch (error) {
            logger.error('Failed to send review request', { error, params });
        }
    }

    /**
     * Send event sold out notification to vendor
     */
    async sendEventSoldOut(params: {
        vendorEmail: string;
        vendorName: string;
        eventTitle: string;
        eventId: string;
        soldCount: number;
        locale?: 'ar' | 'en';
    }) {
        const locale = params.locale || 'ar';
        logger.info('NotificationService: Sending event sold out notification', {
            email: params.vendorEmail,
            eventId: params.eventId,
            locale
        });

        try {
            await sendEmail({
                to: params.vendorEmail,
                subject: locale === 'ar'
                    ? `🎉 اكتملت الحجوزات | Event Sold Out: ${params.eventTitle}`
                    : `🎉 Event Sold Out | اكتملت الحجوزات: ${params.eventTitle}`,
                react: React.createElement(EventSoldOutTemplate, {
                    vendorName: params.vendorName,
                    eventName: params.eventTitle,
                    eventId: params.eventId,
                    soldCount: params.soldCount,
                    locale,
                })
            });

            logger.info('Event sold out notification sent successfully');
        } catch (error) {
            logger.error('Failed to send event sold out notification', { error, params });
        }
    }

    /**
     * Send review received notification to vendor
     */
    async sendReviewReceived(params: {
        vendorEmail: string;
        vendorName: string;
        eventTitle: string;
        rating: number;
        comment?: string;
        reviewUrl: string;
        locale?: 'en' | 'ar';
    }) {
        logger.info('NotificationService: Sending review received notification', {
            email: params.vendorEmail,
            rating: params.rating
        });

        try {
            await sendEmail({
                to: params.vendorEmail,
                subject: `New ${params.rating}⭐ Review: ${params.eventTitle}`,
                react: React.createElement(ReviewReceivedTemplate, {
                    vendorName: params.vendorName,
                    eventName: params.eventTitle,
                    rating: params.rating,
                    comment: params.comment,
                    reviewUrl: params.reviewUrl,
                    locale: params.locale || 'en',
                })
            });

            logger.info('Review received notification sent successfully');
        } catch (error) {
            logger.error('Failed to send review received notification', { error, params });
        }
    }

    /**
     * Send event reminder notification to attendee
     */
    async sendEventReminder(params: {
        customerEmail: string;
        customerName: string;
        eventTitle: string;
        eventDate: string;
        eventTime?: string;
        location: string;
        locationUrl?: string;
        bookingId: string;
        locale?: 'en' | 'ar';
    }) {
        logger.info('NotificationService: Sending event reminder', {
            email: params.customerEmail,
            eventTitle: params.eventTitle
        });

        try {
            await sendEmail({
                to: params.customerEmail,
                subject: `Reminder: ${params.eventTitle} is tomorrow!`,
                react: React.createElement(EventReminderTemplate, {
                    userName: params.customerName,
                    eventName: params.eventTitle,
                    eventDate: params.eventDate,
                    eventTime: params.eventTime,
                    location: params.location,
                    locationUrl: params.locationUrl,
                    bookingId: params.bookingId,
                    ticketUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://nuqta.ist'}/dashboard/bookings/${params.bookingId}`,
                    locale: params.locale || 'en',
                })
            });

            logger.info('Event reminder sent successfully');
        } catch (error) {
            logger.error('Failed to send event reminder', { error, params });
        }
    }
}
