/**
 * Backfill Event Slugs
 * 
 * One-time script to regenerate slugs for events that have
 * empty, purely-numeric, or ID-based slugs.
 * 
 * Usage:
 *   npx tsx scripts/backfill-slugs.ts
 * 
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * environment variables (loaded from .env.local automatically).
 */

/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local', override: true });

import { createClient } from '@supabase/supabase-js';

// Simple slugify (same logic as src/utils/slugify.ts)
function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/[^\p{L}\p{N}-]+/gu, '')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '');
}

function needsNewSlug(slug: string | null): boolean {
    if (!slug || slug.trim() === '') return true;
    // Purely numeric (possibly negative) — was using event ID
    if (/^-?\d+$/.test(slug)) return true;
    // Ends with a long numeric suffix from Date.now() and has no letters
    if (/^-?\d{10,}$/.test(slug)) return true;
    return false;
}

async function main() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch all events
    const { data: events, error } = await supabase
        .from('events')
        .select('id, title, slug');

    if (error) {
        console.error('Failed to fetch events:', error.message);
        process.exit(1);
    }

    if (!events || events.length === 0) {
        console.log('No events found.');
        return;
    }

    const toUpdate = events.filter(e => needsNewSlug(e.slug));
    console.log(`Found ${events.length} total events, ${toUpdate.length} need slug updates.`);

    if (toUpdate.length === 0) {
        console.log('All slugs look good!');
        return;
    }

    // Collect all existing slugs for uniqueness checks
    const existingSlugs = new Set(
        events.filter(e => !needsNewSlug(e.slug)).map(e => e.slug!)
    );

    let updated = 0;
    let failed = 0;

    for (const event of toUpdate) {
        let newSlug = slugify(event.title || '');

        // If slugify produces empty (e.g. title is all symbols), use event ID prefix
        if (!newSlug) {
            newSlug = `event-${event.id.slice(0, 8)}`;
        }

        // Ensure uniqueness
        let finalSlug = newSlug;
        let counter = 1;
        while (existingSlugs.has(finalSlug)) {
            finalSlug = `${newSlug}-${counter}`;
            counter++;
        }

        existingSlugs.add(finalSlug);

        const { error: updateError } = await supabase
            .from('events')
            .update({ slug: finalSlug })
            .eq('id', event.id);

        if (updateError) {
            console.error(`  ✗ Failed to update event ${event.id}: ${updateError.message}`);
            failed++;
        } else {
            console.log(`  ✓ ${event.title}: "${event.slug}" → "${finalSlug}"`);
            updated++;
        }
    }

    console.log(`\nDone! Updated: ${updated}, Failed: ${failed}`);
}

main().catch(console.error);
