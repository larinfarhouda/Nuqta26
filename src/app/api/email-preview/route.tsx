import { render } from '@react-email/render';
import WelcomeTemplate from '@/components/emails/WelcomeTemplate';
import NotificationTemplate from '@/components/emails/NotificationTemplate';
import BookingUserTemplate from '@/components/emails/BookingUserTemplate';
import BookingVendorTemplate from '@/components/emails/BookingVendorTemplate';
import EventSoldOutTemplate from '@/components/emails/EventSoldOutTemplate';
import EventReminderTemplate from '@/components/emails/EventReminderTemplate';
import AuthActionTemplate from '@/components/emails/AuthActionTemplate';

export async function GET(request: Request) {
    if (process.env.NODE_ENV === 'production') {
        return new Response('Not Found', { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const template = searchParams.get('template');

    let component;

    switch (template) {
        case 'welcome-en':
            component = <WelcomeTemplate name="Ali" actionUrl="https://nuqta.com" locale="en" />;
            break;
        case 'welcome-ar':
            component = <WelcomeTemplate name="علي" actionUrl="https://nuqta.com" locale="ar" />;
            break;
        case 'notification':
            component = <NotificationTemplate heading="Action Required" bodyText="Please verify your phone number to continue using Nuqta services." actionLabel="Verify Phone" actionUrl="#" />;
            break;
        case 'booking-user-confirmed':
            component = <BookingUserTemplate userName="Sarah" eventName="Istanbul Jazz Festival" bookingId="BK-7829-XJ" status="confirmed" eventDate="2026-06-15" location="Harbiye Open Air Theatre" />;
            break;
        case 'booking-user-requested':
            component = <BookingUserTemplate userName="Sarah" eventName="Private Pottery Workshop" bookingId="BK-9921-AZ" status="requested" eventDate="2026-02-10" location="Balat Art Studio" />;
            break;
        case 'booking-user-cancelled':
            component = <BookingUserTemplate userName="Sarah" eventName="Bosphorus Sunset Cruise" bookingId="BK-1122-CC" status="cancelled" eventDate="2026-03-01" location="Eminönü Pier" />;
            break;
        case 'booking-vendor':
            component = <BookingVendorTemplate vendorName="Ahmed" eventName="Traditional Turkish Cooking Class" customerName="Sarah Johnson" quantity={2} totalAmount={1400} bookingId="BK-7829-XJ" />;
            break;
        case 'sold-out':
            component = <EventSoldOutTemplate vendorName="Ahmed" eventName="Traditional Turkish Cooking Class" eventId="evt-123" soldCount={25} />;
            break;
        case 'reminder-en':
            component = <EventReminderTemplate
                userName="Sarah"
                eventName="Istanbul Jazz Festival"
                eventDate="2026-06-16"
                eventTime="20:00"
                location="Harbiye Open Air Theatre"
                locationUrl="https://maps.google.com"
                bookingId="BK-7829-XJ"
                ticketUrl="https://nuqta.com/dashboard/bookings/BK-7829-XJ"
                locale="en"
            />;
            break;
        case 'reminder-ar':
            component = <EventReminderTemplate
                userName="سارة"
                eventName="مهرجان إسطنبول للجاز"
                eventDate="2026-06-16"
                eventTime="20:00"
                location="مسرح حربية المفتوح"
                locationUrl="https://maps.google.com"
                bookingId="BK-7829-XJ"
                ticketUrl="https://nuqta.com/dashboard/bookings/BK-7829-XJ"
                locale="ar"
            />;
            break;
        case 'auth-confirm':
            component = <AuthActionTemplate actionType="confirm-signup" actionUrl="https://nuqta.com/auth/confirm?token=xyz" />;
            break;
        case 'auth-reset':
            component = <AuthActionTemplate actionType="reset-password" actionUrl="https://nuqta.com/auth/reset?token=xyz" />;
            break;
        case 'auth-magic':
            component = <AuthActionTemplate actionType="magic-link" actionUrl="https://nuqta.com/auth/magic?token=xyz" />;
            break;
        case 'auth-invite':
            component = <AuthActionTemplate actionType="invite-user" actionUrl="https://nuqta.com/auth/invite?token=xyz" />;
            break;
        case 'auth-change-email':
            component = <AuthActionTemplate actionType="change-email" actionUrl="https://nuqta.com/auth/change?token=xyz" />;
            break;
        default:
            return new Response('Template not found', { status: 404 });
    }

    const html = await render(component);

    // Wrap in a basic HTML structure to ensure proper rendering in iframe
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}
