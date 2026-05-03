import sharp from 'sharp';
import { logger } from '@/lib/logger/logger';

/**
 * Image Optimization Utility
 * Converts images to WebP format with resizing and compression.
 * Used by: event creation, event updates, and Instagram imports.
 */

interface OptimizeOptions {
    maxWidth?: number;    // Default: 1200
    quality?: number;     // Default: 80
    format?: 'webp' | 'jpeg'; // Default: 'webp'
}

interface OptimizedImage {
    buffer: Buffer;
    mimeType: string;
    extension: string;
    originalSize: number;
    optimizedSize: number;
}

/**
 * Optimize an image from a Buffer (e.g. downloaded from Instagram)
 */
export async function optimizeImageBuffer(
    inputBuffer: Buffer,
    options?: OptimizeOptions
): Promise<OptimizedImage> {
    const { maxWidth = 1200, quality = 80, format = 'webp' } = options || {};
    const originalSize = inputBuffer.length;

    try {
        let pipeline = sharp(inputBuffer)
            .resize(maxWidth, null, {
                withoutEnlargement: true, // Don't upscale small images
                fit: 'inside',
            });

        if (format === 'webp') {
            pipeline = pipeline.webp({ quality });
        } else {
            pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        }

        const outputBuffer = await pipeline.toBuffer();

        const optimizedSize = outputBuffer.length;
        const savings = Math.round((1 - optimizedSize / originalSize) * 100);

        logger.info('Image optimized', {
            originalSize: `${(originalSize / 1024).toFixed(0)}KB`,
            optimizedSize: `${(optimizedSize / 1024).toFixed(0)}KB`,
            savings: `${savings}%`,
            format,
        });

        return {
            buffer: outputBuffer,
            mimeType: format === 'webp' ? 'image/webp' : 'image/jpeg',
            extension: format,
            originalSize,
            optimizedSize,
        };
    } catch (error) {
        logger.error('Image optimization failed, returning original', { error });
        // Fallback: return original buffer as-is
        return {
            buffer: inputBuffer,
            mimeType: 'image/jpeg',
            extension: 'jpg',
            originalSize,
            optimizedSize: originalSize,
        };
    }
}

/**
 * Optimize an image from a File object (e.g. form upload from vendor dashboard)
 */
export async function optimizeImageFile(
    file: File,
    options?: OptimizeOptions
): Promise<OptimizedImage> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return optimizeImageBuffer(buffer, options);
}
