import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ToaNhaGS } from '@/lib/googlesheets-models';
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { withRetry } from '@/lib/retry-utils';
import { z } from 'zod';

const toaNghiEnum = z.enum(['wifi', 'camera', 'baoVe', 'giuXe', 'thangMay', 'sanPhoi', 'nhaVeSinhChung', 'khuBepChung']);

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
  tienNghiChung: z.array(toaNghiEnum).optional(),
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
      validatedData = toaNhaSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationErrorResponse(error);
      }
      throw error;
    }

    const userId = session.user?.id;
    if (!userId) {
      return unauthorizedResponse();
    }

    const newToaNha = await withRetry(() => ToaNhaGS.create({
      _id: `toanha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...validatedData,
      chuSoHuu: userId,
      tienNghiChung: validatedData.tienNghiChung || [],
      tongSoPhong: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ngayTao: new Date().toISOString(),
      ngayCapNhat: new Date().toISOString(),
    }));

    return successResponse(newToaNha, 'Tòa nhà đã được tạo thành công', 201);

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi tạo tòa nhà');
  }
}
