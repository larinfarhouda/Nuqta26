import { sendEmail } from '@/utils/mail';
import { logger } from '@/lib/logger/logger';
import BookingUserTemplate from '@/components/emails/BookingUserTemplate';
import BookingVendorTemplate from '@/components/emails/BookingVendorTemplate';
import WelcomeTemplate from '@/components/emails/WelcomeTemplate';
import EventReminderTemplate from '@/components/emails/EventReminderTemplate';
import ReviewReceivedTemplate from '@/components/emails/ReviewReceivedTemplate';
import ReviewRequestTemplate from '@/components/emails/ReviewRequestTemplate';
import EventSoldOutTemplate from '@/components/emails/EventSoldOutTemplate';
import NewSignupAdminTemplate from '@/components/emails/NewSignupAdminTemplate';
import React from 'react';

const ADMIN_NOTIFICATION_EMAIL = 'nuqta.events@gmail.com';

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
        eventSlug: string;
        locale?: 'en' | 'ar';
    }) {
        const locale = params.locale || 'ar';
        const isAr = locale === 'ar';
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nuqta.ist';
        const reviewUrl = `${baseUrl}/${locale}/events/${params.eventSlug}?review=true`;

        logger.info('NotificationService: Sending review request', {
            email: params.customerEmail,
            eventSlug: params.eventSlug
        });

        const html = `
<!DOCTYPE html>
<html dir="${isAr ? 'rtl' : 'ltr'}" lang="${locale}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="background:white;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
    <h1 style="font-size:20px;color:#111827;margin-bottom:16px;">${isAr ? 'كيف كانت تجربتك؟ ⭐' : 'How was your experience? ⭐'}</h1>
    <p style="color:#374151;font-size:16px;line-height:1.6;">${isAr ? `مرحباً ${params.customerName}،` : `Hi ${params.customerName},`}</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;">${isAr ? `نأمل أنك استمتعت بفعالية <strong>${params.eventTitle}</strong>! رأيك يهمنا ويساعد الآخرين في اتخاذ قرارهم.` : `We hope you enjoyed <strong>${params.eventTitle}</strong>! Your feedback helps others and means a lot to us.`}</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${reviewUrl}" style="background:#0d9488;color:white;font-weight:bold;padding:14px 32px;border-radius:12px;text-decoration:none;display:inline-block;font-size:16px;">${isAr ? 'اكتب تقييمك' : 'Write a Review'}</a>
    </div>
    <p style="font-size:14px;color:#6b7280;text-align:center;">${isAr ? 'شكراً لمشاركتك! 💚' : 'Thank you for your time! 💚'}</p>
  </div>
</div>
</body>
</html>`;

        try {
            const result = await sendEmail({
                to: params.customerEmail,
                subject: isAr
                    ? `كيف كانت تجربتك في ${params.eventTitle}؟`
                    : `How was ${params.eventTitle}?`,
                html,
            });

            if (!result.success) {
                throw new Error(`Email send failed: ${(result.error as any)?.message || (result.error as any)?.name || String(result.error)}`);
            }

            logger.info('Review request sent successfully');
        } catch (error) {
            logger.error('Failed to send review request', { error, params });
            throw error;
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
        const locale = params.locale || 'ar';
        const isAr = locale === 'ar';
        const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://nuqta.ist'}/dashboard/bookings/${params.bookingId}`;

        logger.info('NotificationService: Sending event reminder', {
            email: params.customerEmail,
            eventTitle: params.eventTitle
        });

        const dateStr = new Date(params.eventDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Istanbul'
        });

        const html = `
<!DOCTYPE html>
<html dir="${isAr ? 'rtl' : 'ltr'}" lang="${locale}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="background:white;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
    <h1 style="font-size:20px;color:#111827;margin-bottom:16px;">${isAr ? 'نراك غداً! 👋' : 'See you tomorrow! 👋'}</h1>
    <p style="color:#374151;font-size:16px;line-height:1.6;">${isAr ? `مرحباً ${params.customerName}،` : `Hi ${params.customerName},`}</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;">${isAr ? 'هذا تذكير ودي بأن لديك فعالية قادمة غداً. نحن متشوقون لرؤيتك هناك!' : "This is a friendly reminder that you have an upcoming event tomorrow. We can't wait to see you there!"}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="font-size:12px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">${isAr ? 'تفاصيل الفعالية' : 'Event Details'}</p>
      <h3 style="font-size:18px;color:#115e59;margin:12px 0;">${params.eventTitle}</h3>
      <p style="margin:4px 0;color:#111827;"><strong style="color:#6b7280;">${isAr ? 'التاريخ' : 'Date'}:</strong> ${dateStr}</p>
      ${params.eventTime ? `<p style="margin:4px 0;color:#111827;"><strong style="color:#6b7280;">${isAr ? 'الوقت' : 'Time'}:</strong> ${params.eventTime}</p>` : ''}
      <p style="margin:4px 0;color:#111827;"><strong style="color:#6b7280;">${isAr ? 'الموقع' : 'Location'}:</strong> ${params.location}</p>
      ${params.locationUrl ? `<p style="margin:4px 0;"><a href="${params.locationUrl}" style="color:#0d9488;font-size:14px;">${isAr ? 'عرض على الخريطة' : 'View on Map'}</a></p>` : ''}
    </div>
    <div style="text-align:center;margin-top:24px;">
      <a href="${ticketUrl}" style="background:#0d9488;color:white;font-weight:bold;padding:12px 24px;border-radius:12px;text-decoration:none;display:inline-block;">${isAr ? 'عرض الحجز والتذاكر' : 'View Booking & Tickets'}</a>
    </div>
    <p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:24px;">Reference: ${params.bookingId}</p>
    <p style="font-size:12px;color:#9ca3af;text-align:center;">${isAr ? 'تحتاج مساعدة؟ تواصل مع المنظم مباشرة أو قم بالرد على هذا البريد.' : 'Need help? Contact the organizer directly or reply to this email.'}</p>
  </div>
</div>
</body>
</html>`;

        try {
            const result = await sendEmail({
                to: params.customerEmail,
                subject: isAr
                    ? `تذكير: ${params.eventTitle} غداً!`
                    : `Reminder: ${params.eventTitle} is tomorrow!`,
                html,
            });

            if (!result.success) {
                throw new Error(`Email send failed: ${(result.error as any)?.message || (result.error as any)?.name || String(result.error)}`);
            }

            logger.info('Event reminder sent successfully');
        } catch (error) {
            logger.error('Failed to send event reminder', { error, params });
            throw error;
        }
    }

    /**
     * Send new signup notification to admin
     * Triggered when a new customer or vendor registers
     */
    async sendNewSignupNotification(params: {
        userName: string;
        userEmail: string;
        userRole: 'user' | 'vendor';
        signupMethod: 'email' | 'google' | 'facebook';
        additionalInfo?: Record<string, string>;
    }) {
        logger.info('NotificationService: Sending new signup admin notification', {
            email: params.userEmail,
            role: params.userRole,
            method: params.signupMethod
        });

        try {
            const timestamp = new Date().toLocaleString('en-US', {
                timeZone: 'Europe/Istanbul',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            await sendEmail({
                to: ADMIN_NOTIFICATION_EMAIL,
                subject: `🆕 New ${params.userRole === 'vendor' ? 'Vendor' : 'Customer'} Signup: ${params.userName}`,
                react: React.createElement(NewSignupAdminTemplate, {
                    userName: params.userName,
                    userEmail: params.userEmail,
                    userRole: params.userRole,
                    signupMethod: params.signupMethod,
                    timestamp,
                    additionalInfo: params.additionalInfo,
                })
            });

            logger.info('New signup admin notification sent successfully', {
                userEmail: params.userEmail,
                role: params.userRole
            });
        } catch (error) {
            logger.error('Failed to send new signup admin notification', { error, params });
            // Don't throw - admin notification failure shouldn't break signup
        }
    }
}
