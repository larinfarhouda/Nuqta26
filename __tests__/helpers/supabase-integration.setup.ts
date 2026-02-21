/**
 * Supabase Integration Test Setup
 * Creates a real Supabase client for integration testing.
 * Tests will be skipped if env vars are missing.
 */

import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env.local — next/jest may not have loaded it yet at import time
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const canRunIntegrationTests = !!(supabaseUrl && supabaseKey);

let _client: SupabaseClient | null = null;

/**
 * Get a shared Supabase client for integration tests.
 * Uses service role key if available, falls back to anon key.
 */
export function getIntegrationClient(): SupabaseClient {
    if (!supabaseUrl || !supabaseKey) {
        throw new Error(
            'Integration tests require NEXT_PUBLIC_SUPABASE_URL and ' +
            'SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local'
        );
    }

    if (!_client) {
        _client = createClient(supabaseUrl, supabaseKey);
    }

    return _client;
}

/**
 * Helper: conditionally run a describe block only when integration env is available.
 */
export const describeIntegration = canRunIntegrationTests ? describe : describe.skip;
