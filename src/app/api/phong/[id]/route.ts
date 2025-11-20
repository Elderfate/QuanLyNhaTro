import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PhongGS, ToaNhaGS } from '@/lib/googlesheets-models';
import { updatePhongStatus } from '@/lib/status-utils';
import { deleteCloudinaryImages } from '@/lib/cloudinary-utils';
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { compareIds } from '@/lib/id-utils';
import { withRetry } from '@/lib/retry-utils';
import type { PhongDocument } from '@/lib/api-types';
import { z } from 'zod';

const phongSchema = z.object({
  maPhong: z.string().min(1, 'Mã phòng là bắt buộc'),
  toaNha: z.string().min(1, 'Tòa nhà là bắt buộc'),
  tang: z.coerce.number().min(0, 'Tầng phải lớn hơn hoặc bằng 0'),
  dienTich: z.coerce.number().min(1, 'Diện tích phải lớn hơn 0'),
  giaThue: z.coerce.number().min(0, 'Giá thuê phải lớn hơn hoặc bằng 0'),
  tienCoc: z.coerce.number().min(0, 'Tiền cọc phải lớn hơn hoặc bằng 0'),
  moTa: z.string().optional(),
  anhPhong: z.array(z.string()).optional(),
  tienNghi: z.array(z.string()).optional(),
  soNguoiToiDa: z.coerce.number().min(1, 'Số người tối đa phải lớn hơn 0').max(10, 'Số người tối đa không được quá 10'),
  trangThai: z.enum(['trong', 'daDat', 'dangThue', 'baoTri']).optional(),
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

    // Cập nhật trạng thái phòng trước khi trả về
    await updatePhongStatus(id);

    const phong = await withRetry(() => PhongGS.findById(id)) as PhongDocument | null;
    if (!phong) {
      return notFoundResponse('Phòng không tồn tại');
    }

    // Populate toaNha
    const toaNhaId = typeof phong.toaNha === 'string' ? phong.toaNha : phong.toaNha?._id;
    if (toaNhaId) {
      const toaNha = await withRetry(() => ToaNhaGS.findById(toaNhaId));
      phong.toaNha = toaNha ? {
        _id: toaNha._id,
        tenToaNha: toaNha.tenToaNha,
        diaChi: toaNha.diaChi
      } : null;
    }

    return successResponse(phong);

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi lấy thông tin phòng');
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
      validatedData = phongSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationErrorResponse(error);
      }
      throw error;
    }

    const { id } = await params;

    // Get existing phong to check for deleted images
    const existingPhong = await withRetry(() => PhongGS.findById(id)) as PhongDocument | null;
    if (!existingPhong) {
      return notFoundResponse('Phòng không tồn tại');
    }

    // Check if toa nha exists
    const toaNha = await withRetry(() => ToaNhaGS.findById(validatedData.toaNha));
    if (!toaNha) {
      return errorResponse('Tòa nhà không tồn tại', 400, 'TOA_NHA_NOT_FOUND');
    }

    // Handle image deletion from Cloudinary if images were removed
    const oldImageUrls = Array.isArray(existingPhong.anhPhong) ? existingPhong.anhPhong : [];
    const newImageUrls = Array.isArray(validatedData.anhPhong) ? validatedData.anhPhong : [];
    const deletedImageUrls = oldImageUrls.filter((url: string) => !newImageUrls.includes(url));
    
    if (deletedImageUrls.length > 0) {
      try {
        await deleteCloudinaryImages(deletedImageUrls);
        console.log(`Deleted ${deletedImageUrls.length} image(s) from Cloudinary for phong ${id}`);
      } catch (error) {
        console.error('Error deleting images from Cloudinary:', error);
        // Continue with update even if Cloudinary deletion fails
      }
    }

    // Nếu trangThai được cung cấp, dùng nó; ngược lại tự động tính toán
    const updateData: Partial<PhongDocument> = {
      ...validatedData,
      anhPhong: newImageUrls,
      tienNghi: validatedData.tienNghi || [],
      updatedAt: new Date().toISOString(),
      ngayCapNhat: new Date().toISOString(),
    };

    // Nếu không có trangThai trong request, tự động tính toán
    if (!validatedData.trangThai) {
      // Tính toán trạng thái dựa trên hợp đồng
      const { calculatePhongStatus } = await import('@/lib/status-utils');
      const calculatedStatus = await calculatePhongStatus(id);
      updateData.trangThai = calculatedStatus;
    }
    // Nếu có trangThai trong request, dùng giá trị đó (override thủ công)

    const phong = await withRetry(() => PhongGS.findByIdAndUpdate(id, updateData));

    if (!phong) {
      return notFoundResponse('Phòng không tồn tại');
    }

    // Lấy lại dữ liệu với trạng thái đã cập nhật
    const updatedPhong = await withRetry(() => PhongGS.findById(id)) as PhongDocument | null;
    
    if (!updatedPhong) {
      return notFoundResponse('Phòng không tồn tại');
    }
    
    // Populate toaNha
    const toaNhaId = typeof updatedPhong.toaNha === 'string' ? updatedPhong.toaNha : updatedPhong.toaNha?._id;
    if (toaNhaId) {
      const toaNhaData = await withRetry(() => ToaNhaGS.findById(toaNhaId));
      updatedPhong.toaNha = toaNhaData ? {
        _id: toaNhaData._id,
        tenToaNha: toaNhaData.tenToaNha,
        diaChi: toaNhaData.diaChi
      } : null;
    }

    return successResponse(updatedPhong, 'Phòng đã được cập nhật thành công');

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi cập nhật phòng');
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

    const phong = await withRetry(() => PhongGS.findById(id)) as PhongDocument | null;
    if (!phong) {
      return notFoundResponse('Phòng không tồn tại');
    }

    // Delete images from Cloudinary before deleting the record
    const imageUrls = Array.isArray(phong.anhPhong) ? phong.anhPhong : [];
    if (imageUrls.length > 0) {
      try {
        await deleteCloudinaryImages(imageUrls);
        console.log(`Deleted ${imageUrls.length} image(s) from Cloudinary for phong ${id}`);
      } catch (error) {
        console.error('Error deleting images from Cloudinary:', error);
        // Continue with deletion even if Cloudinary deletion fails
      }
    }

    await withRetry(() => PhongGS.findByIdAndDelete(id));

    return successResponse(null, 'Phòng đã được xóa thành công');

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi xóa phòng');
  }
}
