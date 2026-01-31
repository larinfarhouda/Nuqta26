/**
 * Distance Utility Tests
 * Tests for distance calculation functions
 */

import { calculateDistance, formatDistance } from '@/utils/distance';

describe('Distance Utilities', () => {
    describe('calculateDistance', () => {
        it('should calculate distance between two points', () => {
            // Distance from Istanbul to Ankara (approx 350km)
            const lat1 = 41.0082;
            const lon1 = 28.9784;
            const lat2 = 39.9334;
            const lon2 = 32.8597;

            const distance = calculateDistance(lat1, lon1, lat2, lon2);

            // Allow some margin for rounding
            expect(distance).toBeGreaterThan(340);
            expect(distance).toBeLessThan(360);
        });

        it('should return 0 for same location', () => {
            const distance = calculateDistance(41.0082, 28.9784, 41.0082, 28.9784);
            expect(distance).toBe(0);
        });

        it('should calculate short distances correctly', () => {
            // Two points ~1km apart in Istanbul
            const lat1 = 41.0082;
            const lon1 = 28.9784;
            const lat2 = 41.0182;
            const lon2 = 28.9884;

            const distance = calculateDistance(lat1, lon1, lat2, lon2);

            expect(distance).toBeGreaterThan(0);
            expect(distance).toBeLessThan(2);
        });

        it('should handle negative coordinates', () => {
            // Southern hemisphere / Western hemisphere
            const distance = calculateDistance(-33.9249, 18.4241, -34.0522, 18.4231);
            expect(distance).toBeGreaterThan(0);
        });
    });

    describe('formatDistance', () => {
        it('should format distance less than 1km in meters', () => {
            expect(formatDistance(0.5)).toBe('500 m');
            expect(formatDistance(0.123)).toBe('123 m');
        });

        it('should format distance greater than 1km in kilometers', () => {
            expect(formatDistance(1.5)).toBe('1.5 km');
            expect(formatDistance(10.234)).toBe('10.2 km');
        });

        it('should handle exactly 1km', () => {
            expect(formatDistance(1)).toBe('1.0 km');
        });

        it('should handle 0 distance', () => {
            expect(formatDistance(0)).toBe('0 m');
        });

        it('should round meters to whole numbers', () => {
            expect(formatDistance(0.456)).toBe('456 m');
        });

        it('should round kilometers to 1 decimal place', () => {
            expect(formatDistance(5.678)).toBe('5.7 km');
        });
    });
});
