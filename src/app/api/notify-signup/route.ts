import { NextResponse } from 'next/server';
import { NotificationService } from '@/services/notification.service';

const notificationService = new NotificationService();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userName, userEmail, userRole, signupMethod, additionalInfo } = body;

        if (!userName || !userEmail || !userRole || !signupMethod) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Fire-and-forget: don't wait for the email to complete
        notificationService.sendNewSignupNotification({
            userName,
            userEmail,
            userRole,
            signupMethod,
            additionalInfo,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in notify-signup API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
