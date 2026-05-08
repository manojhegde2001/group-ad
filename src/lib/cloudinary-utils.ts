/**
 * Utility to generate optimized Cloudinary URLs with automatic format and quality selection.
 */

interface CloudinaryOptions {
  width?: number;
  height?: number;
  crop?: string; // 'limit', 'fill', 'fit', 'scale', etc.
  quality?: string | number; // 'auto', 'auto:best', 'auto:good', etc.
  format?: string; // 'auto', 'webp', 'avif', etc.
  enhance?: boolean; // AI enhancement (e_enhance)
  blur?: number; // Blur effect (e_blur:value)
  resourceType?: 'image' | 'video';
}

export function getOptimizedCloudinaryUrl(
  url: string | null | undefined,
  options: CloudinaryOptions = {}
): string {
  if (!url) return '';

  // Only apply transformations to Cloudinary URLs
  if (!url.includes('cloudinary.com')) return url;

  // Handle blob/local URLs (previews during upload)
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;

  const {
    width,
    height,
    crop = 'limit',
    quality = 'auto',
    format = 'auto',
    enhance = false,
    blur,
    resourceType = 'image',
  } = options;

  const transformations: string[] = [];

  // Automatic format and quality are core requirements
  if (format) transformations.push(`f_${format}`);
  if (quality) transformations.push(`q_${quality}`);

  // Scaling/Cropping
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);

  // AI Enhancement (Images only)
  if (enhance && resourceType === 'image') {
    transformations.push('e_enhance');
  }

  // Blur (Images only)
  if (blur && resourceType === 'image') {
    transformations.push(`e_blur:${blur}`);
  }

  const transformationString = transformations.join(',');

  // The URL structure: https://res.cloudinary.com/[cloud_name]/[resource_type]/upload/[transformations]/[version]/[public_id].[ext]
  // We need to insert transformations after /upload/
  
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;

  // Check if there are already transformations (between /upload/ and /v123456/)
  // A typical Cloudinary URL has /upload/v123456/ or /upload/transformations/v123456/
  const afterUpload = url.slice(uploadIndex + 8);
  
  // If the next segment is a version (starts with 'v' followed by digits)
  const isVersionNext = /v\d+\//.test(afterUpload.split('/')[0]);
  
  if (isVersionNext) {
    // Insert transformations before version
    return `${url.slice(0, uploadIndex + 8)}${transformationString}/${afterUpload}`;
  } else {
    // If there are existing transformations, we could merge them, 
    // but for simplicity and following the requirement, we'll replace or prepend.
    // Here we'll just prepend our optimizations to any existing ones.
    return `${url.slice(0, uploadIndex + 8)}${transformationString}/${afterUpload}`;
  }
}
