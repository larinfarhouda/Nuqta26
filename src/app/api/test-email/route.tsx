import { NextResponse } from 'next/server';
import { sendEmail } from '@/utils/mail';
import { Html, Heading, Text } from '@react-email/components';

export async function POST(request: Request) {
    // Restrict to non-production
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ message: 'Not available in production' }, { status: 403 });
    }

    // Basic internal security check
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const to = body.to || 'delivered@resend.dev';

        // Simple Test Template
        const TestTemplate = () => (
            <Html>
                <Heading>Email Integration Test 🚀</Heading>
                <Text>This is a test email from your Nuqta app integration.</Text>
                <Text>If you received this, your Resend API Key is working correctly!</Text>
                <Text>Timestamp: {new Date().toISOString()}</Text>
            </Html>
        );

        const result = await sendEmail({
            to,
            subject: 'Nuqta Email Test',
            react: TestTemplate(),
        });

        if (result.success) {
            return NextResponse.json({ message: 'Email sent successfully!', data: result.data }, { status: 200 });
        } else {
            return NextResponse.json({ message: 'Failed to send email', error: result.error }, { status: 500 });
        }
    } catch (err) {
        return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }
}
