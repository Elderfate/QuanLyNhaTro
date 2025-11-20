import { NextRequest } from 'next/server';
import { ThanhToanGS, HoaDonGS, NguoiDungGS } from '@/lib/googlesheets-models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
  badRequestResponse,
} from '@/lib/api-response';
import { normalizeId, compareIds } from '@/lib/id-utils';
import { withRetry } from '@/lib/retry-utils';
import type { HoaDonDocument } from '@/lib/api-types';

// PUT - Cập nhật thanh toán
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const { id } = params;
    const body = await request.json();
    const {
      hoaDonId,
      soTien,
      phuongThuc,
      thongTinChuyenKhoan,
      ngayThanhToan,
      ghiChu,
      anhBienLai
    } = body;

    // Validate required fields
    if (!hoaDonId || !soTien || !phuongThuc) {
      return badRequestResponse('Thiếu thông tin bắt buộc');
    }

    // Tìm thanh toán hiện tại
    const thanhToanHienTai = await withRetry(() => ThanhToanGS.findById(id));
    if (!thanhToanHienTai) {
      return notFoundResponse('Thanh toán không tồn tại');
    }

    // Kiểm tra hóa đơn tồn tại
    const normalizedHoaDonId = normalizeId(hoaDonId);
    if (!normalizedHoaDonId) {
      return badRequestResponse('ID hóa đơn không hợp lệ');
    }
    
    const hoaDon = await withRetry(() => HoaDonGS.findById(normalizedHoaDonId)) as HoaDonDocument | null;
    if (!hoaDon) {
      return notFoundResponse('Hóa đơn không tồn tại');
    }

    // Tính toán lại số tiền còn lại của hóa đơn
    // Trước tiên, hoàn lại số tiền cũ
    const oldHoaDonId = normalizeId(thanhToanHienTai.hoaDon);
    if (oldHoaDonId && !compareIds(oldHoaDonId, normalizedHoaDonId)) {
      const hoaDonCu = await withRetry(() => HoaDonGS.findById(oldHoaDonId)) as HoaDonDocument | null;
      if (hoaDonCu) {
        const daThanhToanCu = (hoaDonCu.daThanhToan || 0) - (thanhToanHienTai.soTien || 0);
        const tongTienCu = hoaDonCu.tongTien || 0;
        const conLaiCu = tongTienCu - daThanhToanCu;
        
        let trangThaiCu: HoaDon['trangThai'] = 'chuaThanhToan';
        if (conLaiCu <= 0) {
          trangThaiCu = 'daThanhToan';
        } else if (daThanhToanCu > 0) {
          trangThaiCu = 'daThanhToanMotPhan';
        }
        
        await withRetry(() => HoaDonGS.findByIdAndUpdate(oldHoaDonId, {
          daThanhToan: daThanhToanCu,
          conLai: conLaiCu,
          trangThai: trangThaiCu,
          updatedAt: new Date().toISOString(),
        }));
      }
    }

    // Kiểm tra số tiền thanh toán mới không vượt quá số tiền còn lại
    const conLai = hoaDon.conLai || 0;
    if (soTien > conLai) {
      return badRequestResponse('Số tiền thanh toán không được vượt quá số tiền còn lại');
    }

    // Validate thông tin chuyển khoản nếu phương thức là chuyển khoản
    if (phuongThuc === 'chuyenKhoan' && !thongTinChuyenKhoan) {
      return badRequestResponse('Thông tin chuyển khoản là bắt buộc');
    }

    // Cập nhật thanh toán
    const updatedThanhToan = await withRetry(() => ThanhToanGS.findByIdAndUpdate(id, {
      hoaDon: normalizedHoaDonId,
      soTien,
      phuongThuc,
      thongTinChuyenKhoan: phuongThuc === 'chuyenKhoan' ? thongTinChuyenKhoan : undefined,
      ngayThanhToan: ngayThanhToan || new Date().toISOString(),
      ghiChu: ghiChu || '',
      anhBienLai: anhBienLai || '',
      updatedAt: new Date().toISOString(),
    }));

    if (!updatedThanhToan) {
      return notFoundResponse('Thanh toán không tồn tại');
    }

    // Cập nhật hóa đơn mới
    const tongTien = hoaDon.tongTien || 0;
    const daThanhToanMoi = (hoaDon.daThanhToan || 0) + soTien;
    const conLaiMoi = tongTien - daThanhToanMoi;
    
    let trangThaiMoi: HoaDon['trangThai'] = 'chuaThanhToan';
    if (conLaiMoi <= 0) {
      trangThaiMoi = 'daThanhToan';
    } else if (daThanhToanMoi > 0) {
      trangThaiMoi = 'daThanhToanMotPhan';
    }

    await withRetry(() => HoaDonGS.findByIdAndUpdate(normalizedHoaDonId, {
      daThanhToan: daThanhToanMoi,
      conLai: conLaiMoi,
      trangThai: trangThaiMoi,
      updatedAt: new Date().toISOString(),
    }));

    // Populate để trả về dữ liệu đầy đủ
    const updatedHoaDonId = normalizeId(updatedThanhToan.hoaDon);
    if (updatedHoaDonId) {
      const hoaDonPop = await withRetry(() => HoaDonGS.findById(updatedHoaDonId)) as HoaDonDocument | null;
      updatedThanhToan.hoaDon = hoaDonPop ? {
        _id: hoaDonPop._id,
        maHoaDon: hoaDonPop.maHoaDon || (hoaDonPop as { soHoaDon?: string }).soHoaDon || '',
        thang: hoaDonPop.thang,
        nam: hoaDonPop.nam,
        tongTien: hoaDonPop.tongTien
      } : null;
    }
    
    const nguoiNhanId = normalizeId(updatedThanhToan.nguoiNhan);
    if (nguoiNhanId) {
      const nguoiNhan = await withRetry(() => NguoiDungGS.findById(nguoiNhanId));
      updatedThanhToan.nguoiNhan = nguoiNhan ? {
        _id: nguoiNhan._id,
        hoTen: (nguoiNhan as { ten?: string }).ten || '',
        email: (nguoiNhan as { email?: string }).email || ''
      } : null;
    }

    return successResponse(updatedThanhToan, 'Cập nhật thanh toán thành công');
  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi cập nhật thanh toán');
  }
}

// DELETE - Xóa thanh toán
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const { id } = params;

    // Tìm thanh toán
    const thanhToan = await withRetry(() => ThanhToanGS.findById(id));
    if (!thanhToan) {
      return notFoundResponse('Thanh toán không tồn tại');
    }

    // Cập nhật lại hóa đơn (hoàn lại số tiền)
    const hoaDonId = normalizeId(thanhToan.hoaDon);
    if (hoaDonId) {
      const hoaDon = await withRetry(() => HoaDonGS.findById(hoaDonId)) as HoaDonDocument | null;
      if (hoaDon) {
        const tongTien = hoaDon.tongTien || 0;
        const daThanhToanMoi = (hoaDon.daThanhToan || 0) - (thanhToan.soTien || 0);
        const conLaiMoi = tongTien - daThanhToanMoi;
        
        let trangThaiMoi: HoaDon['trangThai'] = 'chuaThanhToan';
        if (conLaiMoi <= 0) {
          trangThaiMoi = 'daThanhToan';
        } else if (daThanhToanMoi > 0) {
          trangThaiMoi = 'daThanhToanMotPhan';
        }
        
        await withRetry(() => HoaDonGS.findByIdAndUpdate(hoaDonId, {
          daThanhToan: daThanhToanMoi,
          conLai: conLaiMoi,
          trangThai: trangThaiMoi,
          updatedAt: new Date().toISOString(),
        }));
      }
    }

    // Xóa thanh toán
    await withRetry(() => ThanhToanGS.findByIdAndDelete(id));

    return successResponse(null, 'Xóa thanh toán thành công');
  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi xóa thanh toán');
  }
}
