import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

interface SendEmailParams {
    to: string | string[];
    subject: string;
    react: React.ReactNode;
}

export async function sendEmail({ to, subject, react }: SendEmailParams) {
    if (!process.env.RESEND_API_KEY || !resend) {
        console.warn('RESEND_API_KEY is not set. Email not sent.');
        return { success: false, error: 'Missing API Key' };
    }

    const fromEmail = 'Nuqta <no-reply@nuqta.ist>';

    // Log attempt in development
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Email Debug] Attempting to send email to: ${to}`);
        console.log(`[Email Debug] Subject: ${subject}`);
        console.log(`[Email Debug] From: ${fromEmail}`);
    }

    try {
        // Timeout after 10 seconds to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Email sending timed out')), 10000)
        );

        const emailPromise = resend.emails.send({
            from: fromEmail,
            to,
            subject,
            react,
        });

        const { data, error } = await Promise.race([emailPromise, timeoutPromise]) as any;

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
