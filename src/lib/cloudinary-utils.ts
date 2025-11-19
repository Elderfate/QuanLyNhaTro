import { extractPublicId, deleteImage, deleteMultipleImages } from './cloudinary';

/**
 * Xóa nhiều ảnh từ Cloudinary dựa trên URLs
 * @param urls - Mảng các Cloudinary URLs cần xóa
 * @returns Promise<void>
 */
export async function deleteCloudinaryImages(urls: string[]): Promise<void> {
  if (!urls || urls.length === 0) return;

  try {
    // Extract public IDs từ URLs
    const publicIds = urls
      .map(url => extractPublicId(url))
      .filter(id => id !== ''); // Loại bỏ các ID rỗng

    if (publicIds.length === 0) {
      console.warn('No valid public IDs found to delete');
      return;
    }

    // Xóa tất cả ảnh cùng lúc
    if (publicIds.length === 1) {
      await deleteImage(publicIds[0]);
    } else {
      await deleteMultipleImages(publicIds);
    }

    console.log(`Successfully deleted ${publicIds.length} image(s) from Cloudinary`);
  } catch (error) {
    console.error('Error deleting images from Cloudinary:', error);
    // Không throw error để không làm gián đoạn flow chính
    // Chỉ log để debug
  }
}

/**
 * Xóa một ảnh từ Cloudinary dựa trên URL
 * @param url - Cloudinary URL cần xóa
 * @returns Promise<void>
 */
export async function deleteCloudinaryImage(url: string): Promise<void> {
  if (!url || typeof url !== 'string') return;

  try {
    const publicId = extractPublicId(url);
    if (!publicId) {
      console.warn('Invalid Cloudinary URL:', url);
      return;
    }

    await deleteImage(publicId);
    console.log(`Successfully deleted image from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    // Không throw error để không làm gián đoạn flow chính
  }
}

