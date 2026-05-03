import { logger } from '@/lib/logger/logger';

/**
 * Event Data Extraction — Hybrid Approach
 * 
 * 1. LOCAL EXTRACTION (always works, zero API calls):
 *    Regex-based parser that handles Arabic/English date, price, 
 *    location, and capacity patterns from Instagram captions.
 * 
 * 2. AI ENHANCEMENT (optional, if Gemini quota available):
 *    Refines the extraction with Gemini 2.0 Flash for better
 *    accuracy on complex captions. Falls back gracefully.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface Category {
    id: string;
    slug: string;
    name_en: string;
    name_ar: string;
}

export interface ExtractedEventData {
    title: string;
    description: string;
    date?: string;         // ISO format: "2026-04-20T18:00"
    end_date?: string;     // ISO format: "2026-04-20T21:00"
    location_name?: string;
    district?: string;
    city?: string;
    country?: string;
    capacity?: number;
    category_slug?: string;
    ticket_price?: number;
    ticket_name?: string;
}

// ─── Arabic Month Names ───────────────────────────────────────────

const ARABIC_MONTHS: Record<string, number> = {
    'يناير': 1, 'كانون الثاني': 1, 'جانفي': 1,
    'فبراير': 2, 'شباط': 2, 'فيفري': 2,
    'مارس': 3, 'آذار': 3,
    'أبريل': 4, 'ابريل': 4, 'نيسان': 4,
    'مايو': 5, 'أيار': 5, 'ماي': 5,
    'يونيو': 6, 'حزيران': 6, 'جوان': 6,
    'يوليو': 7, 'تموز': 7, 'جويلية': 7,
    'أغسطس': 8, 'اغسطس': 8, 'آب': 8, 'أوت': 8,
    'سبتمبر': 9, 'أيلول': 9,
    'أكتوبر': 10, 'اكتوبر': 10, 'تشرين الأول': 10,
    'نوفمبر': 11, 'تشرين الثاني': 11,
    'ديسمبر': 12, 'كانون الأول': 12,
};

const ENGLISH_MONTHS: Record<string, number> = {
    'january': 1, 'jan': 1, 'february': 2, 'feb': 2,
    'march': 3, 'mar': 3, 'april': 4, 'apr': 4,
    'may': 5, 'june': 6, 'jun': 6, 'july': 7, 'jul': 7,
    'august': 8, 'aug': 8, 'september': 9, 'sep': 9, 'sept': 9,
    'october': 10, 'oct': 10, 'november': 11, 'nov': 11,
    'december': 12, 'dec': 12,
};

// ─── Local Regex-Based Extraction ─────────────────────────────────

function extractDateLocal(text: string): string | undefined {
    const currentYear = new Date().getFullYear();
    const now = new Date();

    // Pattern 1: "25 أبريل" or "٢٥ ابريل" (Arabic day + month)
    const arabicMonthPattern = Object.keys(ARABIC_MONTHS).join('|');
    const arDateRegex = new RegExp(`(\\d{1,2})\\s+(${arabicMonthPattern})(?:\\s+(\\d{4}))?`, 'i');
    const arMatch = text.match(arDateRegex);
    if (arMatch) {
        const day = parseInt(arMatch[1], 10);
        const month = ARABIC_MONTHS[arMatch[2]];
        const year = arMatch[3] ? parseInt(arMatch[3], 10) : currentYear;
        const date = new Date(year, month - 1, day);
        if (date < now && !arMatch[3]) date.setFullYear(currentYear + 1);
        const timeStr = extractTimeLocal(text);
        return `${date.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${timeStr}`;
    }

    // Pattern 2: "April 25" or "Apr 25, 2026" (English month + day)
    const engMonthPattern = Object.keys(ENGLISH_MONTHS).join('|');
    const enDateRegex = new RegExp(`(${engMonthPattern})[.,]?\\s+(\\d{1,2})(?:[,\\s]+(\\d{4}))?`, 'i');
    const enMatch = text.match(enDateRegex);
    if (enMatch) {
        const month = ENGLISH_MONTHS[enMatch[1].toLowerCase()];
        const day = parseInt(enMatch[2], 10);
        const year = enMatch[3] ? parseInt(enMatch[3], 10) : currentYear;
        const date = new Date(year, month - 1, day);
        if (date < now && !enMatch[3]) date.setFullYear(currentYear + 1);
        const timeStr = extractTimeLocal(text);
        return `${date.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${timeStr}`;
    }

    // Pattern 3: "25/04/2026" or "2026-04-25" (numeric dates)
    const numDateRegex = /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/;
    const numMatch = text.match(numDateRegex);
    if (numMatch) {
        let day = parseInt(numMatch[1], 10);
        let month = parseInt(numMatch[2], 10);
        const year = parseInt(numMatch[3], 10);
        // If first number > 12, it's DD/MM, otherwise could be MM/DD — assume DD/MM (more common in Arabic world)
        if (day > 12 && month <= 12) { /* already DD/MM */ }
        else if (month > 12 && day <= 12) { [day, month] = [month, day]; }
        const timeStr = extractTimeLocal(text);
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${timeStr}`;
    }

    return undefined;
}

function extractTimeLocal(text: string): string {
    // Pattern: "5 مساء", "5:30 مساءً", "7 PM", "19:00", "الساعة 5"
    const arabicTimeRegex = /(?:الساعة\s*)?(\d{1,2})(?::(\d{2}))?\s*(مساء[ً]?|صباح[اً]?|ص|م)/i;
    const arTimeMatch = text.match(arabicTimeRegex);
    if (arTimeMatch) {
        let hour = parseInt(arTimeMatch[1], 10);
        const minute = arTimeMatch[2] ? parseInt(arTimeMatch[2], 10) : 0;
        const period = arTimeMatch[3];
        if ((period.startsWith('مساء') || period === 'م') && hour < 12) hour += 12;
        if ((period.startsWith('صباح') || period === 'ص') && hour === 12) hour = 0;
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }

    // English AM/PM
    const engTimeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)/i;
    const enTimeMatch = text.match(engTimeRegex);
    if (enTimeMatch) {
        let hour = parseInt(enTimeMatch[1], 10);
        const minute = enTimeMatch[2] ? parseInt(enTimeMatch[2], 10) : 0;
        const period = enTimeMatch[3].toLowerCase();
        if (period === 'pm' && hour < 12) hour += 12;
        if (period === 'am' && hour === 12) hour = 0;
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }

    // 24-hour format: "19:00" or "الساعة 19:00"
    const h24Regex = /(?:الساعة\s*)?(\d{1,2}):(\d{2})(?!\s*(?:am|pm|مساء|صباح|ص|م))/i;
    const h24Match = text.match(h24Regex);
    if (h24Match) {
        const hour = parseInt(h24Match[1], 10);
        if (hour >= 0 && hour <= 23) {
            return `${String(hour).padStart(2, '0')}:${h24Match[2]}`;
        }
    }

    // Plain "الساعة 5" without AM/PM — assume PM for events
    const plainHourRegex = /الساعة\s*(\d{1,2})/;
    const plainMatch = text.match(plainHourRegex);
    if (plainMatch) {
        let hour = parseInt(plainMatch[1], 10);
        if (hour >= 1 && hour <= 6) hour += 12; // Assume PM for 1-6
        return `${String(hour).padStart(2, '0')}:00`;
    }

    return '18:00'; // Default to 6 PM for events
}

function extractPriceLocal(text: string): number | undefined {
    // Free
    if (/مجان[يا]|free|بدون رسوم|بلا مقابل/i.test(text)) return 0;

    // Arabic price: "100 ريال", "سعر التذكرة 150", "50 ر.س", "الأسعار: 200"
    const arPriceRegex = /(?:سعر|التذكرة|السعر|الأسعار|تكلفة|رسوم)[:\s]*(\d[\d,.]*)/i;
    const arPriceMatch = text.match(arPriceRegex);
    if (arPriceMatch) return parseFloat(arPriceMatch[1].replace(/,/g, ''));

    // Price with currency: "100 ريال", "200 SAR", "150 TL", "₺50", "$25"
    const currencyRegex = /(\d[\d,.]*)\s*(?:ريال|ر\.?س|SAR|TL|ليرة|دينار|درهم|جنيه|دولار|\$|₺|€|£)/i;
    const currencyMatch = text.match(currencyRegex);
    if (currencyMatch) return parseFloat(currencyMatch[1].replace(/,/g, ''));

    // Currency before number: "₺150", "$25"
    const preCurrencyRegex = /(?:\$|₺|€|£)\s*(\d[\d,.]*)/;
    const preCurrencyMatch = text.match(preCurrencyRegex);
    if (preCurrencyMatch) return parseFloat(preCurrencyMatch[1].replace(/,/g, ''));

    return undefined;
}

function extractLocationLocal(text: string): { location_name?: string; city?: string; district?: string } {
    const result: { location_name?: string; city?: string; district?: string } = {};

    // Arabic location patterns: "الموقع: جاليري ناي", "المكان: ...", "في فندق ..."
    const arLocRegex = /(?:الموقع|المكان|العنوان|location|venue|مكان الفعالية)[:\s]*([^\n.،,]+)/i;
    const arLocMatch = text.match(arLocRegex);
    if (arLocMatch) {
        result.location_name = arLocMatch[1].trim();
    }

    // Known Saudi cities
    const saudiCities = ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة', 'أبها', 'تبوك', 'الخبر', 'الظهران', 'القصيم', 'حائل', 'نجران', 'جازان', 'ينبع', 'الباحة', 'الطائف'];
    // Known Turkish cities
    const turkishCities = ['إسطنبول', 'istanbul', 'أنقرة', 'ankara', 'إزمير', 'izmir', 'أنطاليا', 'antalya', 'بورصة', 'bursa'];
    // Known Gulf/Arab cities
    const otherCities = ['دبي', 'أبوظبي', 'الدوحة', 'الكويت', 'المنامة', 'مسقط', 'عمان', 'القاهرة', 'بيروت'];

    const allCities = [...saudiCities, ...turkishCities, ...otherCities];
    const textLower = text.toLowerCase();
    for (const city of allCities) {
        if (text.includes(city) || textLower.includes(city.toLowerCase())) {
            result.city = city;
            // Infer country
            if (saudiCities.includes(city)) result.district = city;
            break;
        }
    }

    return result;
}

function extractCapacityLocal(text: string): number | undefined {
    // "30 مقعد", "20 شخص", "50 seats", "محدود 25"
    const capRegex = /(\d+)\s*(?:مقعد|مقاعد|شخص|أشخاص|مكان|أماكن|seats?|places?|spots?|attendees?)/i;
    const capMatch = text.match(capRegex);
    if (capMatch) return parseInt(capMatch[1], 10);

    // "محدود بـ 20" or "limited to 30"
    const limitRegex = /(?:محدود|limited)\s*(?:بـ?|to)?\s*(\d+)/i;
    const limitMatch = text.match(limitRegex);
    if (limitMatch) return parseInt(limitMatch[1], 10);

    return undefined;
}

function extractTitleLocal(caption: string): string {
    const lines = caption.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    for (const line of lines) {
        // Clean the line: remove emojis and excessive punctuation
        const cleaned = line
            .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, '')
            .replace(/[•·|▪️▫️◾◽⚫⚪🔴🔵🟢🟡🟠🟣🟤⭐✨💫🌟✅❌⬛⬜🔶🔷🔸🔹]/g, '')
            .replace(/^[-–—*#>]+\s*/, '')
            .trim();

        // Skip very short lines, hashtag-only lines, or lines with links
        if (cleaned.length < 3) continue;
        if (/^[#@]/.test(cleaned)) continue;
        if (/https?:\/\//.test(cleaned)) continue;
        if (/للحجز|للتسجيل|book now|register|link in bio/i.test(cleaned)) continue;

        return cleaned.slice(0, 120);
    }

    return 'فعالية جديدة';
}

function extractDescriptionLocal(caption: string): string {
    // Clean the caption: remove booking instructions, links, excessive emojis
    return caption
        .replace(/https?:\/\/[^\s]+/g, '')
        .replace(/link in bio/gi, '')
        .replace(/للحجز.*$/gm, '')
        .replace(/للتسجيل.*$/gm, '')
        .replace(/#\w+/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function matchCategory(text: string, categories: Category[]): string | undefined {
    const textLower = text.toLowerCase();

    // Keyword-to-category mapping
    const keywords: Record<string, string[]> = {
        'workshop': ['ورشة', 'ورش', 'workshop', 'تعليم', 'تدريب', 'دورة', 'class', 'course'],
        'concert': ['حفلة', 'حفل', 'concert', 'موسيقى', 'music', 'أمسية', 'غناء'],
        'exhibition': ['معرض', 'exhibition', 'gallery', 'جاليري', 'فن', 'art'],
        'food': ['طبخ', 'cooking', 'مطبخ', 'طعام', 'food', 'أكل', 'وصفة'],
        'sports': ['رياضة', 'sport', 'لياقة', 'fitness', 'يوغا', 'yoga', 'ماراثون'],
        'bazaar': ['بازار', 'bazaar', 'سوق', 'market'],
        'conference': ['مؤتمر', 'conference', 'ملتقى', 'قمة', 'summit'],
        'social': ['لقاء', 'meetup', 'تجمع', 'gathering', 'اجتماعي'],
    };

    for (const [slug, kws] of Object.entries(keywords)) {
        for (const kw of kws) {
            if (text.includes(kw) || textLower.includes(kw)) {
                // Find matching category by slug
                const match = categories.find(c =>
                    c.slug === slug || c.slug.includes(slug) || slug.includes(c.slug)
                );
                if (match) return match.slug;
            }
        }
    }

    return undefined;
}

// ─── Local Extraction (always works) ──────────────────────────────

function extractLocally(caption: string, categories: Category[]): ExtractedEventData {
    const location = extractLocationLocal(caption);

    return {
        title: extractTitleLocal(caption),
        description: extractDescriptionLocal(caption),
        date: extractDateLocal(caption),
        location_name: location.location_name,
        city: location.city,
        district: location.district,
        capacity: extractCapacityLocal(caption),
        ticket_price: extractPriceLocal(caption),
        category_slug: matchCategory(caption, categories),
    };
}

// ─── AI Enhancement (optional) ────────────────────────────────────

async function enhanceWithAI(
    caption: string,
    categories: Category[],
    localResult: ExtractedEventData
): Promise<ExtractedEventData> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        logger.info('GEMINI_API_KEY not configured, using local extraction only');
        return localResult;
    }

    const categoryList = categories
        .map(c => `- slug: "${c.slug}", Arabic: "${c.name_ar}", English: "${c.name_en}"`)
        .join('\n');

    const currentYear = new Date().getFullYear();
    const currentDate = new Date().toISOString().split('T')[0];

    const prompt = `You are an expert event data extractor. Extract structured event information from this Instagram caption.

RULES:
1. The caption may be in Arabic, English, or mixed. Handle both.
2. For dates: resolve relative dates (e.g. "السبت القادم", "next Saturday") to actual dates. The current date is ${currentDate}. Use year ${currentYear} unless the date would be in the past, then use ${currentYear + 1}.
3. Return dates in ISO format: "YYYY-MM-DDTHH:mm" (24-hour, no timezone).
4. For the title: extract the main event name. Remove emoji decorations.
5. For description: clean the caption — remove booking instructions, link references, but keep meaningful content.
6. For location: separate venue name, district/neighborhood, and city.
7. For price: extract the ticket price number only (no currency). If "free" or "مجاني", set price to 0.
8. For capacity: look for seat/attendee limits ("مقعد", "seat", "place").
9. Match the event to the closest category slug from this list:
${categoryList}

CAPTION:
"""
${caption}
"""

Respond with a JSON object with these exact fields (use null for fields you cannot determine):
{
  "title": "string",
  "description": "string",
  "date": "YYYY-MM-DDTHH:mm or null",
  "end_date": "YYYY-MM-DDTHH:mm or null",
  "location_name": "string or null",
  "district": "string or null",
  "city": "string or null",
  "country": "string or null",
  "capacity": "number or null",
  "category_slug": "string or null",
  "ticket_price": "number or null",
  "ticket_name": "string or null"
}`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.1,
                },
            }),
            signal: AbortSignal.timeout(15000), // 15s timeout — don't wait forever
        });

        if (!response.ok) {
            logger.warn('Gemini API returned error, falling back to local extraction', {
                status: response.status,
            });
            return localResult;
        }

        const data = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
            logger.warn('Gemini returned empty response, using local extraction');
            return localResult;
        }

        const aiResult: ExtractedEventData = JSON.parse(textContent);

        // Merge: AI result takes priority, but fill any missing fields from local
        const merged: ExtractedEventData = {
            title: aiResult.title || localResult.title,
            description: aiResult.description || localResult.description,
            date: aiResult.date || localResult.date,
            end_date: aiResult.end_date || localResult.end_date,
            location_name: aiResult.location_name || localResult.location_name,
            district: aiResult.district || localResult.district,
            city: aiResult.city || localResult.city,
            country: aiResult.country || localResult.country,
            capacity: aiResult.capacity ?? localResult.capacity,
            category_slug: aiResult.category_slug || localResult.category_slug,
            ticket_price: aiResult.ticket_price ?? localResult.ticket_price,
            ticket_name: aiResult.ticket_name || localResult.ticket_name,
        };

        logger.info('AI enhancement successful', {
            title: merged.title,
            hasDate: !!merged.date,
            hasLocation: !!merged.city,
            hasPrice: merged.ticket_price !== null && merged.ticket_price !== undefined,
        });

        return merged;
    } catch (error) {
        // AI failed — no problem, local extraction covers us
        logger.warn('AI enhancement failed, using local extraction only', { error });
        return localResult;
    }
}

// ─── Main Export ──────────────────────────────────────────────────

/**
 * Extract structured event data from an Instagram caption.
 * 
 * STRATEGY:
 * 1. Always run local regex extraction (instant, free, reliable)
 * 2. Optionally enhance with Gemini AI (if API key exists and quota available)
 * 3. If AI fails for any reason, the local result is returned instead
 */
export async function extractEventFromCaption(
    caption: string,
    categories: Category[]
): Promise<ExtractedEventData> {
    // Step 1: Local extraction (always works)
    const localResult = extractLocally(caption, categories);

    logger.info('Local extraction complete', {
        title: localResult.title,
        hasDate: !!localResult.date,
        hasPrice: localResult.ticket_price !== undefined,
        hasLocation: !!localResult.location_name || !!localResult.city,
    });

    // Step 2: Try AI enhancement (non-blocking, graceful failure)
    try {
        return await enhanceWithAI(caption, categories, localResult);
    } catch {
        return localResult;
    }
}
