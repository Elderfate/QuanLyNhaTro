import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SuCoGS, PhongGS, KhachThueGS, NguoiDungGS } from '@/lib/googlesheets-models';
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { normalizeId } from '@/lib/id-utils';
import { withRetry } from '@/lib/retry-utils';
import { z } from 'zod';

const updateSuCoSchema = z.object({
  tieuDe: z.string().min(1, 'Tiêu đề là bắt buộc').optional(),
  moTa: z.string().min(1, 'Mô tả là bắt buộc').optional(),
  anhSuCo: z.array(z.string()).optional(),
  loaiSuCo: z.enum(['dienNuoc', 'noiThat', 'vesinh', 'anNinh', 'khac']).optional(),
  mucDoUuTien: z.enum(['thap', 'trungBinh', 'cao', 'khancap']).optional(),
  trangThai: z.enum(['moi', 'dangXuLy', 'daXong', 'daHuy']).optional(),
  nguoiXuLy: z.string().optional(),
  ghiChuXuLy: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }

    const suCo = await withRetry(() => SuCoGS.findById(params.id));
    if (!suCo) {
      return notFoundResponse('Sự cố không tồn tại');
    }

    // Populate relationships
    const phongId = normalizeId(suCo.phong);
    if (phongId) {
      const phong = await withRetry(() => PhongGS.findById(phongId));
      suCo.phong = phong ? {
        _id: phong._id,
        maPhong: phong.maPhong,
        toaNha: phong.toaNha
      } : null;
    }
    
    const khachThueId = normalizeId(suCo.khachThue);
    if (khachThueId) {
      const khachThue = await withRetry(() => KhachThueGS.findById(khachThueId));
      suCo.khachThue = khachThue ? {
        _id: khachThue._id,
        hoTen: (khachThue as { ten?: string; hoTen?: string }).ten || (khachThue as { hoTen?: string }).hoTen || '',
        soDienThoai: (khachThue as { soDienThoai: string }).soDienThoai
      } : null;
    }
    
    const nguoiXuLyId = normalizeId(suCo.nguoiXuLy);
    if (nguoiXuLyId) {
      const nguoiXuLy = await withRetry(() => NguoiDungGS.findById(nguoiXuLyId));
      suCo.nguoiXuLy = nguoiXuLy ? {
        _id: nguoiXuLy._id,
        ten: (nguoiXuLy as { ten?: string }).ten || '',
        email: (nguoiXuLy as { email?: string }).email || ''
      } : null;
    }

    return successResponse(suCo);

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi lấy thông tin sự cố');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    let validatedData;
    try {
      validatedData = updateSuCoSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationErrorResponse(error);
      }
      throw error;
    }

    const updateData: Record<string, unknown> = {
      ...validatedData,
      updatedAt: new Date().toISOString(),
      ngayCapNhat: new Date().toISOString(),
    };

    // Handle anhSuCo field
    if (validatedData.anhSuCo) {
      updateData.hinhAnh = validatedData.anhSuCo;
    }

    const suCo = await withRetry(() => SuCoGS.findByIdAndUpdate(params.id, updateData));

    if (!suCo) {
      return notFoundResponse('Sự cố không tồn tại');
    }

    // Populate relationships
    const phongId = normalizeId(suCo.phong);
    if (phongId) {
      const phong = await withRetry(() => PhongGS.findById(phongId));
      suCo.phong = phong ? {
        _id: phong._id,
        maPhong: phong.maPhong,
        toaNha: phong.toaNha
      } : null;
    }
    
    const khachThueId = normalizeId(suCo.khachThue);
    if (khachThueId) {
      const khachThue = await withRetry(() => KhachThueGS.findById(khachThueId));
      suCo.khachThue = khachThue ? {
        _id: khachThue._id,
        hoTen: (khachThue as { ten?: string; hoTen?: string }).ten || (khachThue as { hoTen?: string }).hoTen || '',
        soDienThoai: (khachThue as { soDienThoai: string }).soDienThoai
      } : null;
    }
    
    const nguoiXuLyId = normalizeId(suCo.nguoiXuLy);
    if (nguoiXuLyId) {
      const nguoiXuLy = await withRetry(() => NguoiDungGS.findById(nguoiXuLyId));
      suCo.nguoiXuLy = nguoiXuLy ? {
        _id: nguoiXuLy._id,
        ten: (nguoiXuLy as { ten?: string }).ten || '',
        email: (nguoiXuLy as { email?: string }).email || ''
      } : null;
    }

    return successResponse(suCo, 'Sự cố đã được cập nhật thành công');

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi cập nhật sự cố');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }

    const suCo = await withRetry(() => SuCoGS.findById(params.id));
    if (!suCo) {
      return notFoundResponse('Sự cố không tồn tại');
    }

    await withRetry(() => SuCoGS.findByIdAndDelete(params.id));

    return successResponse(null, 'Sự cố đã được xóa thành công');

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi xóa sự cố');
  }
}
