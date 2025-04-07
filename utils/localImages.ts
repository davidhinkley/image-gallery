import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { ImageProps } from './types';
import { createHash } from 'crypto';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

// Function to get const readFile = promisify(fs.readFile);

// Function to get const readFile = promisify(fs.readFile);

// Function to get const readFile = promisify(fs.readFile);

// Function to get image dimkage with: npm install buffer-image-size using buffer-image dimkage with: npm install buffer-image-size using buffer-image dimkage with: npm install buffer-image-size using buffer-image dimensions using buffer-image-size
// Note: You'll need to install this package with: npm install buffer-image-size
const getImageDimensions = async (filePath: string): Promise<{ width: number; height: number }> => {
  try {
    // For production, use the actual package
    // const sizeOf = require('buffer-image-size');
    // const buffer = await readFile(filePath);
    // const dimensions = sizeOf(buffer);
    // return { width: dimensions.width, height: dimensions.height };

    // For now, we'll use a more sophisticated approach than fixed dimensions
    // We'll use different dimensions based on the file extension
    const ext = path.extname(filePath).toLowerCase();

    // Common aspect ratios for different types of images
    if (ext === '.png') {
      return { width: 1200, height: 800 }; // 3:2 aspect ratio
    } else if (ext === '.gif') {
      return { width: 600, height: 600 }; // 1:1 aspect ratio
    } else if (ext === '.webp') {
      return { width: 1920, height: 1080 }; // 16:9 aspect ratio
    } else {
      // Default for jpg/jpeg
      return { width: 1280, height: 853 }; // Common photo aspect ratio
    }
  } catch (error) {
    console.error(`Error getting dimensions for ${filePath}:`, error);
    return { width: 1280, height: 853 }; // Fallback dimensions
  }
};

// Generate a unique ID based on the file path
const generateId = (filePath: string): string => {
  return createHash('md5').update(filePath).digest('hex').substring(0, 8);
};

export async function getLocalImages(directory: string = 'public/images'): Promise<ImageProps[]> {
  const imagesDirectory = path.join(process.cwd(), directory);
  
  // Check if directory exists
  try {
    await stat(imagesDirectory);
  } catch (error) {
    console.error(`Directory ${imagesDirectory} does not exist`);
    return [];
  }
  
  // Get all files in the directory
  const files = await readdir(imagesDirectory);
  
  // Filter for image files
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return imageExtensions.includes(ext);
  });
  
  // Create image objects
  const images: ImageProps[] = await Promise.all(
    imageFiles.map(async (file, index) => {
      const filePath = path.join(imagesDirectory, file);
      const fileStats = await stat(filePath);
      const dimensions = await getImageDimensions(filePath);
      const format = path.extname(file).substring(1);
      
      // Ensure the path is correctly formatted for web access
      // The path should be relative to the public directory, not including "public" in the path
      // For web access, we need /images/filename.jpg (not /public/images/filename.jpg)
      const webPath = `/images/${file}`;

      // Validate that the file exists
      try {
        await stat(filePath);
        console.log(`Processing image: ${file}, path: ${webPath}, size: ${fileStats.size} bytes`);
      } catch (error) {
        console.error(`Error accessing image file ${filePath}:`, error);
      }

      return {
        id: index,
        filename: file,
        path: webPath,
        width: dimensions.width.toString(),
        height: dimensions.height.toString(),
        format,
        size: fileStats.size,
        created: fileStats.birthtime.toISOString() // Convert Date to ISO string
      };
    })
  );
  
  // Sort by creation date (newest first)
  const sortedImages = images.sort((a, b) => {
    return new Date(b.created || '').getTime() - new Date(a.created || '').getTime();
  });

  // Reassign IDs to match the sorted order
  return sortedImages.map((image, index) => ({
    ...image,
    id: index
  }));
}

// Cache for the images
let cachedImages: ImageProps[] | null = null;

export async function getCachedLocalImages(): Promise<ImageProps[]> {
  if (!cachedImages) {
    cachedImages = await getLocalImages();
  }
  return cachedImages;
}