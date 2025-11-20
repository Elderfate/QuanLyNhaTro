import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ChiSoDienNuocGS, PhongGS, NguoiDungGS } from '@/lib/googlesheets-models';
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
  badRequestResponse,
  forbiddenResponse,
} from '@/lib/api-response';
import { normalizeId, compareIds } from '@/lib/id-utils';
import { withRetry } from '@/lib/retry-utils';
import { z } from 'zod';

const updateChiSoSchema = z.object({
  phong: z.string().min(1, 'Phòng là bắt buộc').optional(),
  thang: z.number().min(1).max(12, 'Tháng phải từ 1-12').optional(),
  nam: z.number().min(2020, 'Năm phải từ 2020 trở lên').optional(),
  chiSoDienCu: z.number().min(0, 'Chỉ số điện cũ phải lớn hơn hoặc bằng 0').optional(),
  chiSoDienMoi: z.number().min(0, 'Chỉ số điện mới phải lớn hơn hoặc bằng 0').optional(),
  chiSoNuocCu: z.number().min(0, 'Chỉ số nước cũ phải lớn hơn hoặc bằng 0').optional(),
  chiSoNuocMoi: z.number().min(0, 'Chỉ số nước mới phải lớn hơn hoặc bằng 0').optional(),
  anhChiSoDien: z.string().optional(),
  anhChiSoNuoc: z.string().optional(),
  ngayGhi: z.string().optional(),
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

    const chiSo = await withRetry(() => ChiSoDienNuocGS.findById(id));
    if (!chiSo) {
      return notFoundResponse('Chỉ số điện nước không tồn tại');
    }

    // Populate relationships
    const phongId = normalizeId(chiSo.phong);
    if (phongId) {
      const phong = await withRetry(() => PhongGS.findById(phongId));
      chiSo.phong = phong ? {
        _id: phong._id,
        maPhong: phong.maPhong,
        toaNha: phong.toaNha
      } : null;
    }
    
    const nguoiGhiId = normalizeId(chiSo.nguoiGhi);
    if (nguoiGhiId) {
      const nguoiGhi = await withRetry(() => NguoiDungGS.findById(nguoiGhiId));
      chiSo.nguoiGhi = nguoiGhi ? {
        _id: nguoiGhi._id,
        ten: (nguoiGhi as { ten?: string }).ten || '',
        email: (nguoiGhi as { email?: string }).email || ''
      } : null;
    }

    return successResponse(chiSo);

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi lấy thông tin chỉ số điện nước');
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
      validatedData = updateChiSoSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationErrorResponse(error);
      }
      throw error;
    }
    
    const { id } = await params;

    const chiSo = await withRetry(() => ChiSoDienNuocGS.findById(id));
    if (!chiSo) {
      return notFoundResponse('Chỉ số điện nước không tồn tại');
    }

    // Check if user has permission to update (only admin or the person who recorded it)
    const nguoiGhiId = normalizeId(chiSo.nguoiGhi);
    const userId = session.user?.id;
    const userRole = session.user?.role;
    
    if (!compareIds(nguoiGhiId, userId) && userRole !== 'admin') {
      return forbiddenResponse('Bạn không có quyền cập nhật chỉ số này');
    }

    // Validate chi so moi >= chi so cu if both are provided
    const chiSoDoc = chiSo as { chiSoDienCu?: number; chiSoDienMoi?: number; chiSoNuocCu?: number; chiSoNuocMoi?: number; hinhAnhChiSo?: string };
    const chiSoDienCu = validatedData.chiSoDienCu !== undefined ? validatedData.chiSoDienCu : chiSoDoc.chiSoDienCu;
    const chiSoDienMoi = validatedData.chiSoDienMoi !== undefined ? validatedData.chiSoDienMoi : chiSoDoc.chiSoDienMoi;
    const chiSoNuocCu = validatedData.chiSoNuocCu !== undefined ? validatedData.chiSoNuocCu : chiSoDoc.chiSoNuocCu;
    const chiSoNuocMoi = validatedData.chiSoNuocMoi !== undefined ? validatedData.chiSoNuocMoi : chiSoDoc.chiSoNuocMoi;

    if (chiSoDienMoi !== undefined && chiSoDienCu !== undefined && chiSoDienMoi < chiSoDienCu) {
      return badRequestResponse('Chỉ số điện mới phải lớn hơn hoặc bằng chỉ số cũ');
    }

    if (chiSoNuocMoi !== undefined && chiSoNuocCu !== undefined && chiSoNuocMoi < chiSoNuocCu) {
      return badRequestResponse('Chỉ số nước mới phải lớn hơn hoặc bằng chỉ số cũ');
    }

    // Calculate soKwh and soKhoi
    const soKwh = chiSoDienMoi !== undefined && chiSoDienCu !== undefined ? chiSoDienMoi - chiSoDienCu : (chiSoDoc as { soKwh?: number }).soKwh;
    const soKhoi = chiSoNuocMoi !== undefined && chiSoNuocCu !== undefined ? chiSoNuocMoi - chiSoNuocCu : (chiSoDoc as { soKhoi?: number }).soKhoi;

    const updateData: Record<string, unknown> = {
      ...validatedData,
      soKwh,
      soKhoi,
      updatedAt: new Date().toISOString(),
      ngayCapNhat: new Date().toISOString(),
    };

    if (validatedData.phong) {
      const normalizedPhongId = normalizeId(validatedData.phong);
      if (normalizedPhongId) {
        updateData.phong = normalizedPhongId;
      }
    }

    if (validatedData.ngayGhi) {
      updateData.ngayGhi = validatedData.ngayGhi;
    }

    if (validatedData.anhChiSoDien || validatedData.anhChiSoNuoc) {
      updateData.hinhAnhChiSo = validatedData.anhChiSoDien || validatedData.anhChiSoNuoc || chiSoDoc.hinhAnhChiSo;
    }

    const updatedChiSo = await withRetry(() => ChiSoDienNuocGS.findByIdAndUpdate(id, updateData));

    if (!updatedChiSo) {
      return notFoundResponse('Chỉ số điện nước không tồn tại');
    }

    // Populate relationships
    const updatedPhongId = normalizeId(updatedChiSo.phong);
    if (updatedPhongId) {
      const phong = await withRetry(() => PhongGS.findById(updatedPhongId));
      updatedChiSo.phong = phong ? {
        _id: phong._id,
        maPhong: phong.maPhong,
        toaNha: phong.toaNha
      } : null;
    }
    
    const updatedNguoiGhiId = normalizeId(updatedChiSo.nguoiGhi);
    if (updatedNguoiGhiId) {
      const nguoiGhi = await withRetry(() => NguoiDungGS.findById(updatedNguoiGhiId));
      updatedChiSo.nguoiGhi = nguoiGhi ? {
        _id: nguoiGhi._id,
        ten: (nguoiGhi as { ten?: string }).ten || '',
        email: (nguoiGhi as { email?: string }).email || ''
      } : null;
    }

    return successResponse(updatedChiSo, 'Chỉ số điện nước đã được cập nhật thành công');

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi cập nhật chỉ số điện nước');
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

    const chiSo = await withRetry(() => ChiSoDienNuocGS.findById(id));
    if (!chiSo) {
      return notFoundResponse('Chỉ số điện nước không tồn tại');
    }

    // Check if user has permission to delete (only admin or the person who recorded it)
    const nguoiGhiId = normalizeId(chiSo.nguoiGhi);
    const userId = session.user?.id;
    const userRole = session.user?.role;
    
    if (!compareIds(nguoiGhiId, userId) && userRole !== 'admin') {
      return forbiddenResponse('Bạn không có quyền xóa chỉ số này');
    }

    await withRetry(() => ChiSoDienNuocGS.findByIdAndDelete(id));

    return successResponse(null, 'Chỉ số điện nước đã được xóa thành công');

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi xóa chỉ số điện nước');
  }
}
