/**
 * File Upload Utility Tests
 */

import { uploadVendorFile, deleteVendorFile, uploadVendorFiles } from '@/utils/file-upload.util';

// Mock logger
jest.mock('@/lib/logger/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('File Upload Utility', () => {
    let mockSupabase: any;
    let mockUpload: jest.Mock;
    let mockRemove: jest.Mock;
    let mockGetPublicUrl: jest.Mock;

    beforeEach(() => {
        mockUpload = jest.fn().mockResolvedValue({ error: null });
        mockRemove = jest.fn().mockResolvedValue({ error: null });
        mockGetPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/file.jpg' } });

        mockSupabase = {
            storage: {
                from: jest.fn().mockReturnValue({
                    upload: mockUpload,
                    getPublicUrl: mockGetPublicUrl,
                    remove: mockRemove,
                }),
            },
        };
    });

    describe('uploadVendorFile', () => {
        function createMockFile(name: string, size: number, type: string): File {
            const buffer = new ArrayBuffer(size);
            return new File([buffer], name, { type });
        }

        it('should upload file and return public URL', async () => {
            const file = createMockFile('photo.jpg', 1024, 'image/jpeg');

            const result = await uploadVendorFile(mockSupabase, file, 'v1', 'logo');
            expect(result.publicUrl).toBe('https://cdn.example.com/file.jpg');
            expect(result.path).toContain('v1/logo-');
            expect(mockSupabase.storage.from).toHaveBeenCalledWith('vendor-public');
        });

        it('should use vendor-documents bucket for verification files', async () => {
            const file = createMockFile('doc.jpg', 1024, 'image/jpeg');

            await uploadVendorFile(mockSupabase, file, 'v1', 'verification');
            expect(mockSupabase.storage.from).toHaveBeenCalledWith('vendor-documents');
        });

        it('should throw when file exceeds size limit', async () => {
            const file = createMockFile('big.jpg', 6 * 1024 * 1024, 'image/jpeg'); // 6MB

            await expect(uploadVendorFile(mockSupabase, file, 'v1', 'logo'))
                .rejects.toThrow('File size exceeds 5MB limit');
        });

        it('should respect custom size limit', async () => {
            const file = createMockFile('big.jpg', 3 * 1024 * 1024, 'image/jpeg'); // 3MB

            await expect(uploadVendorFile(mockSupabase, file, 'v1', 'logo', { maxSizeMB: 2 }))
                .rejects.toThrow('File size exceeds 2MB limit');
        });

        it('should throw for disallowed file types', async () => {
            const file = createMockFile('doc.pdf', 1024, 'application/pdf');

            await expect(uploadVendorFile(mockSupabase, file, 'v1', 'logo'))
                .rejects.toThrow('File type application/pdf not allowed');
        });

        it('should accept custom allowed types', async () => {
            const file = createMockFile('doc.pdf', 1024, 'application/pdf');

            const result = await uploadVendorFile(mockSupabase, file, 'v1', 'verification', {
                allowedTypes: ['application/pdf'],
            });
            expect(result.publicUrl).toBeDefined();
        });

        it('should throw when upload fails', async () => {
            const file = createMockFile('photo.jpg', 1024, 'image/jpeg');
            mockUpload.mockResolvedValueOnce({ error: { message: 'Storage full' } });

            await expect(uploadVendorFile(mockSupabase, file, 'v1', 'logo'))
                .rejects.toThrow('Upload failed: Storage full');
        });
    });

    describe('deleteVendorFile', () => {
        it('should delete file from default bucket', async () => {
            await deleteVendorFile(mockSupabase, 'v1/logo-123.jpg');
            expect(mockSupabase.storage.from).toHaveBeenCalledWith('vendor-public');
            expect(mockRemove).toHaveBeenCalledWith(['v1/logo-123.jpg']);
        });

        it('should delete from specified bucket', async () => {
            await deleteVendorFile(mockSupabase, 'v1/doc.pdf', 'vendor-documents');
            expect(mockSupabase.storage.from).toHaveBeenCalledWith('vendor-documents');
        });

        it('should throw when deletion fails', async () => {
            mockRemove.mockResolvedValueOnce({ error: { message: 'Not found' } });
            await expect(deleteVendorFile(mockSupabase, 'v1/missing.jpg'))
                .rejects.toThrow('Deletion failed: Not found');
        });
    });

    describe('uploadVendorFiles', () => {
        function createMockFile(name: string, size: number, type: string): File {
            return new File([new ArrayBuffer(size)], name, { type });
        }

        it('should upload multiple files', async () => {
            const files = [
                createMockFile('a.jpg', 1024, 'image/jpeg'),
                createMockFile('b.png', 1024, 'image/png'),
            ];

            const results = await uploadVendorFiles(mockSupabase, files, 'v1', 'gallery');
            expect(results).toHaveLength(2);
            expect(results[0].publicUrl).toBeDefined();
            expect(results[1].publicUrl).toBeDefined();
        });

        it('should fail all if one upload fails', async () => {
            const files = [
                createMockFile('a.jpg', 1024, 'image/jpeg'),
                createMockFile('b.jpg', 1024, 'image/jpeg'),
            ];
            mockUpload
                .mockResolvedValueOnce({ error: null })
                .mockResolvedValueOnce({ error: { message: 'Storage full' } });

            await expect(uploadVendorFiles(mockSupabase, files, 'v1', 'gallery'))
                .rejects.toThrow('Upload failed');
        });
    });
});
