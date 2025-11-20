import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { HopDongGS, PhongGS, KhachThueGS } from '@/lib/googlesheets-models';
import { updatePhongStatus, updateAllKhachThueStatus } from '@/lib/status-utils';
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
  badRequestResponse,
} from '@/lib/api-response';
import { normalizeId, compareIds } from '@/lib/id-utils';
import { withRetry } from '@/lib/retry-utils';
import type { HopDongDocument } from '@/lib/api-types';
import { z } from 'zod';

const phiDichVuSchema = z.object({
  ten: z.string().min(1, 'Tên dịch vụ là bắt buộc'),
  gia: z.coerce.number().min(0, 'Giá dịch vụ phải lớn hơn hoặc bằng 0'),
});

const hopDongSchema = z.object({
  maHopDong: z.string().min(1, 'Mã hợp đồng là bắt buộc'),
  phong: z.string().min(1, 'Phòng là bắt buộc'),
  khachThueId: z.array(z.string()).min(1, 'Phải có ít nhất 1 khách thuê'),
  nguoiDaiDien: z.string().min(1, 'Người đại diện là bắt buộc'),
  ngayBatDau: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
  ngayKetThuc: z.string().min(1, 'Ngày kết thúc là bắt buộc'),
  giaThue: z.coerce.number().min(0, 'Giá thuê phải lớn hơn hoặc bằng 0'),
  tienCoc: z.coerce.number().min(0, 'Tiền cọc phải lớn hơn hoặc bằng 0'),
  chuKyThanhToan: z.enum(['thang', 'quy', 'nam']),
  ngayThanhToan: z.coerce.number().min(1).max(31, 'Ngày thanh toán phải từ 1-31'),
  dieuKhoan: z.string().min(1, 'Điều khoản là bắt buộc'),
  giaDien: z.coerce.number().min(0, 'Giá điện phải lớn hơn hoặc bằng 0'),
  giaNuoc: z.coerce.number().min(0, 'Giá nước phải lớn hơn hoặc bằng 0'),
  chiSoDienBanDau: z.coerce.number().min(0, 'Chỉ số điện ban đầu phải lớn hơn hoặc bằng 0'),
  chiSoNuocBanDau: z.coerce.number().min(0, 'Chỉ số nước ban đầu phải lớn hơn hoặc bằng 0'),
  phiDichVu: z.array(phiDichVuSchema).optional(),
  fileHopDong: z.string().optional(),
  trangThai: z.enum(['hoatDong', 'hetHan', 'daHuy']).optional(),
});

// Schema cho partial update (chỉ cập nhật một số trường)
const hopDongPartialSchema = hopDongSchema.partial();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const hopDong = await HopDongGS.findById(id);
    if (!hopDong) {
      return NextResponse.json(
        { message: 'Hợp đồng không tồn tại' },
        { status: 404 }
      );
    }

    // Populate phong
    const phongId = normalizeId(hopDong.phong);
    if (phongId) {
      const phong = await withRetry(() => PhongGS.findById(phongId));
      hopDong.phong = phong ? {
        _id: phong._id,
        maPhong: phong.maPhong,
        toaNha: phong.toaNha
      } : null;
    }

    // Populate khachThueId
    if (hopDong.khachThueId) {
      const khachThueIds = Array.isArray(hopDong.khachThueId) ? hopDong.khachThueId : [hopDong.khachThueId];
      const khachThueList = await Promise.all(
        khachThueIds.map((ktId) => withRetry(() => KhachThueGS.findById(ktId)))
      );
      hopDong.khachThueId = khachThueList
        .filter(kt => kt)
        .map((kt) => ({
          _id: kt._id,
          hoTen: (kt as { ten?: string; hoTen?: string }).ten || (kt as { hoTen?: string }).hoTen || '',
          soDienThoai: (kt as { soDienThoai: string }).soDienThoai
        }));
    }

    // Populate nguoiDaiDien
    const nguoiDaiDienId = normalizeId(hopDong.nguoiDaiDien);
    if (nguoiDaiDienId) {
      const nguoiDaiDien = await withRetry(() => KhachThueGS.findById(nguoiDaiDienId));
      hopDong.nguoiDaiDien = nguoiDaiDien ? {
        _id: nguoiDaiDien._id,
        hoTen: (nguoiDaiDien as { ten?: string; hoTen?: string }).ten || (nguoiDaiDien as { hoTen?: string }).hoTen || '',
        soDienThoai: (nguoiDaiDien as { soDienThoai: string }).soDienThoai
      } : null;
    }

    return successResponse(hopDong);

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi lấy thông tin hợp đồng');
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
      validatedData = hopDongPartialSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationErrorResponse(error);
      }
      throw error;
    }

    const { id } = await params;

    // Lấy hợp đồng hiện tại để kiểm tra
    const existingHopDong = await withRetry(() => HopDongGS.findById(id)) as HopDongDocument | null;
    if (!existingHopDong) {
      return notFoundResponse('Hợp đồng không tồn tại');
    }

    // Nếu có cập nhật phòng, kiểm tra phòng tồn tại
    if (validatedData.phong) {
      const normalizedPhongId = normalizeId(validatedData.phong);
      const phong = normalizedPhongId ? await withRetry(() => PhongGS.findById(normalizedPhongId)) : null;
      if (!phong) {
        return badRequestResponse('Phòng không tồn tại');
      }
    }

    // Nếu có cập nhật khách thuê, kiểm tra khách thuê tồn tại
    if (validatedData.khachThueId) {
      const normalizedKhachThueIds = validatedData.khachThueId.map(id => normalizeId(id)).filter((id): id is string => id !== null);
      const allKhachThue = await withRetry(() => KhachThueGS.find());
      const khachThueList = allKhachThue.filter((kt) => 
        normalizedKhachThueIds.some(id => compareIds(kt._id, id))
      );
      if (khachThueList.length !== normalizedKhachThueIds.length) {
        return badRequestResponse('Một hoặc nhiều khách thuê không tồn tại');
      }
    }

    // Nếu có cập nhật người đại diện, kiểm tra người đại diện có trong danh sách khách thuê không
    if (validatedData.nguoiDaiDien && validatedData.khachThueId) {
      const normalizedNguoiDaiDien = normalizeId(validatedData.nguoiDaiDien);
      const normalizedKhachThueIds = validatedData.khachThueId.map(id => normalizeId(id)).filter((id): id is string => id !== null);
      if (!normalizedNguoiDaiDien || !normalizedKhachThueIds.some(id => compareIds(id, normalizedNguoiDaiDien))) {
        return badRequestResponse('Người đại diện phải là một trong các khách thuê');
      }
    }

    // Chuẩn bị dữ liệu cập nhật
    const updateData: Partial<HopDongDocument> = { ...validatedData };
    
    // Normalize IDs if provided
    if (validatedData.phong) {
      updateData.phong = normalizeId(validatedData.phong) || validatedData.phong;
    }
    if (validatedData.khachThueId) {
      updateData.khachThueId = validatedData.khachThueId.map(id => normalizeId(id)).filter((id): id is string => id !== null);
    }
    if (validatedData.nguoiDaiDien) {
      updateData.nguoiDaiDien = normalizeId(validatedData.nguoiDaiDien) || validatedData.nguoiDaiDien;
    }
    
    // Xử lý ngày tháng - giữ nguyên string format cho Google Sheets
    updateData.updatedAt = new Date().toISOString();
    updateData.ngayCapNhat = new Date().toISOString();

    const hopDong = await withRetry(() => HopDongGS.findByIdAndUpdate(id, updateData)) as HopDongDocument | null;

    if (!hopDong) {
      return notFoundResponse('Hợp đồng không tồn tại');
    }

    // Populate lại dữ liệu
    const phongId = normalizeId(hopDong.phong);
    if (phongId) {
      const phong = await withRetry(() => PhongGS.findById(phongId));
      hopDong.phong = phong ? {
        _id: phong._id,
        maPhong: phong.maPhong,
        toaNha: phong.toaNha
      } : null;
    }

    if (hopDong.khachThueId) {
      const khachThueIds = Array.isArray(hopDong.khachThueId) ? hopDong.khachThueId : [hopDong.khachThueId];
      const khachThueList = await Promise.all(
        khachThueIds.map((ktId) => withRetry(() => KhachThueGS.findById(ktId)))
      );
      hopDong.khachThueId = khachThueList
        .filter(kt => kt)
        .map((kt) => ({
          _id: kt._id,
          hoTen: (kt as { ten?: string; hoTen?: string }).ten || (kt as { hoTen?: string }).hoTen || '',
          soDienThoai: (kt as { soDienThoai: string }).soDienThoai
        }));
    }

    const nguoiDaiDienId = normalizeId(hopDong.nguoiDaiDien);
    if (nguoiDaiDienId) {
      const nguoiDaiDien = await withRetry(() => KhachThueGS.findById(nguoiDaiDienId));
      hopDong.nguoiDaiDien = nguoiDaiDien ? {
        _id: nguoiDaiDien._id,
        hoTen: (nguoiDaiDien as { ten?: string; hoTen?: string }).ten || (nguoiDaiDien as { hoTen?: string }).hoTen || '',
        soDienThoai: (nguoiDaiDien as { soDienThoai: string }).soDienThoai
      } : null;
    }

    // Cập nhật trạng thái phòng và khách thuê tự động
    if (phongId) {
      await updatePhongStatus(phongId);
    }
    
    if (validatedData.khachThueId) {
      const normalizedKhachThueIds = validatedData.khachThueId.map(id => normalizeId(id)).filter((id): id is string => id !== null);
      await updateAllKhachThueStatus(normalizedKhachThueIds);
    } else {
      const existingKhachThueIds = Array.isArray(existingHopDong.khachThueId) 
        ? existingHopDong.khachThueId 
        : [existingHopDong.khachThueId];
      const normalizedExistingIds = existingKhachThueIds.map(id => normalizeId(id)).filter((id): id is string => id !== null);
      await updateAllKhachThueStatus(normalizedExistingIds);
    }

    return successResponse(hopDong, 'Hợp đồng đã được cập nhật thành công');

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi cập nhật hợp đồng');
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

    const hopDong = await withRetry(() => HopDongGS.findById(id)) as HopDongDocument | null;
    if (!hopDong) {
      return notFoundResponse('Hợp đồng không tồn tại');
    }

    // Lưu thông tin phòng và khách thuê trước khi xóa
    const phongId = normalizeId(hopDong.phong);
    const khachThueIds = Array.isArray(hopDong.khachThueId) 
      ? hopDong.khachThueId 
      : [hopDong.khachThueId];
    const normalizedKhachThueIds = khachThueIds.map(id => normalizeId(id)).filter((id): id is string => id !== null);

    await withRetry(() => HopDongGS.findByIdAndDelete(id));

    // Cập nhật trạng thái phòng và khách thuê sau khi xóa hợp đồng
    if (phongId) {
      await updatePhongStatus(phongId);
    }
    await updateAllKhachThueStatus(normalizedKhachThueIds);

    return successResponse(null, 'Hợp đồng đã được xóa thành công');

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi xóa hợp đồng');
  }
}
