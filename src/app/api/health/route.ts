import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Lightweight health check endpoint.
 * Verifies the app is running and the database is reachable.
 * Used by Sentry Uptime Monitoring (point it to /api/health).
 */
export async function GET() {
    const start = Date.now();

    try {
        const supabase = await createClient();
        // Quick, cheap query — just checks if the DB connection works
        const { error } = await supabase.from('profiles').select('id').limit(1);

        if (error) {
            return NextResponse.json(
                { status: 'degraded', db: 'error', error: error.message },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { status: 'ok', db: 'connected', latency_ms: Date.now() - start },
            { status: 200 }
        );
    } catch (err) {
        return NextResponse.json(
            { status: 'error', message: err instanceof Error ? err.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
