/**
 * Supabase Client Mock
 * Provides mock Supabase client for testing
 */

export const createMockSupabaseClient = () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockInsert = jest.fn().mockReturnThis();
    const mockUpdate = jest.fn().mockReturnThis();
    const mockDelete = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockNeq = jest.fn().mockReturnThis();
    const mockGt = jest.fn().mockReturnThis();
    const mockLt = jest.fn().mockReturnThis();
    const mockGte = jest.fn().mockReturnThis();
    const mockLte = jest.fn().mockReturnThis();
    const mockIn = jest.fn().mockReturnThis();
    const mockContains = jest.fn().mockReturnThis();
    const mockIlike = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockRange = jest.fn().mockReturnThis();
    const mockRpc = jest.fn().mockResolvedValue({ data: null, error: null });

    const queryBuilder = {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
        eq: mockEq,
        neq: mockNeq,
        gt: mockGt,
        lt: mockLt,
        gte: mockGte,
        lte: mockLte,
        in: mockIn,
        contains: mockContains,
        ilike: mockIlike,
        order: mockOrder,
        limit: mockLimit,
        single: mockSingle,
        maybeSingle: mockMaybeSingle,
        range: mockRange,
    };

    // Make all query builder methods return the query builder for chaining
    Object.keys(queryBuilder).forEach(key => {
        const method = queryBuilder[key as keyof typeof queryBuilder];
        if (typeof method === 'function' && !['single', 'maybeSingle'].includes(key)) {
            (method as jest.Mock).mockReturnValue(queryBuilder);
        }
    });

    const mockFrom = jest.fn().mockReturnValue(queryBuilder);

    return {
        from: mockFrom,
        rpc: mockRpc,
        auth: {
            getUser: jest.fn().mockResolvedValue({
                data: { user: { id: 'test-user-id', email: 'test@example.com' } },
                error: null,
            }),
        },
        storage: {
            from: jest.fn().mockReturnValue({
                upload: jest.fn().mockResolvedValue({ data: null, error: null }),
                getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/image.jpg' } }),
            }),
        },
        // Expose mocks for assertions
        _mocks: {
            from: mockFrom,
            select: mockSelect,
            insert: mockInsert,
            update: mockUpdate,
            delete: mockDelete,
            eq: mockEq,
            neq: mockNeq,
            gt: mockGt,
            lt: mockLt,
            gte: mockGte,
            lte: mockLte,
            in: mockIn,
            contains: mockContains,
            ilike: mockIlike,
            order: mockOrder,
            limit: mockLimit,
            single: mockSingle,
            maybeSingle: mockMaybeSingle,
            range: mockRange,
            rpc: mockRpc,
        },
    };
};

export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>;
