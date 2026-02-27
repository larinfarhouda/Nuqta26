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
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Cairo',Verdana,sans-serif;">
  <div style="max-width:465px;margin:40px auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:20px;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
    <!-- Logo -->
    <div style="text-align:center;margin:20px 0 32px;">
      <img src="${baseUrl}/nuqta_logo_transparent.png" width="120" alt="Nuqta" style="display:inline-block;" />
    </div>

    <!-- Arabic Section -->
    <div dir="rtl" style="text-align:right;margin-bottom:24px;">
      <h1 style="font-size:20px;font-weight:bold;color:#2CA58D;margin-bottom:16px;font-family:'Cairo',Verdana,sans-serif;">كيف كانت تجربتك؟ ⭐</h1>
      <p style="color:#374151;font-size:16px;line-height:1.6;margin-bottom:12px;font-family:'Cairo',Verdana,sans-serif;">مرحباً ${params.customerName}،</p>
      <p style="color:#374151;font-size:16px;line-height:1.6;margin-bottom:24px;font-family:'Cairo',Verdana,sans-serif;">نأمل أنك استمتعت بفعالية <strong>${params.eventTitle}</strong>! رأيك يهمنا ويساعد الآخرين في اتخاذ قرارهم.</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${reviewUrl}" style="background:#2CA58D;color:white;font-weight:bold;padding:14px 32px;border-radius:12px;text-decoration:none;display:inline-block;font-size:16px;font-family:'Cairo',Verdana,sans-serif;">اكتب تقييمك</a>
      </div>
    </div>

    <!-- Divider -->
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

    <!-- English Section -->
    <div dir="ltr" style="text-align:left;margin-bottom:24px;">
      <h1 style="font-size:20px;font-weight:bold;color:#2CA58D;margin-bottom:16px;font-family:'Cairo',Verdana,sans-serif;">How was your experience? ⭐</h1>
      <p style="color:#374151;font-size:16px;line-height:1.6;margin-bottom:12px;font-family:'Cairo',Verdana,sans-serif;">Hi ${params.customerName},</p>
      <p style="color:#374151;font-size:16px;line-height:1.6;margin-bottom:24px;font-family:'Cairo',Verdana,sans-serif;">We hope you enjoyed <strong>${params.eventTitle}</strong>! Your feedback helps others and means a lot to us.</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${reviewUrl}" style="background:#2CA58D;color:white;font-weight:bold;padding:14px 32px;border-radius:12px;text-decoration:none;display:inline-block;font-size:16px;font-family:'Cairo',Verdana,sans-serif;">Write a Review</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top:32px;padding-top:32px;border-top:1px solid #f3f4f6;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0;">© ${new Date().getFullYear()} Nuqta. جميع الحقوق محفوظة. | All rights reserved.</p>
      <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:8px 0 0;">Istanbul, Turkey</p>
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

        const dateStrAr = new Date(params.eventDate).toLocaleDateString('ar-SA', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
        });
        const dateStrEn = new Date(params.eventDate).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
        });
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nuqta.ist';

        const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Cairo',Verdana,sans-serif;">
  <div style="max-width:465px;margin:40px auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:20px;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
    <!-- Logo -->
    <div style="text-align:center;margin:20px 0 32px;">
      <img src="${baseUrl}/nuqta_logo_transparent.png" width="120" alt="Nuqta" style="display:inline-block;" />
    </div>

    <!-- Arabic Section -->
    <div dir="rtl" style="text-align:right;margin-bottom:24px;">
      <h1 style="font-size:20px;font-weight:bold;color:#2CA58D;margin-bottom:16px;font-family:'Cairo',Verdana,sans-serif;">نراك غداً! 👋</h1>
      <p style="color:#374151;font-size:16px;line-height:1.6;margin-bottom:12px;font-family:'Cairo',Verdana,sans-serif;">مرحباً ${params.customerName}،</p>
      <p style="color:#374151;font-size:16px;line-height:1.6;margin-bottom:24px;font-family:'Cairo',Verdana,sans-serif;">هذا تذكير ودي بأن لديك فعالية قادمة غداً. نحن متشوقون لرؤيتك هناك!</p>
    </div>

    <!-- Divider -->
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

    <!-- English Section -->
    <div dir="ltr" style="text-align:left;margin-bottom:24px;">
      <h1 style="font-size:20px;font-weight:bold;color:#2CA58D;margin-bottom:16px;font-family:'Cairo',Verdana,sans-serif;">See you tomorrow! 👋</h1>
      <p style="color:#374151;font-size:16px;line-height:1.6;margin-bottom:12px;font-family:'Cairo',Verdana,sans-serif;">Hi ${params.customerName},</p>
      <p style="color:#374151;font-size:16px;line-height:1.6;margin-bottom:24px;font-family:'Cairo',Verdana,sans-serif;">This is a friendly reminder that you have an upcoming event tomorrow. We can't wait to see you there!</p>
    </div>

    <!-- Divider -->
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

    <!-- Bilingual Event Details -->
    <div style="margin-bottom:24px;">
      <p style="font-size:12px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">الفعالية | Event</p>
      <p style="font-size:18px;font-weight:bold;color:#111827;margin:0 0 16px;">${params.eventTitle}</p>

      <p style="font-size:12px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">التاريخ | Date</p>
      <p style="font-size:16px;color:#111827;margin:0 0 4px;direction:rtl;text-align:right;">${dateStrAr}</p>
      <p style="font-size:16px;color:#111827;margin:0 0 16px;">${dateStrEn}</p>

      ${params.eventTime ? `
      <p style="font-size:12px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">الوقت | Time</p>
      <p style="font-size:16px;color:#111827;margin:0 0 16px;">${params.eventTime}</p>
      ` : ''}

      <p style="font-size:12px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">الموقع | Location</p>
      <p style="font-size:16px;color:#111827;margin:0;">${params.location}</p>
      ${params.locationUrl ? `<p style="margin:4px 0 0;"><a href="${params.locationUrl}" style="color:#2CA58D;font-size:14px;text-decoration:underline;">عرض على الخريطة | View on Map</a></p>` : ''}
    </div>

    <!-- Booking Reference -->
    <div style="margin-bottom:8px;">
      <p style="font-size:12px;color:#9ca3af;">رقم الحجز | Booking ID: ${params.bookingId}</p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-top:24px;">
      <a href="${ticketUrl}" style="color:#6b7280;font-size:14px;text-decoration:underline;">عرض تفاصيل الحجز | View Booking Details</a>
    </div>

    <!-- Footer -->
    <div style="margin-top:32px;padding-top:32px;border-top:1px solid #f3f4f6;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0;">© ${new Date().getFullYear()} Nuqta. جميع الحقوق محفوظة. | All rights reserved.</p>
      <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:8px 0 0;">Istanbul, Turkey</p>
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
