export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, '-')        // Replace spaces and underscores with -
        .replace(/[^\p{L}\p{N}-]+/gu, '') // Keep all unicode letters, digits, and hyphens
        .replace(/-{2,}/g, '-')         // Collapse multiple hyphens
        .replace(/^-+|-+$/g, '');       // Trim hyphens from edges
}
