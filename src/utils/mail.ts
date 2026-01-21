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

    try {
        const { data, error } = await resend.emails.send({
            from: 'Nuqta <onboarding@resend.dev>', // Update this when you have a verified domain
            to,
            subject,
            react,
        });

        if (error) {
            console.error('Error sending email:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Resend Exception:', error);
        return { success: false, error };
    }
}
