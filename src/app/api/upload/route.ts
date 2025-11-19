import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  uploadMultipleImages,
  deleteImage, 
  validateImageFile,
  ImageFolders,
  CloudinaryUploadResult 
} from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'phong-tro';
    const type = searchParams.get('type') as keyof typeof ImageFolders;

    // Determine upload folder based on type
    let uploadFolder = folder;
    if (type && ImageFolders[type]) {
      uploadFolder = ImageFolders[type];
    }

    // Handle both 'file' (single) and 'images' (multiple) field names
    // Read formData ONCE - body can only be read once
    const formData = await request.formData();
    const hasFile = formData.has('file');
    const hasImages = formData.has('images');
    
    const fieldName = hasFile ? 'file' : (hasImages ? 'images' : 'images');
    
    // Get files from already-read formData
    const files = formData.getAll(fieldName) as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Không tìm thấy file ảnh' 
        },
        { status: 400 }
      );
    }

    // Validate all files
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        return NextResponse.json(
          { 
            success: false,
            message: validation.error || 'File không hợp lệ' 
          },
          { status: 400 }
        );
      }
    }

    // Upload all images with folder if provided
    const uploadResults = await uploadMultipleImages(files, uploadFolder);

    // If single file upload, return single object for backward compatibility
    if (hasFile && uploadResults.length === 1) {
      return NextResponse.json({
        success: true,
        data: {
          url: uploadResults[0].secure_url,
          secure_url: uploadResults[0].secure_url,
          public_id: uploadResults[0].public_id,
          ...uploadResults[0]
        },
        message: 'Đã tải lên ảnh thành công'
      });
    }

    // Multiple files - return array
    return NextResponse.json({
      success: true,
      data: uploadResults,
      message: `Đã tải lên ${uploadResults.length} ảnh thành công`
    });

  } catch (error: any) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error.message || 'Lỗi khi tải ảnh lên' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');
    const url = searchParams.get('url');
    const urls = searchParams.get('urls'); // Comma-separated URLs

    // Hỗ trợ xóa bằng publicId (cũ)
    if (publicId) {
      await deleteImage(publicId);
      return NextResponse.json({
        success: true,
        message: 'Đã xóa ảnh thành công'
      });
    }

    // Hỗ trợ xóa bằng URL (mới)
    if (url) {
      const { extractPublicId, deleteImage: deleteImg } = await import('@/lib/cloudinary');
      const publicIdFromUrl = extractPublicId(url);
      if (publicIdFromUrl) {
        await deleteImg(publicIdFromUrl);
        return NextResponse.json({
          success: true,
          message: 'Đã xóa ảnh thành công'
        });
      }
    }

    // Hỗ trợ xóa nhiều ảnh bằng URLs
    if (urls) {
      const urlArray = urls.split(',').filter(u => u.trim() !== '');
      const { extractPublicId, deleteMultipleImages } = await import('@/lib/cloudinary');
      const publicIds = urlArray
        .map(u => extractPublicId(u.trim()))
        .filter(id => id !== '');
      
      if (publicIds.length > 0) {
        if (publicIds.length === 1) {
          const { deleteImage: deleteImg } = await import('@/lib/cloudinary');
          await deleteImg(publicIds[0]);
        } else {
          await deleteMultipleImages(publicIds);
        }
        return NextResponse.json({
          success: true,
          message: `Đã xóa ${publicIds.length} ảnh thành công`
        });
      }
    }

    // Hỗ trợ xóa bằng body (POST với body chứa URLs)
    const body = await request.json().catch(() => null);
    if (body && body.urls && Array.isArray(body.urls)) {
      const { extractPublicId, deleteMultipleImages, deleteImage: deleteImg } = await import('@/lib/cloudinary');
      const publicIds = body.urls
        .map((u: string) => extractPublicId(u))
        .filter((id: string) => id !== '');
      
      if (publicIds.length > 0) {
        if (publicIds.length === 1) {
          await deleteImg(publicIds[0]);
        } else {
          await deleteMultipleImages(publicIds);
        }
        return NextResponse.json({
          success: true,
          message: `Đã xóa ${publicIds.length} ảnh thành công`
        });
      }
    }

    return NextResponse.json(
      { message: 'Public ID hoặc URL(s) is required' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error.message || 'Lỗi khi xóa ảnh' 
      },
      { status: 500 }
    );
  }
}