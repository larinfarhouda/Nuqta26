/**
 * Slugify Utility Tests
 */

import { slugify } from '@/utils/slugify';

describe('slugify', () => {
    it('should convert basic text to slug', () => {
        expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should handle multiple spaces', () => {
        expect(slugify('Hello   World  Test')).toBe('hello-world-test');
    });

    it('should remove special characters', () => {
        expect(slugify('Hello! @World# $Test%')).toBe('hello-world-test');
    });

    it('should handle leading and trailing spaces', () => {
        expect(slugify('  Hello World  ')).toBe('hello-world');
    });

    it('should handle leading and trailing hyphens', () => {
        expect(slugify('---hello-world---')).toBe('hello-world');
    });

    it('should collapse multiple hyphens', () => {
        expect(slugify('hello---world')).toBe('hello-world');
    });

    it('should convert uppercase to lowercase', () => {
        expect(slugify('HELLO WORLD')).toBe('hello-world');
    });

    it('should handle empty string', () => {
        expect(slugify('')).toBe('');
    });

    it('should handle string with only special characters', () => {
        expect(slugify('!@#$%^&*()')).toBe('');
    });

    it('should handle numbers', () => {
        expect(slugify('Event 2026')).toBe('event-2026');
    });

    it('should handle mixed content', () => {
        expect(slugify('Music Concert - Istanbul 2026!')).toBe('music-concert-istanbul-2026');
    });

    it('should preserve hyphens in text', () => {
        expect(slugify('ready-made slug')).toBe('ready-made-slug');
    });

    // === Arabic / Non-Latin support ===

    it('should handle Arabic text', () => {
        expect(slugify('حفل موسيقي في إسطنبول')).toBe('حفل-موسيقي-في-إسطنبول');
    });

    it('should handle mixed Arabic and numbers', () => {
        expect(slugify('فعالية 2026')).toBe('فعالية-2026');
    });

    it('should handle Turkish characters', () => {
        // JS toLowerCase() converts İ → i (not locale-aware), ü is preserved
        expect(slugify('Müzik Konseri İstanbul')).toBe('müzik-konseri-istanbul');
    });

    it('should handle mixed Arabic and English', () => {
        expect(slugify('Event حفل 2026')).toBe('event-حفل-2026');
    });

    it('should handle Arabic with special characters', () => {
        expect(slugify('حفل! @موسيقي# $رائع%')).toBe('حفل-موسيقي-رائع');
    });
});
