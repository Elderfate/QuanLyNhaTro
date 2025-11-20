import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SuCoGS, PhongGS, KhachThueGS } from '@/lib/googlesheets-models';
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  serverErrorResponse,
  badRequestResponse,
} from '@/lib/api-response';
import { normalizeId } from '@/lib/id-utils';
import { withRetry } from '@/lib/retry-utils';
import { z } from 'zod';

const suCoSchema = z.object({
  phong: z.string().min(1, 'Phòng là bắt buộc'),
  khachThue: z.string().min(1, 'Khách thuê là bắt buộc'),
  tieuDe: z.string().min(1, 'Tiêu đề là bắt buộc'),
  moTa: z.string().min(1, 'Mô tả là bắt buộc'),
  anhSuCo: z.array(z.string()).optional(),
  loaiSuCo: z.enum(['dienNuoc', 'noiThat', 'vesinh', 'anNinh', 'khac']),
  mucDoUuTien: z.enum(['thap', 'trungBinh', 'cao', 'khancap']).optional(),
  trangThai: z.enum(['moi', 'dangXuLy', 'daXong', 'daHuy']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    let validatedData;
    try {
      validatedData = suCoSchema.parse(body);
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

    // Check if khach thue exists
    const normalizedKhachThueId = normalizeId(validatedData.khachThue);
    if (!normalizedKhachThueId) {
      return badRequestResponse('ID khách thuê không hợp lệ');
    }
    
    const khachThue = await withRetry(() => KhachThueGS.findById(normalizedKhachThueId));
    if (!khachThue) {
      return badRequestResponse('Khách thuê không tồn tại');
    }

    const newSuCo = await withRetry(() => SuCoGS.create({
      _id: `suco_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...validatedData,
      phong: normalizedPhongId,
      khachThue: normalizedKhachThueId,
      anhSuCo: validatedData.anhSuCo || [],
      hinhAnh: validatedData.anhSuCo || [],
      mucDoUuTien: validatedData.mucDoUuTien || 'trungBinh',
      trangThai: validatedData.trangThai || 'moi',
      ngayBaoCao: new Date().toISOString(),
      ngayBao: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    return successResponse(newSuCo, 'Sự cố đã được báo cáo thành công', 201);

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi tạo sự cố');
  }
}
