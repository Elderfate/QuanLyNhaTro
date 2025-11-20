import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ChiSoDienNuocGS, PhongGS, NguoiDungGS } from '@/lib/googlesheets-models';
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  serverErrorResponse,
  badRequestResponse,
  forbiddenResponse,
} from '@/lib/api-response';
import { normalizeId, compareIds } from '@/lib/id-utils';
import { withRetry } from '@/lib/retry-utils';
import { z } from 'zod';

const chiSoSchema = z.object({
  phong: z.string().min(1, 'Phòng là bắt buộc'),
  thang: z.number().min(1).max(12, 'Tháng phải từ 1-12'),
  nam: z.number().min(2020, 'Năm phải từ 2020 trở lên'),
  chiSoDienCu: z.number().min(0, 'Chỉ số điện cũ phải lớn hơn hoặc bằng 0'),
  chiSoDienMoi: z.number().min(0, 'Chỉ số điện mới phải lớn hơn hoặc bằng 0'),
  chiSoNuocCu: z.number().min(0, 'Chỉ số nước cũ phải lớn hơn hoặc bằng 0'),
  chiSoNuocMoi: z.number().min(0, 'Chỉ số nước mới phải lớn hơn hoặc bằng 0'),
  anhChiSoDien: z.string().optional(),
  anhChiSoNuoc: z.string().optional(),
  ngayGhi: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const phong = searchParams.get('phong') || '';
    const thang = searchParams.get('thang') || '';
    const nam = searchParams.get('nam') || '';

    // Get all chi so and filter client-side
    let allChiSo = await withRetry(() => ChiSoDienNuocGS.find());
    
    const normalizedPhongId = phong ? normalizeId(phong) : null;
    if (normalizedPhongId) {
      allChiSo = allChiSo.filter((cs) => compareIds(cs.phong, normalizedPhongId));
    }
    
    if (thang) {
      const thangNum = parseInt(thang);
      allChiSo = allChiSo.filter((cs) => (cs as { thang?: number }).thang === thangNum);
    }
    
    if (nam) {
      const namNum = parseInt(nam);
      allChiSo = allChiSo.filter((cs) => (cs as { nam?: number }).nam === namNum);
    }

    // Sort by nam, thang
    allChiSo.sort((a, b) => {
      const aDoc = a as { nam?: number; thang?: number };
      const bDoc = b as { nam?: number; thang?: number };
      if (bDoc.nam !== aDoc.nam) return (bDoc.nam || 0) - (aDoc.nam || 0);
      return (bDoc.thang || 0) - (aDoc.thang || 0);
    });

    const total = allChiSo.length;
    const chiSoList = allChiSo.slice((page - 1) * limit, page * limit);

    // Populate relationships
    for (const chiSo of chiSoList) {
      const phongId = normalizeId(chiSo.phong);
      if (phongId) {
        const phongData = await withRetry(() => PhongGS.findById(phongId));
        chiSo.phong = phongData ? {
          _id: phongData._id,
          maPhong: phongData.maPhong,
          toaNha: phongData.toaNha
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
    }

    return successResponse(chiSoList, undefined, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi lấy danh sách chỉ số điện nước');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    let validatedData;
    try {
      validatedData = chiSoSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationErrorResponse(error);
      }
      throw error;
    }

    // Check if phong exists
    const normalizedPhongId = normalizeId(validatedData.phong);
    if (!normalizedPhongId) {
      return badRequestResponse('ID phòng không hợp lệ');
    }
    
    const phong = await withRetry(() => PhongGS.findById(normalizedPhongId));
    if (!phong) {
      return badRequestResponse('Phòng không tồn tại');
    }

    // Check if chi so already exists for this phong, thang, nam
    const allChiSo = await withRetry(() => ChiSoDienNuocGS.find());
    const existingChiSo = allChiSo.find((cs) => {
      const csPhongId = normalizeId(cs.phong);
      return compareIds(csPhongId, normalizedPhongId) &&
             (cs as { thang?: number }).thang === validatedData.thang &&
             (cs as { nam?: number }).nam === validatedData.nam;
    });

    if (existingChiSo) {
      return badRequestResponse('Chỉ số đã được ghi cho phòng này trong tháng này');
    }

    // Validate chi so moi >= chi so cu
    if (validatedData.chiSoDienMoi < validatedData.chiSoDienCu) {
      return badRequestResponse('Chỉ số điện mới phải lớn hơn hoặc bằng chỉ số cũ');
    }

    if (validatedData.chiSoNuocMoi < validatedData.chiSoNuocCu) {
      return badRequestResponse('Chỉ số nước mới phải lớn hơn hoặc bằng chỉ số cũ');
    }

    // Calculate soKwh and soKhoi
    const soKwh = validatedData.chiSoDienMoi - validatedData.chiSoDienCu;
    const soKhoi = validatedData.chiSoNuocMoi - validatedData.chiSoNuocCu;

    const userId = session.user?.id;
    if (!userId) {
      return unauthorizedResponse();
    }

    const newChiSo = await withRetry(() => ChiSoDienNuocGS.create({
      _id: `chiso_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...validatedData,
      phong: normalizedPhongId,
      nguoiGhi: userId,
      soKwh,
      soKhoi,
      ngayGhi: validatedData.ngayGhi || new Date().toISOString(),
      hinhAnhChiSo: validatedData.anhChiSoDien || validatedData.anhChiSoNuoc || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    return successResponse(newChiSo, 'Chỉ số điện nước đã được ghi thành công', 201);

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi tạo chỉ số điện nước');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return badRequestResponse('ID là bắt buộc');
    }

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