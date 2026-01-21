import { NextResponse } from 'next/server';
import { sendEmail } from '@/utils/mail';
import { Html, Heading, Text } from '@react-email/components';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const to = searchParams.get('to') || 'delivered@resend.dev'; // Default to Resend's success sink

    // Simple Test Template
    const TestTemplate = () => (
        <Html>
        <Heading>Email Integration Test 🚀</Heading>
            < Text > This is a test email from your Nuqta app integration.</Text>
                < Text > If you received this, your Resend API Key is working correctly! </Text>
                    < Text > Timestamp: { new Date().toISOString() } </Text>
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
}
