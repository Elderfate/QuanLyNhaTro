import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PhongGS, ToaNhaGS } from '@/lib/googlesheets-models';
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  serverErrorResponse,
  badRequestResponse,
} from '@/lib/api-response';
import { normalizeId, compareIds } from '@/lib/id-utils';
import { withRetry } from '@/lib/retry-utils';
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

export async function POST(request: NextRequest) {
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

    // Check if toa nha exists
    const normalizedToaNhaId = normalizeId(validatedData.toaNha);
    if (!normalizedToaNhaId) {
      return badRequestResponse('ID tòa nhà không hợp lệ');
    }
    
    const allToaNha = await withRetry(() => ToaNhaGS.find());
    const toaNhaExists = allToaNha.find((t) => compareIds(t._id, normalizedToaNhaId));
    if (!toaNhaExists) {
      return badRequestResponse('Tòa nhà không tồn tại');
    }

    const newPhong = await withRetry(() => PhongGS.create({
      ...validatedData,
      toaNha: normalizedToaNhaId,
      anhPhong: validatedData.anhPhong || [],
      tienNghi: validatedData.tienNghi || [],
      trangThai: 'trong', // Mặc định là trống
    }));

    return successResponse(newPhong, 'Phòng đã được tạo thành công', 201);

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi tạo phòng');
  }
}
