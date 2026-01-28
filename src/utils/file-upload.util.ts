import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger/logger';

/**
 * File Upload Utility
 * Centralized file upload logic for vendor files
 */

export interface UploadResult {
    publicUrl: string;
    path: string;
}

/**
 * Upload a file to vendor storage bucket
 */
export async function uploadVendorFile(
    supabase: SupabaseClient,
    file: File,
    vendorId: string,
    fileType: 'logo' | 'cover' | 'event-image' | 'verification' | 'gallery',
    options?: {
        maxSizeMB?: number;
        allowedTypes?: string[];
    }
): Promise<UploadResult> {
    const { maxSizeMB = 5, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'] } = options || {};

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
    }

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Generate unique file path
    const fileExtension = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileName = `${vendorId}/${fileType}-${timestamp}-${randomString}.${fileExtension}`;

    // Determine bucket based on file type
    const bucket = fileType === 'verification' ? 'vendor-documents' : 'vendor-public';

    logger.info('Uploading vendor file', { vendorId, fileType, fileName, bucket });

    // Upload file
    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });

    if (uploadError) {
        logger.error('File upload failed', { error: uploadError, fileName });
        throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

    logger.info('File uploaded successfully', { vendorId, fileType, publicUrl });

    return {
        publicUrl,
        path: fileName
    };
}

/**
 * Delete a file from vendor storage
 */
export async function deleteVendorFile(
    supabase: SupabaseClient,
    filePath: string,
    bucket: 'vendor-public' | 'vendor-documents' = 'vendor-public'
): Promise<void> {
    logger.info('Deleting vendor file', { filePath, bucket });

    const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

    if (error) {
        logger.error('File deletion failed', { error, filePath });
        throw new Error(`Deletion failed: ${error.message}`);
    }

    logger.info('File deleted successfully', { filePath });
}

/**
 * Upload multiple files
 */
export async function uploadVendorFiles(
    supabase: SupabaseClient,
    files: File[],
    vendorId: string,
    fileType: 'gallery' | 'event-image',
    options?: {
        maxSizeMB?: number;
        allowedTypes?: string[];
    }
): Promise<UploadResult[]> {
    logger.info('Uploading multiple vendor files', { vendorId, fileType, count: files.length });

    const uploadPromises = files.map(file =>
        uploadVendorFile(supabase, file, vendorId, fileType, options)
    );

    const results = await Promise.all(uploadPromises);

    logger.info('Multiple files uploaded successfully', { vendorId, count: results.length });
    return results;
}
