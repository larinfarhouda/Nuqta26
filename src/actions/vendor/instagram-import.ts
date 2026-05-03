'use server';

import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger/logger';
import { extractEventFromCaption } from '@/lib/gemini';
import { optimizeImageBuffer } from '@/utils/image-optimizer';

/**
 * Instagram Import — Server Action
 * Fetches an Instagram post's image and caption, uses Gemini AI to extract
 * structured event data, optimizes and uploads the image to Supabase.
 */

export interface InstagramImportResult {
    title: string;
    description: string;
    date?: string;
    end_date?: string;
    location_name?: string;
    location_lat?: number;
    location_long?: number;
    district?: string;
    city?: string;
    country?: string;
    capacity?: number;
    category_id?: string;
    event_type?: string;
    image_url?: string;
    tickets?: { name: string; price: number; quantity: number }[];
    instagram_url: string;
    needsFallback?: boolean;
}

interface ImportResponse {
    success?: boolean;
    data?: InstagramImportResult;
    error?: string;
    needsFallback?: boolean;
}

// ─── URL Validation ───────────────────────────────────────────────

function isValidInstagramUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        const isInstagram = parsed.hostname === 'www.instagram.com'
            || parsed.hostname === 'instagram.com'
            || parsed.hostname === 'm.instagram.com';
        const isPost = /^\/(p|reel|reels)\/[\w-]+/.test(parsed.pathname);
        return isInstagram && isPost;
    } catch {
        return false;
    }
}

// ─── Instagram Embed Fetching ─────────────────────────────────────
//
// Instagram no longer includes OG meta tags in post HTML (fully JS-rendered).
// The /embed/ endpoint still embeds post data as JSON in a <script> tag,
// including caption, image URLs, location, and timestamps.

interface InstagramOGData {
    image: string | null;
    caption: string | null;
    title: string | null;
}

function buildEmbedUrl(url: string): string {
    // Extract the post shortcode from any Instagram URL format
    try {
        const parsed = new URL(url);
        const pathMatch = parsed.pathname.match(/^\/(p|reel|reels)\/([\w-]+)/);
        if (pathMatch) {
            return `https://www.instagram.com/${pathMatch[1]}/${pathMatch[2]}/embed/`;
        }
    } catch { /* fall through */ }
    // Fallback: append /embed/ to cleaned URL
    const cleanUrl = url.split('?')[0].replace(/\/+$/, '');
    return `${cleanUrl}/embed/`;
}

async function fetchInstagramOG(url: string): Promise<InstagramOGData> {
    const embedUrl = buildEmbedUrl(url);

    const response = await fetch(embedUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'Cache-Control': 'no-cache',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
        throw new Error(`Instagram embed returned ${response.status}`);
    }

    const html = await response.text();

    // The embed HTML contains a JSON blob with all post data.
    const extracted = extractDataFromEmbed(html);

    logger.info('Instagram embed fetch result', {
        hasCaption: !!extracted.caption,
        captionLength: extracted.caption?.length ?? 0,
        hasImage: !!extracted.imageUrl,
    });

    return {
        image: extracted.imageUrl,
        caption: extracted.caption,
        title: null, // Not needed — caption is the source of truth
    };
}

/**
 * Extract caption, image URL, and location from embed HTML using JSON.parse.
 *
 * Instagram embed pages contain a ServerJS.handle({...}) call with nested JSON.
 * Path: .require[*][3][0].contextJSON → JSON string → .gql_data.shortcode_media
 *
 * Using JSON.parse handles all escaping layers automatically.
 */
interface EmbedExtractedData {
    caption: string | null;
    imageUrl: string | null;
}

function extractDataFromEmbed(html: string): EmbedExtractedData {
    const result: EmbedExtractedData = { caption: null, imageUrl: null };

    try {
        // Step 1: Find the .handle({...}) JSON blob that contains our data
        const captionIdx = html.indexOf('edge_media_to_caption');
        if (captionIdx < 0) return result;

        const handleIdx = html.lastIndexOf('.handle(', captionIdx);
        if (handleIdx < 0) return result;

        const jsonStart = handleIdx + '.handle('.length;

        // Find matching closing brace
        let depth = 0;
        let jsonEnd = jsonStart;
        for (let i = jsonStart; i < html.length; i++) {
            if (html[i] === '{') depth++;
            if (html[i] === '}') depth--;
            if (depth === 0) { jsonEnd = i + 1; break; }
        }

        // Step 2: Parse the outer JSON
        const outerData = JSON.parse(html.substring(jsonStart, jsonEnd));

        // Step 3: Find the contextJSON string (contains the post data)
        const contextStr = findDeepString(outerData, 'edge_media_to_caption');
        if (!contextStr) return result;

        // Step 4: Parse the inner JSON string
        const innerData = JSON.parse(contextStr);

        // Step 5: Navigate to the media data
        const media = innerData?.gql_data?.shortcode_media
            || innerData?.context?.media
            || findMediaObject(innerData);

        if (!media) return result;

        result.caption = media.edge_media_to_caption?.edges?.[0]?.node?.text || null;
        result.imageUrl = media.display_url || null;

    } catch (error) {
        logger.warn('Failed to parse Instagram embed JSON', { error });
    }

    return result;
}

/** Recursively find a string value containing the target text */
function findDeepString(obj: unknown, target: string): string | null {
    if (typeof obj === 'string' && obj.includes(target)) return obj;
    if (Array.isArray(obj)) {
        for (const item of obj) {
            const found = findDeepString(item, target);
            if (found) return found;
        }
    }
    if (obj && typeof obj === 'object') {
        for (const val of Object.values(obj)) {
            const found = findDeepString(val, target);
            if (found) return found;
        }
    }
    return null;
}

/** Recursively find an object with edge_media_to_caption */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findMediaObject(obj: any): any | null {
    if (!obj || typeof obj !== 'object') return null;
    if ('edge_media_to_caption' in obj) return obj;
    for (const val of Object.values(obj)) {
        const found = findMediaObject(val);
        if (found) return found;
    }
    return null;
}


// ─── Image Download & Upload ──────────────────────────────────────

async function downloadAndUploadImage(
    imageUrl: string,
    vendorId: string
): Promise<string | null> {
    try {
        const supabase = await createClient();

        // Download the image
        const imageResponse = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            },
        });

        if (!imageResponse.ok) {
            logger.error('Failed to download Instagram image', { status: imageResponse.status });
            return null;
        }

        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

        // Optimize the image (resize + WebP conversion)
        const optimized = await optimizeImageBuffer(imageBuffer);

        // Upload to Supabase storage
        const fileName = `${vendorId}/ig-${Date.now()}.${optimized.extension}`;
        const { error: uploadError } = await supabase.storage
            .from('vendor-public')
            .upload(fileName, optimized.buffer, {
                contentType: optimized.mimeType,
            });

        if (uploadError) {
            logger.error('Failed to upload optimized image', { error: uploadError });
            return null;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('vendor-public')
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        logger.error('Image download/upload failed', { error });
        return null;
    }
}

// ─── Geocoding ────────────────────────────────────────────────────

interface GeocodingResult {
    lat: number;
    lng: number;
    formattedAddress: string;
    district?: string;
    city?: string;
    country?: string;
}

async function geocodeLocation(locationText: string): Promise<GeocodingResult | null> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !locationText) return null;

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationText)}&key=${apiKey}&language=ar`
        );

        if (!response.ok) return null;

        const data = await response.json();
        if (data.status !== 'OK' || !data.results?.length) return null;

        const result = data.results[0];
        const { lat, lng } = result.geometry.location;

        let district = '';
        let city = '';
        let country = '';

        for (const comp of result.address_components) {
            if (comp.types.includes('country')) country = comp.long_name;
            if (comp.types.includes('administrative_area_level_1')) city = comp.long_name;
            if (comp.types.includes('administrative_area_level_2')) district = comp.long_name;
            if (!city && comp.types.includes('locality')) city = comp.long_name;
            if (!district && (comp.types.includes('sublocality') || comp.types.includes('neighborhood'))) {
                district = comp.long_name;
            }
        }

        return { lat, lng, formattedAddress: result.formatted_address, district, city, country };
    } catch (error) {
        logger.error('Geocoding failed', { error, locationText });
        return null;
    }
}

// ─── Main Import Action ───────────────────────────────────────────

export async function importFromInstagram(
    url: string,
    fallbackCaption?: string
): Promise<ImportResponse> {
    try {
        // 1. Validate authentication
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Unauthorized' };

        // 2. Validate URL
        if (!isValidInstagramUrl(url)) {
            return { error: 'INVALID_URL' };
        }

        // 3. Try to fetch Instagram post data
        let ogData: InstagramOGData = { image: null, caption: null, title: null };
        let fetchFailed = false;

        try {
            ogData = await fetchInstagramOG(url);
        } catch (error) {
            logger.warn('Instagram fetch failed, checking for fallback', { error });
            fetchFailed = true;
        }

        // If fetch failed and no fallback caption provided, ask for manual input
        const caption = ogData.caption || fallbackCaption;
        if (!caption) {
            return { needsFallback: true };
        }

        // 4. Fetch categories for AI matching
        const { data: categories } = await supabase
            .from('categories')
            .select('id, slug, name_en, name_ar');

        // 5. Run AI extraction and image processing in parallel
        const [aiResult, imageUrl] = await Promise.all([
            // AI extraction
            extractEventFromCaption(caption, (categories || []) as any),
            // Image download + optimization + upload (if image URL available)
            ogData.image
                ? downloadAndUploadImage(ogData.image, user.id)
                : Promise.resolve(null),
        ]);

        // 6. Match category slug to UUID
        let categoryId: string | undefined;
        let eventType: string | undefined;
        if (aiResult.category_slug && categories) {
            const matchedCat = categories.find(
                c => c.slug === aiResult.category_slug || c.slug === aiResult.category_slug?.toLowerCase()
            );
            if (matchedCat) {
                categoryId = matchedCat.id;
                eventType = matchedCat.slug;
            }
        }

        // 7. Geocode the location if we got one
        let geocoded: GeocodingResult | null = null;
        const locationQuery = [aiResult.location_name, aiResult.district, aiResult.city]
            .filter(Boolean)
            .join(', ');
        if (locationQuery) {
            geocoded = await geocodeLocation(locationQuery);
        }

        // 8. Build result
        const result: InstagramImportResult = {
            title: aiResult.title || 'فعالية جديدة',
            description: aiResult.description || caption,
            date: aiResult.date || undefined,
            end_date: aiResult.end_date || undefined,
            location_name: geocoded?.formattedAddress || aiResult.location_name || undefined,
            location_lat: geocoded?.lat,
            location_long: geocoded?.lng,
            district: geocoded?.district || aiResult.district || undefined,
            city: geocoded?.city || aiResult.city || undefined,
            country: geocoded?.country || aiResult.country || undefined,
            capacity: aiResult.capacity || undefined,
            category_id: categoryId,
            event_type: eventType,
            image_url: imageUrl || undefined,
            instagram_url: url,
        };

        // Add ticket if price was extracted
        if (aiResult.ticket_price !== undefined && aiResult.ticket_price !== null) {
            result.tickets = [{
                name: aiResult.ticket_name || 'تذكرة عامة',
                price: aiResult.ticket_price,
                quantity: aiResult.capacity || 100,
            }];
        }

        logger.info('Instagram import successful', {
            url,
            title: result.title,
            hasImage: !!result.image_url,
            hasDate: !!result.date,
            hasLocation: !!result.location_lat,
            fetchFailed,
        });

        return { success: true, data: result };
    } catch (error) {
        logger.error('Instagram import failed', { error, url });
        return { error: error instanceof Error ? error.message : 'Import failed' };
    }
}
