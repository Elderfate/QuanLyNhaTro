import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ToaNhaGS, PhongGS, NguoiDungGS } from '@/lib/googlesheets-models';
import { deleteCloudinaryImages } from '@/lib/cloudinary-utils';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
  forbiddenResponse,
} from '@/lib/api-response';
import { compareIds, normalizeId } from '@/lib/id-utils';
import { withRetry } from '@/lib/retry-utils';
import type { ToaNhaDocument } from '@/lib/api-types';
import { z } from 'zod';

const toaNhaSchema = z.object({
  tenToaNha: z.string().min(1, 'Tên tòa nhà là bắt buộc'),
  diaChi: z.object({
    soNha: z.string().min(1, 'Số nhà là bắt buộc'),
    duong: z.string().min(1, 'Tên đường là bắt buộc'),
    phuong: z.string().min(1, 'Phường/xã là bắt buộc'),
    quan: z.string().min(1, 'Quận/huyện là bắt buộc'),
    thanhPho: z.string().min(1, 'Thành phố là bắt buộc'),
  }),
  moTa: z.string().optional(),
  tienNghiChung: z.array(z.string()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    const toaNha = await withRetry(() => ToaNhaGS.findById(id)) as ToaNhaDocument | null;
    if (!toaNha) {
      return notFoundResponse('Tòa nhà không tồn tại');
    }

    // Populate chuSoHuu
    const chuSoHuuId = normalizeId(toaNha.chuSoHuu);
    if (chuSoHuuId) {
      const chuSoHuu = await withRetry(() => NguoiDungGS.findById(chuSoHuuId));
      if (chuSoHuu) {
        (toaNha as { chuSoHuu?: unknown }).chuSoHuu = {
          _id: chuSoHuu._id,
          ten: (chuSoHuu as { ten?: string }).ten || '',
          email: (chuSoHuu as { email?: string }).email || ''
        };
      }
    }

    // Tính tổng số phòng thực tế
    const allPhong = await withRetry(() => PhongGS.find());
    const phongCount = allPhong.filter((p) => compareIds(p.toaNha, id)).length;
    const toaNhaWithPhongCount = {
      ...toaNha,
      tongSoPhong: phongCount
    };

    return successResponse(toaNhaWithPhongCount);

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi lấy thông tin tòa nhà');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    let validatedData;
    try {
      validatedData = toaNhaSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationErrorResponse(error);
      }
      throw error;
    }

    const { id } = await params;

    const toaNha = await withRetry(() => ToaNhaGS.findById(id)) as ToaNhaDocument | null;
    if (!toaNha) {
      return notFoundResponse('Tòa nhà không tồn tại');
    }

    // Check if user has permission to update this toa nha
    const userId = session.user?.id || '';
    const userRole = (session.user as { role?: string })?.role;
    if (!compareIds(toaNha.chuSoHuu, userId) && userRole !== 'admin') {
      return forbiddenResponse('Bạn không có quyền chỉnh sửa tòa nhà này');
    }

    // Handle image deletion from Cloudinary if images were removed
    const oldImageUrls = Array.isArray(toaNha.anhToaNha) ? toaNha.anhToaNha : [];
    const newImageUrls = Array.isArray(body.anhToaNha) ? body.anhToaNha : [];
    const deletedImageUrls = oldImageUrls.filter((url: string) => !newImageUrls.includes(url));
    
    if (deletedImageUrls.length > 0) {
      try {
        await deleteCloudinaryImages(deletedImageUrls);
        console.log(`Deleted ${deletedImageUrls.length} image(s) from Cloudinary for toa nha ${id}`);
      } catch (error) {
        console.error('Error deleting images from Cloudinary:', error);
        // Continue with update even if Cloudinary deletion fails
      }
    }

    const updatedToaNha = await withRetry(() => 
      ToaNhaGS.findByIdAndUpdate(id, {
        ...validatedData,
        diaChi: validatedData.diaChi, // Ensure diaChi is included
        anhToaNha: newImageUrls,
        tienNghiChung: validatedData.tienNghiChung || [],
        updatedAt: new Date().toISOString(),
        ngayCapNhat: new Date().toISOString(),
      }, { new: true })
    ) as ToaNhaDocument | null;

    if (!updatedToaNha) {
      return notFoundResponse('Tòa nhà không tồn tại');
    }

    // Populate chuSoHuu
    const chuSoHuuId = normalizeId(updatedToaNha.chuSoHuu);
    if (chuSoHuuId) {
      const chuSoHuu = await withRetry(() => NguoiDungGS.findById(chuSoHuuId));
      if (chuSoHuu) {
        (updatedToaNha as { chuSoHuu?: unknown }).chuSoHuu = {
          _id: chuSoHuu._id,
          ten: (chuSoHuu as { ten?: string }).ten || '',
          email: (chuSoHuu as { email?: string }).email || ''
        };
      }
    }

    // Tính tổng số phòng thực tế
    const allPhong = await withRetry(() => PhongGS.find());
    const phongCount = allPhong.filter((p) => compareIds(p.toaNha, id)).length;
    const toaNhaWithPhongCount = {
      ...updatedToaNha,
      tongSoPhong: phongCount
    };

    return successResponse(toaNhaWithPhongCount, 'Tòa nhà đã được cập nhật thành công');

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi cập nhật tòa nhà');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    const toaNha = await withRetry(() => ToaNhaGS.findById(id)) as ToaNhaDocument | null;
    if (!toaNha) {
      return notFoundResponse('Tòa nhà không tồn tại');
    }

    // Check if user has permission to delete this toa nha
    const userId = session.user?.id || '';
    const userRole = (session.user as { role?: string })?.role;
    if (!compareIds(toaNha.chuSoHuu, userId) && userRole !== 'admin') {
      return forbiddenResponse('Bạn không có quyền xóa tòa nhà này');
    }

    // Check if toa nha has rooms
    const allPhong = await withRetry(() => PhongGS.find());
    const roomCount = allPhong.filter((p) => compareIds(p.toaNha, id)).length;

    if (roomCount > 0) {
      return errorResponse(
        'Không thể xóa tòa nhà có phòng. Vui lòng xóa tất cả phòng trước.',
        400,
        'HAS_ROOMS'
      );
    }

    // Delete images from Cloudinary before deleting the record
    const imageUrls = Array.isArray(toaNha.anhToaNha) ? toaNha.anhToaNha : [];
    if (imageUrls.length > 0) {
      try {
        await deleteCloudinaryImages(imageUrls);
        console.log(`Deleted ${imageUrls.length} image(s) from Cloudinary for toa nha ${id}`);
      } catch (error) {
        console.error('Error deleting images from Cloudinary:', error);
        // Continue with deletion even if Cloudinary deletion fails
      }
    }

    await withRetry(() => ToaNhaGS.findByIdAndDelete(id));

    return successResponse(null, 'Tòa nhà đã được xóa thành công');

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi xóa tòa nhà');
  }
}
