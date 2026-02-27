import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

interface SendEmailParams {
    to: string | string[];
    subject: string;
    react?: React.ReactNode;
    html?: string;
}

export async function sendEmail({ to, subject, react, html }: SendEmailParams) {
    if (!process.env.RESEND_API_KEY || !resend) {
        console.warn('RESEND_API_KEY is not set. Email not sent.');
        return { success: false, error: { message: 'Missing API Key' } };
    }

    const fromEmail = 'Nuqta <no-reply@nuqta.ist>';

    // Log attempt in development
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Email Debug] Attempting to send email to: ${to}`);
        console.log(`[Email Debug] Subject: ${subject}`);
        console.log(`[Email Debug] From: ${fromEmail}`);
    }

    try {
        // Build email payload - prefer html if provided, fall back to react
        const emailPayload: any = {
            from: fromEmail,
            to,
            subject,
        };

        if (html) {
            emailPayload.html = html;
        } else if (react) {
            emailPayload.react = react;
        }

        const { data, error } = await resend.emails.send(emailPayload);

        if (error) {
            console.error('Error sending email:', error);
            return { success: false, error };
        }

        console.log(`[Email Debug] Email sent successfully to ${to} (ID: ${data?.id})`);
        return { success: true, data };
    } catch (error) {
        console.error('Resend Exception:', error);
        return { success: false, error };
    }
}
