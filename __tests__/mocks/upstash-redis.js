// Global mock for @upstash/redis — prevents ESM import failures in Jest
module.exports = {
    Redis: jest.fn().mockImplementation(() => ({
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        scan: jest.fn().mockResolvedValue([0, []]),
        smembers: jest.fn().mockResolvedValue([]),
        sadd: jest.fn(),
        pipeline: jest.fn().mockReturnValue({
            del: jest.fn(),
            sadd: jest.fn(),
            exec: jest.fn().mockResolvedValue([]),
        }),
    })),
};
