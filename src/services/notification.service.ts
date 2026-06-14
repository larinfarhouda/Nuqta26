import { sendEmail } from '@/utils/mail';
import { logger } from '@/lib/logger/logger';
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
            const BookingUserTemplate = (await import('@/components/emails/BookingUserTemplate')).default;
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
            const BookingUserTemplate = (await import('@/components/emails/BookingUserTemplate')).default;
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
        currencySymbol?: string;
    }) {
        const locale = params.locale || 'ar';
        logger.info('NotificationService: Sending new booking notification to vendor', {
            email: params.vendorEmail,
            locale
        });

        try {
            const BookingVendorTemplate = (await import('@/components/emails/BookingVendorTemplate')).default;
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
                    currencySymbol: params.currencySymbol,
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
            const WelcomeTemplate = (await import('@/components/emails/WelcomeTemplate')).default;
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

        try {
            const ReviewRequestTemplate = (await import('@/components/emails/ReviewRequestTemplate')).default;
            const result = await sendEmail({
                to: params.customerEmail,
                subject: isAr
                    ? `كيف كانت تجربتك في ${params.eventTitle}؟`
                    : `How was ${params.eventTitle}?`,
                react: React.createElement(ReviewRequestTemplate, {
                    userName: params.customerName,
                    eventName: params.eventTitle,
                    reviewUrl,
                    locale,
                }),
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
            const EventSoldOutTemplate = (await import('@/components/emails/EventSoldOutTemplate')).default;
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
            const ReviewReceivedTemplate = (await import('@/components/emails/ReviewReceivedTemplate')).default;
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

        try {
            const EventReminderTemplate = (await import('@/components/emails/EventReminderTemplate')).default;
            const result = await sendEmail({
                to: params.customerEmail,
                subject: isAr
                    ? `تذكير: ${params.eventTitle} غداً!`
                    : `Reminder: ${params.eventTitle} is tomorrow!`,
                react: React.createElement(EventReminderTemplate, {
                    userName: params.customerName,
                    eventName: params.eventTitle,
                    eventDate: params.eventDate,
                    eventTime: params.eventTime,
                    location: params.location,
                    locationUrl: params.locationUrl,
                    bookingId: params.bookingId,
                    ticketUrl,
                    locale,
                }),
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
            const NewSignupAdminTemplate = (await import('@/components/emails/NewSignupAdminTemplate')).default;
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

    /**
     * Send prospect follow-up email (replaces raw HTML with React Email template)
     */
    async sendProspectFollowup(params: {
        email: string;
        businessName: string;
        claimUrl: string;
        interestCount: number;
        daysSincePitch: number;
        locale: 'en' | 'ar';
    }) {
        const locale = params.locale || 'ar';
        const isAr = locale === 'ar';
        logger.info('NotificationService: Sending prospect follow-up', {
            email: params.email,
            daysSincePitch: params.daysSincePitch,
        });

        try {
            const ProspectFollowupTemplate = (await import('@/components/emails/ProspectFollowupTemplate')).default;
            const subjects: Record<number, string> = {
                3: isAr
                    ? `تذكير: ${params.businessName}، صفحتك على نقطة جاهزة!`
                    : `Reminder: ${params.businessName}, your Nuqta page is waiting!`,
                7: isAr
                    ? `فرصة أخيرة: استلم صفحتك على نقطة، ${params.businessName}`
                    : `Last chance: Claim your Nuqta page, ${params.businessName}`,
                14: isAr
                    ? `آخر إشعار: صفحة ${params.businessName} ستتم أرشفتها`
                    : `Final notice: ${params.businessName}'s page will be archived`,
            };

            await sendEmail({
                to: params.email,
                subject: subjects[params.daysSincePitch] || `Nuqta — ${params.businessName}`,
                react: React.createElement(ProspectFollowupTemplate, {
                    businessName: params.businessName,
                    claimUrl: params.claimUrl,
                    interestCount: params.interestCount,
                    daysSincePitch: params.daysSincePitch,
                    locale,
                }),
            });

            logger.info('Prospect follow-up sent successfully');
        } catch (error) {
            logger.error('Failed to send prospect follow-up', { error, params });
        }
    }

    /**
     * Send subscription expiry warning email
     */
    async sendSubscriptionWarning(params: {
        email: string;
        name: string;
        businessName: string;
        daysLeft: number;
        locale?: 'en' | 'ar';
    }) {
        const locale = params.locale || 'ar';
        const isAr = locale === 'ar';
        logger.info('NotificationService: Sending subscription warning', {
            email: params.email,
            daysLeft: params.daysLeft,
        });

        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nuqta.ist';
            const SubscriptionWarningTemplate = (await import('@/components/emails/SubscriptionWarningTemplate')).default;
            await sendEmail({
                to: params.email,
                subject: isAr
                    ? `⚠️ اشتراكك ينتهي خلال ${params.daysLeft} ${params.daysLeft > 1 ? 'أيام' : 'يوم'} | Subscription expires in ${params.daysLeft} day${params.daysLeft > 1 ? 's' : ''}`
                    : `⚠️ Subscription expires in ${params.daysLeft} day${params.daysLeft > 1 ? 's' : ''} | اشتراكك ينتهي خلال ${params.daysLeft} ${params.daysLeft > 1 ? 'أيام' : 'يوم'}`,
                react: React.createElement(SubscriptionWarningTemplate, {
                    vendorName: params.name,
                    planName: params.businessName,
                    daysLeft: params.daysLeft,
                    renewUrl: `${baseUrl}/dashboard/vendor`,
                    locale,
                }),
            });

            logger.info('Subscription warning sent successfully');
        } catch (error) {
            logger.error('Failed to send subscription warning', { error, params });
        }
    }

    /**
     * Send subscription expired notification email
     */
    async sendSubscriptionExpired(params: {
        email: string;
        name: string;
        businessName: string;
        locale?: 'en' | 'ar';
    }) {
        const locale = params.locale || 'ar';
        const isAr = locale === 'ar';
        logger.info('NotificationService: Sending subscription expired notification', {
            email: params.email,
        });

        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nuqta.ist';
            const SubscriptionExpiredTemplate = (await import('@/components/emails/SubscriptionExpiredTemplate')).default;
            await sendEmail({
                to: params.email,
                subject: isAr
                    ? `اشتراكك انتهى | Your subscription has expired — ${params.businessName}`
                    : `Your subscription has expired | اشتراكك انتهى — ${params.businessName}`,
                react: React.createElement(SubscriptionExpiredTemplate, {
                    vendorName: params.name,
                    previousPlan: params.businessName,
                    renewUrl: `${baseUrl}/dashboard/vendor`,
                    locale,
                }),
            });

            logger.info('Subscription expired notification sent successfully');
        } catch (error) {
            logger.error('Failed to send subscription expired notification', { error, params });
        }
    }

    /**
     * Send onboarding drip email
     */
    async sendOnboardingDrip(params: {
        email: string;
        name: string;
        businessName: string;
        step: number;
        locale?: 'en' | 'ar';
    }) {
        const locale = params.locale || 'ar';
        const isAr = locale === 'ar';
        logger.info('NotificationService: Sending onboarding drip', {
            email: params.email,
            step: params.step,
        });

        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nuqta.ist';
            const OnboardingDripTemplate = (await import('@/components/emails/OnboardingDripTemplate')).default;

            const stepSubjects: Record<number, { ar: string; en: string }> = {
                1: {
                    ar: `أنشئ فعاليتك الأولى في 5 دقائق | Create your first event`,
                    en: `Create your first event in 5 minutes | أنشئ فعاليتك الأولى`,
                },
                2: {
                    ar: `شارك فعاليتك واحصل على أول حضور | Share your event`,
                    en: `Share your event & get your first attendees | شارك فعاليتك`,
                },
                3: {
                    ar: `شوف تحليلاتك — مين يتابع فعالياتك | Check your analytics`,
                    en: `Check your analytics — see who's watching | شوف تحليلاتك`,
                },
                4: {
                    ar: `جاهز للنمو؟ ترقى لأكثر فعاليات | Ready to grow?`,
                    en: `Ready to grow? Upgrade for more events | جاهز للنمو؟`,
                },
                5: {
                    ar: `كيف الأمور؟ نحب نسمع رأيك | How's it going?`,
                    en: `How's it going? We'd love your feedback | كيف الأمور؟`,
                },
            };

            const subject = stepSubjects[params.step]?.[locale] || `Nuqta — Step ${params.step}`;

            await sendEmail({
                to: params.email,
                subject,
                react: React.createElement(OnboardingDripTemplate, {
                    vendorName: params.name,
                    step: params.step as 1 | 2 | 3 | 4 | 5,
                    dashboardUrl: `${baseUrl}/dashboard/vendor`,
                    locale,
                }),
            });

            logger.info('Onboarding drip sent successfully', { step: params.step });
        } catch (error) {
            logger.error('Failed to send onboarding drip', { error, params });
        }
    }

    /**
     * Send re-engagement email to inactive vendor
     */
    async sendReEngagement(params: {
        email: string;
        name: string;
        businessName: string;
        daysSinceActive: number;
        locale?: 'en' | 'ar';
    }) {
        const locale = params.locale || 'ar';
        const isAr = locale === 'ar';
        logger.info('NotificationService: Sending re-engagement email', {
            email: params.email,
            daysSinceActive: params.daysSinceActive,
        });

        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nuqta.ist';
            const ReEngagementTemplate = (await import('@/components/emails/ReEngagementTemplate')).default;
            await sendEmail({
                to: params.email,
                subject: isAr
                    ? `اشتقنالك ${params.name}! صفحتك على نقطة بانتظارك`
                    : `We miss you, ${params.name}! Your Nuqta page is waiting`,
                react: React.createElement(ReEngagementTemplate, {
                    vendorName: params.name,
                    daysSinceActive: params.daysSinceActive,
                    dashboardUrl: `${baseUrl}/dashboard/vendor`,
                    locale,
                }),
            });

            logger.info('Re-engagement email sent successfully');
        } catch (error) {
            logger.error('Failed to send re-engagement email', { error, params });
        }
    }

    /**
     * Send lead nurture email to prospect
     */
    async sendLeadNurture(params: {
        email: string;
        businessName: string;
        step: number;
        locale?: 'en' | 'ar';
    }) {
        const locale = params.locale || 'ar';
        const isAr = locale === 'ar';
        logger.info('NotificationService: Sending lead nurture email', {
            email: params.email,
            step: params.step,
        });

        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nuqta.ist';
            const LeadNurtureTemplate = (await import('@/components/emails/LeadNurtureTemplate')).default;

            const stepSubjects: Record<number, { ar: string; en: string }> = {
                1: {
                    ar: `مرحباً! إليك كيف نقطة تساعد ${params.businessName}`,
                    en: `Welcome! Here's how Nuqta can help ${params.businessName}`,
                },
                2: {
                    ar: `شوف كيف المنظمين يديرون فعالياتهم على نقطة`,
                    en: `See how organizers manage their events on Nuqta`,
                },
                3: {
                    ar: `جاهز تبدأ؟ سجّل مجاناً الآن`,
                    en: `Ready to get started? It's completely free`,
                },
            };

            const subject = stepSubjects[params.step]?.[locale] || `Nuqta — ${params.businessName}`;

            await sendEmail({
                to: params.email,
                subject,
                react: React.createElement(LeadNurtureTemplate, {
                    businessName: params.businessName,
                    step: params.step as 1 | 2 | 3,
                    registerUrl: `${baseUrl}/register?role=vendor`,
                    locale,
                }),
            });

            logger.info('Lead nurture email sent successfully', { step: params.step });
        } catch (error) {
            logger.error('Failed to send lead nurture email', { error, params });
        }
    }
}
