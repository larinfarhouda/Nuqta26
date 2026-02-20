/**
 * Analytics Repository Tests
 * Uses a custom mock that supports .eq().eq() chaining (AnalyticsRepository chains two eq calls)
 */

import { AnalyticsRepository } from '@/repositories/analytics.repository';

function createAnalyticsMock() {
    // Track call count to resolve on the final eq in a chain
    let eqCallCount = 0;
    let eqResolveData: any = { data: null, error: null };
    let inResolveData: any = { data: null, error: null };

    const builder: any = {
        select: jest.fn(),
        eq: jest.fn(),
        in: jest.fn(),
        single: jest.fn(),
    };

    // All methods return builder for chaining
    builder.select.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.in.mockReturnValue(builder);

    // Make builder thenable so await resolves with eqResolveData
    builder.then = function (resolve: any) {
        return resolve(eqResolveData);
    };

    const mockFrom = jest.fn().mockReturnValue(builder);

    return {
        client: { from: mockFrom } as any,
        _mocks: {
            from: mockFrom,
            builder,
            setEqResolve: (data: any) => { eqResolveData = data; },
            setInResolve: (data: any) => {
                inResolveData = data;
                builder.in.mockImplementation(() => {
                    const inBuilder = { ...builder, then: (r: any) => r(inResolveData) };
                    return inBuilder;
                });
            },
        },
    };
}

describe('AnalyticsRepository', () => {
    let repo: AnalyticsRepository;
    let mock: ReturnType<typeof createAnalyticsMock>;

    beforeEach(() => {
        mock = createAnalyticsMock();
        repo = new AnalyticsRepository(mock.client);
    });

    describe('getVendorBookingStats', () => {
        it('should calculate revenue and sales from confirmed bookings', async () => {
            const bookings = [
                { total_amount: 100, status: 'confirmed', created_at: new Date().toISOString() },
                { total_amount: 200, status: 'confirmed', created_at: new Date().toISOString() },
            ];
            mock._mocks.setEqResolve({ data: bookings, error: null });

            const result = await repo.getVendorBookingStats('v1');
            expect(result.totalRevenue).toBe(300);
            expect(result.totalSales).toBe(2);
            expect(result.recentSales).toBe(2);
        });

        it('should handle empty bookings', async () => {
            mock._mocks.setEqResolve({ data: null, error: null });

            const result = await repo.getVendorBookingStats('v1');
            expect(result.totalRevenue).toBe(0);
            expect(result.totalSales).toBe(0);
            expect(result.recentSales).toBe(0);
        });

        it('should filter recent sales to last 30 days', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 60);
            const bookings = [
                { total_amount: 100, status: 'confirmed', created_at: oldDate.toISOString() },
                { total_amount: 200, status: 'confirmed', created_at: new Date().toISOString() },
            ];
            mock._mocks.setEqResolve({ data: bookings, error: null });

            const result = await repo.getVendorBookingStats('v1');
            expect(result.totalSales).toBe(2);
            expect(result.recentSales).toBe(1);
        });

        it('should throw on error', async () => {
            mock._mocks.setEqResolve({ data: null, error: { message: 'DB error' } });
            await expect(repo.getVendorBookingStats('v1')).rejects.toThrow();
        });
    });

    describe('getEventTypeDistribution', () => {
        it('should aggregate event types', async () => {
            const bookings = [
                { user_id: 'u1', events: { event_type: 'workshop' } },
                { user_id: 'u2', events: { event_type: 'workshop' } },
                { user_id: 'u3', events: { event_type: 'concert' } },
            ];
            mock._mocks.setEqResolve({ data: bookings, error: null });

            const result = await repo.getEventTypeDistribution('v1');
            expect(result).toContainEqual({ name: 'workshop', value: 2 });
            expect(result).toContainEqual({ name: 'concert', value: 1 });
        });

        it('should handle missing event type as Unknown', async () => {
            const bookings = [{ user_id: 'u1', events: null }];
            mock._mocks.setEqResolve({ data: bookings, error: null });

            const result = await repo.getEventTypeDistribution('v1');
            expect(result).toContainEqual({ name: 'Unknown', value: 1 });
        });

        it('should return empty array for no data', async () => {
            mock._mocks.setEqResolve({ data: null, error: null });
            const result = await repo.getEventTypeDistribution('v1');
            expect(result).toEqual([]);
        });
    });

    describe('getCustomerLoyalty', () => {
        it('should classify customers correctly', async () => {
            const bookings = [
                { user_id: 'u1' },
                { user_id: 'u2' }, { user_id: 'u2' },
                { user_id: 'u3' }, { user_id: 'u3' }, { user_id: 'u3' }, { user_id: 'u3' }, { user_id: 'u3' },
            ];
            mock._mocks.setEqResolve({ data: bookings, error: null });

            const result = await repo.getCustomerLoyalty('v1');
            const oneTime = result.find((r: any) => r.name === 'One-time');
            const repeat = result.find((r: any) => r.name === 'Recurring');
            const loyal = result.find((r: any) => r.name === 'Loyal');
            expect(oneTime?.value).toBe(1);
            expect(repeat?.value).toBe(1);
            expect(loyal?.value).toBe(1);
        });

        it('should handle empty data', async () => {
            mock._mocks.setEqResolve({ data: null, error: null });
            const result = await repo.getCustomerLoyalty('v1');
            expect(result).toContainEqual({ name: 'One-time', value: 0 });
        });
    });

    describe('getCustomerDemographics', () => {
        it('should return empty distributions for no customers', async () => {
            mock._mocks.setEqResolve({ data: null, error: null });

            const result = await repo.getCustomerDemographics('v1');
            expect(result.genderDistribution).toEqual([]);
            expect(result.ageDistribution).toEqual([]); // early return when no customers
        });

        it('should aggregate gender and age correctly', async () => {
            // First call: bookings query
            const bookings = [{ user_id: 'u1' }, { user_id: 'u2' }];
            mock._mocks.setEqResolve({ data: bookings, error: null });

            // Second call: profiles query (via .in())
            const profiles = [
                { gender: 'Male', age: 25 },
                { gender: 'Female', age: 35 },
            ];
            mock._mocks.setInResolve({ data: profiles, error: null });

            const result = await repo.getCustomerDemographics('v1');
            expect(result.genderDistribution).toContainEqual({ name: 'Male', value: 1 });
            expect(result.genderDistribution).toContainEqual({ name: 'Female', value: 1 });
        });

        it('should throw on bookings error', async () => {
            mock._mocks.setEqResolve({ data: null, error: { message: 'DB error' } });
            await expect(repo.getCustomerDemographics('v1')).rejects.toThrow();
        });
    });

    describe('getEventsCount', () => {
        it('should return count', async () => {
            mock._mocks.setEqResolve({ count: 5, error: null });
            const result = await repo.getEventsCount('v1');
            expect(result).toBe(5);
        });

        it('should return 0 when null', async () => {
            mock._mocks.setEqResolve({ count: null, error: null });
            const result = await repo.getEventsCount('v1');
            expect(result).toBe(0);
        });

        it('should throw on error', async () => {
            mock._mocks.setEqResolve({ count: null, error: { message: 'fail' } });
            await expect(repo.getEventsCount('v1')).rejects.toThrow();
        });
    });
});
