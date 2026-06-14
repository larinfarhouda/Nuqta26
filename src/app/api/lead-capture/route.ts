import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { NotificationService } from '@/services/notification.service';
import { logger } from '@/lib/logger/logger';

const notificationService = new NotificationService();

/**
 * POST /api/lead-capture
 * Public endpoint for the vendor landing page lead capture form.
 * Creates a prospect_vendor entry and triggers nurture emails.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { businessName, email, phone, instagram, locale } = body;

        // ─── Validate required fields ────────────────────────────────────
        if (!businessName || !email) {
            return NextResponse.json(
                { error: 'Missing required fields: businessName and email are required' },
                { status: 400 }
            );
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        const supabase = await createAdminClient();

        // ─── Check for duplicate email ───────────────────────────────────
        const { data: existing } = await supabase
            .from('prospect_vendors')
            .select('id')
            .eq('contact_email', email)
            .maybeSingle();

        if (existing) {
            return NextResponse.json(
                { error: 'A submission with this email already exists' },
                { status: 409 }
            );
        }

        // ─── Create prospect_vendor entry ────────────────────────────────
        const { data: prospect, error: insertError } = await supabase
            .from('prospect_vendors')
            .insert({
                business_name: businessName,
                contact_email: email,
                contact_phone: phone || null,
                instagram: instagram || null,
                status: 'lead',
                lead_source: 'website',
                lead_nurture_step: 1, // Step 1 sent immediately
                notes: 'Submitted via vendor landing page lead capture form',
            })
            .select('id')
            .single();

        if (insertError) {
            logger.error('Failed to create prospect_vendor', { error: insertError });
            return NextResponse.json(
                { error: 'Failed to save lead information' },
                { status: 500 }
            );
        }

        logger.info('New lead captured', {
            prospectId: prospect.id,
            businessName,
            email,
        });

        // ─── Fire-and-forget: Admin notification ─────────────────────────
        notificationService.sendNewSignupNotification({
            userName: businessName,
            userEmail: email,
            userRole: 'vendor',
            signupMethod: 'email',
            additionalInfo: {
                source: 'lead-capture',
                phone: phone || 'N/A',
                instagram: instagram || 'N/A',
            },
        });

        // ─── Fire-and-forget: Lead nurture step 1 email ──────────────────
        notificationService.sendLeadNurture({
            email,
            businessName,
            step: 1,
            locale: locale || 'en',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Error in lead-capture API:', { error });
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
