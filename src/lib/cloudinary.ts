import { v2 as cloudinary } from 'cloudinary';
import { NextRequest } from 'next/server';

// Validate Cloudinary environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn('⚠️ Cloudinary configuration missing. Image upload will not work.');
  console.warn('Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env.local file');
  console.warn('See CLOUDINARY_SETUP.md for instructions');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

// Upload single image
export const uploadImage = async (
  file: File | Buffer,
  folder: string = 'phong-tro'
): Promise<CloudinaryUploadResult> => {
  try {
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { quality: 'auto', fetch_format: 'auto' },
            { width: 1200, height: 800, crop: 'limit' }
          ]
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Upload failed'));
          } else {
            resolve(result as CloudinaryUploadResult);
          }
        }
      ).end(buffer);
    });
  } catch (error) {
    throw new Error(`Image upload failed: ${error}`);
  }
};

// Upload multiple images
export const uploadMultipleImages = async (
  files: File[] | Buffer[],
  folder: string = 'phong-tro'
): Promise<CloudinaryUploadResult[]> => {
  try {
    const uploadPromises = files.map(file => uploadImage(file, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    throw new Error(`Multiple image upload failed: ${error}`);
  }
};

// Delete image from Cloudinary
export const deleteImage = async (publicId: string): Promise<void> => {
  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('⚠️ Cloudinary not configured, skipping image deletion');
    return;
  }

  if (!publicId || publicId.trim() === '') {
    console.warn('⚠️ Empty public ID provided, skipping deletion');
    return;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === 'not found') {
      console.warn(`⚠️ Image not found in Cloudinary: ${publicId}`);
    } else {
      console.log(`✅ Successfully deleted image from Cloudinary: ${publicId}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting image from Cloudinary (${publicId}):`, error);
    throw new Error(`Image deletion failed: ${error}`);
  }
};

// Delete multiple images
export const deleteMultipleImages = async (publicIds: string[]): Promise<void> => {
  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('⚠️ Cloudinary not configured, skipping image deletion');
    return;
  }

  if (!publicIds || publicIds.length === 0) {
    console.warn('⚠️ No public IDs provided, skipping deletion');
    return;
  }

  // Filter out empty IDs
  const validPublicIds = publicIds.filter(id => id && id.trim() !== '');
  
  if (validPublicIds.length === 0) {
    console.warn('⚠️ No valid public IDs provided, skipping deletion');
    return;
  }

  try {
    const result = await cloudinary.api.delete_resources(validPublicIds);
    const deletedCount = result.deleted ? Object.keys(result.deleted).length : 0;
    const notFoundCount = result.not_found ? result.not_found.length : 0;
    
    console.log(`✅ Successfully deleted ${deletedCount} image(s) from Cloudinary`);
    if (notFoundCount > 0) {
      console.warn(`⚠️ ${notFoundCount} image(s) not found in Cloudinary`);
    }
  } catch (error) {
    console.error('❌ Error deleting multiple images from Cloudinary:', error);
    throw new Error(`Multiple image deletion failed: ${error}`);
  }
};

// Get optimized image URL
export const getOptimizedImageUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
  } = {}
): string => {
  const { width = 800, height = 600, quality = 'auto', format = 'auto' } = options;
  
  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop: 'fill' },
      { quality, fetch_format: format }
    ]
  });
};

// Extract public ID from Cloudinary URL
export const extractPublicId = (cloudinaryUrl: string): string => {
  try {
    // Extract public ID from URL like: https://res.cloudinary.com/cloud/image/upload/v1234567890/folder/image.jpg
    const match = cloudinaryUrl.match(/\/v\d+\/(.+)$/);
    if (match) {
      const fullPath = match[1];
      // Remove file extension
      return fullPath.replace(/\.[^/.]+$/, '');
    }
    return '';
  } catch {
    return '';
  }
};

// Validate image file
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Chỉ chấp nhận file ảnh (JPG, PNG, WebP)'
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Kích thước file không được vượt quá 10MB'
    };
  }

  return { valid: true };
};

// Handle form data image upload
export const handleImageUpload = async (
  request: NextRequest,
  fieldName: string = 'images',
  folder?: string
): Promise<CloudinaryUploadResult[]> => {
  try {
    const formData = await request.formData();
    const files = formData.getAll(fieldName) as File[];
    
    if (!files || files.length === 0) {
      throw new Error('No images found in form data');
    }

    // Validate all files
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    // Upload all images with folder if provided
    const uploadResults = await uploadMultipleImages(files, folder);
    return uploadResults;
  } catch (error) {
    throw new Error(`Image upload failed: ${error}`);
  }
};

// Generate thumbnail URL
export const getThumbnailUrl = (publicId: string): string => {
  return getOptimizedImageUrl(publicId, {
    width: 300,
    height: 200,
    quality: 'auto'
  });
};

// Generate different sizes for responsive images
export const getResponsiveImageUrls = (publicId: string) => {
  return {
    thumbnail: getOptimizedImageUrl(publicId, { width: 300, height: 200 }),
    small: getOptimizedImageUrl(publicId, { width: 600, height: 400 }),
    medium: getOptimizedImageUrl(publicId, { width: 1000, height: 667 }),
    large: getOptimizedImageUrl(publicId, { width: 1600, height: 1067 }),
    original: cloudinary.url(publicId, { quality: 'auto', fetch_format: 'auto' })
  };
};

// Folder structure for different image types
export const ImageFolders = {
  ROOM: 'phong-tro/rooms',
  BUILDING: 'phong-tro/buildings',
  TENANT: 'phong-tro/tenants',
  CONTRACT: 'phong-tro/contracts',
  MAINTENANCE: 'phong-tro/maintenance',
  CCCD: 'phong-tro/cccd'
} as const;

export default cloudinary;