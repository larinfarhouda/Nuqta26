// Mock Resend before importing
const mockSend = jest.fn();
jest.mock('resend', () => ({
    Resend: jest.fn().mockImplementation(() => ({
        emails: { send: mockSend },
    })),
}));

// Mock logger to suppress output
jest.mock('@/lib/logger/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

describe('sendEmail', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        process.env = { ...originalEnv, RESEND_API_KEY: 'test-key' };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should return error when RESEND_API_KEY is not set', async () => {
        process.env.RESEND_API_KEY = '';
        jest.resetModules();
        jest.mock('resend', () => ({
            Resend: jest.fn().mockImplementation(() => ({
                emails: { send: mockSend },
            })),
        }));
        jest.mock('@/lib/logger/logger', () => ({
            logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
        }));
        const { sendEmail } = require('@/utils/mail');
        const result = await sendEmail({
            to: 'test@example.com',
            subject: 'Test',
            react: null,
        });
        expect(result.success).toBe(false);
        expect(result.error.message).toBe('Missing API Key');
    });

    it('should send email successfully', async () => {
        jest.resetModules();
        jest.mock('resend', () => ({
            Resend: jest.fn().mockImplementation(() => ({
                emails: {
                    send: jest.fn().mockResolvedValue({ data: { id: 'email-123' }, error: null }),
                },
            })),
        }));
        jest.mock('@/lib/logger/logger', () => ({
            logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
        }));
        process.env.RESEND_API_KEY = 'test-key';
        const { sendEmail } = require('@/utils/mail');
        const result = await sendEmail({
            to: 'test@example.com',
            subject: 'Test Subject',
            react: null,
        });
        expect(result.success).toBe(true);
        expect(result.data).toEqual({ id: 'email-123' });
    });

    it('should handle Resend API errors (non-retryable)', async () => {
        jest.resetModules();
        jest.mock('resend', () => ({
            Resend: jest.fn().mockImplementation(() => ({
                emails: {
                    send: jest.fn().mockResolvedValue({
                        data: null,
                        error: { statusCode: 400, message: 'Bad request' },
                    }),
                },
            })),
        }));
        jest.mock('@/lib/logger/logger', () => ({
            logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
        }));
        process.env.RESEND_API_KEY = 'test-key';
        const { sendEmail } = require('@/utils/mail');
        const result = await sendEmail({
            to: 'test@example.com',
            subject: 'Test',
            react: null,
        });
        expect(result.success).toBe(false);
    });

    it('should handle send exceptions', async () => {
        jest.resetModules();
        jest.mock('resend', () => ({
            Resend: jest.fn().mockImplementation(() => ({
                emails: {
                    send: jest.fn().mockRejectedValue(new Error('Network error')),
                },
            })),
        }));
        jest.mock('@/lib/logger/logger', () => ({
            logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
        }));
        process.env.RESEND_API_KEY = 'test-key';
        const { sendEmail } = require('@/utils/mail');
        const result = await sendEmail({
            to: 'test@example.com',
            subject: 'Test',
            react: null,
        });
        expect(result.success).toBe(false);
    });
});
