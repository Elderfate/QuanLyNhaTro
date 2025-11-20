import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ThongBaoGS } from '@/lib/googlesheets-models';
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
  badRequestResponse,
} from '@/lib/api-response';
import { normalizeId } from '@/lib/id-utils';
import { withRetry } from '@/lib/retry-utils';
import { z } from 'zod';

const thongBaoSchema = z.object({
  tieuDe: z.string().min(1, 'Tiêu đề là bắt buộc'),
  noiDung: z.string().min(1, 'Nội dung là bắt buộc'),
  loai: z.enum(['chung', 'hoaDon', 'suCo', 'hopDong', 'khac']).optional(),
  nguoiNhan: z.array(z.string()).min(1, 'Phải có ít nhất 1 người nhận'),
  phong: z.array(z.string()).optional(),
  toaNha: z.string().optional(),
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
      validatedData = thongBaoSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationErrorResponse(error);
      }
      throw error;
    }

    const nguoiGuiId = session.user?.id;
    if (!nguoiGuiId) {
      return unauthorizedResponse();
    }

    const normalizedPhongIds = validatedData.phong 
      ? validatedData.phong.map(id => normalizeId(id)).filter((id): id is string => id !== null)
      : [];
    const normalizedToaNhaId = validatedData.toaNha ? normalizeId(validatedData.toaNha) : null;

    const newThongBao = await withRetry(() => ThongBaoGS.create({
      _id: `thongbao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...validatedData,
      nguoiGui: nguoiGuiId,
      loai: validatedData.loai || 'chung',
      phong: normalizedPhongIds,
      toaNha: normalizedToaNhaId || '',
      daDoc: [],
      ngayGui: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    return successResponse(newThongBao, 'Thông báo đã được gửi thành công', 201);

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi tạo thông báo');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return badRequestResponse('ID thông báo là bắt buộc');
    }

    const body = await request.json();
    let validatedData;
    try {
      validatedData = thongBaoSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationErrorResponse(error);
      }
      throw error;
    }

    const normalizedPhongIds = validatedData.phong 
      ? validatedData.phong.map(id => normalizeId(id)).filter((id): id is string => id !== null)
      : [];
    const normalizedToaNhaId = validatedData.toaNha ? normalizeId(validatedData.toaNha) : null;

    const updatedThongBao = await withRetry(() => ThongBaoGS.findByIdAndUpdate(id, {
      ...validatedData,
      loai: validatedData.loai || 'chung',
      phong: normalizedPhongIds,
      toaNha: normalizedToaNhaId || '',
      updatedAt: new Date().toISOString(),
    }));

    if (!updatedThongBao) {
      return notFoundResponse('Không tìm thấy thông báo');
    }

    return successResponse(updatedThongBao, 'Cập nhật thông báo thành công');

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi cập nhật thông báo');
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
      return badRequestResponse('ID thông báo là bắt buộc');
    }

    const deletedThongBao = await withRetry(() => ThongBaoGS.findByIdAndDelete(id));

    if (!deletedThongBao) {
      return notFoundResponse('Không tìm thấy thông báo');
    }

    return successResponse(null, 'Xóa thông báo thành công');

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi xóa thông báo');
  }
}