import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { HopDongGS, PhongGS, KhachThueGS } from '@/lib/googlesheets-models';
import { updatePhongStatus, updateAllKhachThueStatus } from '@/lib/status-utils';
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
      validatedData = hopDongSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationErrorResponse(error);
      }
      throw error;
    }

    // Check if phong exists
    const allPhong = await withRetry(() => PhongGS.find());
    const normalizedPhongId = normalizeId(validatedData.phong);
    if (!normalizedPhongId) {
      return badRequestResponse('ID phòng không hợp lệ');
    }
    
    const phong = allPhong.find((p) => compareIds(p._id, normalizedPhongId));
    if (!phong) {
      return badRequestResponse('Phòng không tồn tại');
    }

    // Check if all khach thue exist
    const allKhachThue = await withRetry(() => KhachThueGS.find());
    const normalizedKhachThueIds = validatedData.khachThueId.map(id => normalizeId(id)).filter((id): id is string => id !== null);
    const khachThueList = allKhachThue.filter((kt) => 
      normalizedKhachThueIds.some(id => compareIds(kt._id, id))
    );
    if (khachThueList.length !== normalizedKhachThueIds.length) {
      return badRequestResponse('Một hoặc nhiều khách thuê không tồn tại');
    }

    // Check if nguoi dai dien is in khach thue list
    const normalizedNguoiDaiDien = normalizeId(validatedData.nguoiDaiDien);
    if (!normalizedNguoiDaiDien) {
      return badRequestResponse('ID người đại diện không hợp lệ');
    }
    
    if (!normalizedKhachThueIds.some(id => compareIds(id, normalizedNguoiDaiDien))) {
      return badRequestResponse('Người đại diện phải là một trong các khách thuê');
    }

    // Kiểm tra phòng có hợp đồng đang hoạt động không
    const allHopDong = await withRetry(() => HopDongGS.find());
    const existingHopDong = allHopDong.find((hd) => {
      if (hd.trangThai !== 'hoatDong') return false;
      if (!compareIds(hd.phong, normalizedPhongId)) return false;
      
      const hdNgayBatDau = hd.ngayBatDau ? new Date(hd.ngayBatDau) : null;
      const hdNgayKetThuc = hd.ngayKetThuc ? new Date(hd.ngayKetThuc) : null;
      const newNgayBatDau = new Date(validatedData.ngayBatDau);
      const newNgayKetThuc = new Date(validatedData.ngayKetThuc);
      
      if (!hdNgayBatDau || !hdNgayKetThuc) return false;
      
      return (hdNgayBatDau <= newNgayKetThuc && hdNgayKetThuc >= newNgayBatDau);
    });

    if (existingHopDong) {
      return badRequestResponse('Phòng đã có hợp đồng trong khoảng thời gian này');
    }

    const newHopDong = await withRetry(() => HopDongGS.create({
      ...validatedData,
      phong: normalizedPhongId,
      khachThueId: normalizedKhachThueIds,
      nguoiDaiDien: normalizedNguoiDaiDien,
      ngayBatDau: new Date(validatedData.ngayBatDau).toISOString(),
      ngayKetThuc: new Date(validatedData.ngayKetThuc).toISOString(),
      phiDichVu: validatedData.phiDichVu || [],
      trangThai: 'hoatDong', // Set default status
    }));

    console.log(`✅ Created new contract: ${newHopDong._id} for phong: ${validatedData.phong}`);

    // Cập nhật trạng thái phòng và khách thuê SAU KHI hợp đồng đã được tạo
    // Wait a bit to ensure contract is saved to Google Sheets
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update phong status - this will fetch fresh contract data
    // Force update to 'dangThue' since we just created an active contract
    try {
      console.log(`🔄 Force updating phong ${normalizedPhongId} status to 'dangThue'...`);
      
      // Directly update to 'dangThue' since we know there's an active contract
      await withRetry(() => PhongGS.findByIdAndUpdate(normalizedPhongId, {
        trangThai: 'dangThue',
        nguoiThue: normalizedNguoiDaiDien,
        updatedAt: new Date().toISOString(),
        ngayCapNhat: new Date().toISOString(),
      }));
      
      console.log(`✅ Directly updated phong ${normalizedPhongId} status to 'dangThue'`);
      
      // Also call the calculation function to ensure consistency
      await updatePhongStatus(normalizedPhongId);
    } catch (error) {
      console.error('Error updating phong status:', error);
      // Continue even if status update fails
    }
    
    // Update khach thue status and phongDangThue
    try {
      await Promise.all([
        updateAllKhachThueStatus(normalizedKhachThueIds),
        ...normalizedKhachThueIds.map(id => 
          withRetry(() => KhachThueGS.findByIdAndUpdate(id, {
            phongDangThue: normalizedPhongId,
            updatedAt: new Date().toISOString(),
            ngayCapNhat: new Date().toISOString(),
          }))
        )
      ]);
    } catch (error) {
      console.error('Error updating khach thue status:', error);
      // Continue even if status update fails
    }

    return successResponse(newHopDong, 'Hợp đồng đã được tạo thành công', 201);

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi tạo hợp đồng');
  }
}
