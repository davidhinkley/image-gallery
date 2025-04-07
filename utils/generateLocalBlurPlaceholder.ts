import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import sharp from 'sharp';
import type { ImageProps } from './types';

const readFile = promisify(fs.readFile);
const fileExists = promisify(fs.exists);
const cache = new Map<string, string>();

// Maximum size for blur placeholder (to avoid huge base64 strings)
const MAX_BLUR_IMAGE_SIZE = 20 * 1024; // 20KB

/**
 * Generate a base64 blur placeholder for an image
 * @param image The image object
 * @returns A base64 data URL for the blur placeholder
 */
export default async function getLocalBase64ImageUrl(
  image: ImageProps
): Promise<string> {
  if (!image || !image.path) {
    console.error('Invalid image object provided to getLocalBase64ImageUrl');
    return getTransparentPlaceholder();
  }

  // Check if we have a cached version
  const cacheKey = image.path || `${image.id}`;
  let url = cache.get(cacheKey);
  if (url) {
    return url;
  }

  try {
    // Get the full path to the image
    const imagePath = path.join(process.cwd(), 'public', image.path);

    // Check if file exists
    const exists = await fileExists(imagePath);
    if (!exists) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    // Read the file
    const buffer = await readFile(imagePath);

    // Skip large files or use a smaller version
    if (buffer.length > 1024 * 1024) { // 1MB
      console.warn(`Image too large for efficient blur placeholder: ${image.path} (${buffer.length} bytes)`);
      // For large images, we could resize them first, but for now we'll use a simple placeholder
      return getLightGrayPlaceholder();
    }

    // Determine the format based on file extension
    const format = image.format ? image.format.toLowerCase() : path.extname(imagePath).substring(1).toLowerCase();

    // Process the image with sharp
    let processedImageBuffer;
    try {
      // Create a sharp instance from the buffer
      const sharpInstance = sharp(buffer);

      // Just create a small thumbnail without blur
      // Width of 40px maintains aspect ratio and provides better quality for a placeholder
      await sharpInstance
        .resize(40)
        .toBuffer()
        .then(data => {
          processedImageBuffer = data;
        });
    } catch (processError) {
      console.warn(`Error processing image ${image.path} with sharp:`, processError);
      // Continue with the original buffer if processing fails
      processedImageBuffer = buffer;
    }

    // Limit the size of the base64 string
    if (processedImageBuffer.length > MAX_BLUR_IMAGE_SIZE) {
      console.warn(`Blur placeholder too large: ${processedImageBuffer.length} bytes. Using fallback.`);
      return getLightGrayPlaceholder();
    }

    // Convert to base64
    url = `data:image/${format};base64,${Buffer.from(processedImageBuffer).toString('base64')}`;

    // Cache the result
    cache.set(cacheKey, url);

    return url;
  } catch (error) {
    console.error(`Error generating blur placeholder for ${image.path}:`, error);
    // Return a light gray placeholder if there's an error
    return getLightGrayPlaceholder();
  }
}

/**
 * Get a transparent placeholder image
 * @returns A base64 data URL for a transparent 1x1 pixel GIF
 */
function getTransparentPlaceholder(): string {
  return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
}

/**
 * Get a light gray placeholder image
 * @returns A base64 data URL for a light gray 1x1 pixel GIF
 */
function getLightGrayPlaceholder(): string {
  return 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
}