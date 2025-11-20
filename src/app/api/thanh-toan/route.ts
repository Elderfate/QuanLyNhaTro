import { NextRequest } from 'next/server';
import { ThanhToanGS, HoaDonGS, PhongGS, KhachThueGS, NguoiDungGS, HopDongGS } from '@/lib/googlesheets-models';
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

// POST - Tạo thanh toán mới
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

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

    // Kiểm tra hóa đơn tồn tại
    const normalizedHoaDonId = normalizeId(hoaDonId);
    if (!normalizedHoaDonId) {
      return badRequestResponse('ID hóa đơn không hợp lệ');
    }
    
    const hoaDon = await withRetry(() => HoaDonGS.findById(normalizedHoaDonId)) as HoaDonDocument | null;
    if (!hoaDon) {
      return notFoundResponse('Hóa đơn không tồn tại');
    }

    // Kiểm tra số tiền thanh toán không vượt quá số tiền còn lại
    const conLai = hoaDon.conLai || 0;
    if (soTien > conLai) {
      return badRequestResponse('Số tiền thanh toán không được vượt quá số tiền còn lại');
    }

    // Validate thông tin chuyển khoản nếu phương thức là chuyển khoản
    if (phuongThuc === 'chuyenKhoan' && !thongTinChuyenKhoan) {
      return badRequestResponse('Thông tin chuyển khoản là bắt buộc');
    }

    // Tạo thanh toán mới
    const thanhToanData = {
      hoaDon: hoaDonId,
      soTien,
      phuongThuc,
      thongTinChuyenKhoan: phuongThuc === 'chuyenKhoan' ? thongTinChuyenKhoan : undefined,
      ngayThanhToan: ngayThanhToan ? new Date(ngayThanhToan).toISOString() : new Date().toISOString(),
      nguoiNhan: session.user.id,
      ghiChu: ghiChu || '',
      anhBienLai: anhBienLai || '',
    };

    const newThanhToan = await withRetry(() => ThanhToanGS.create(thanhToanData));

    // Cập nhật hóa đơn
    const daThanhToanMoi = (hoaDon.daThanhToan || 0) + soTien;
    const tongTien = hoaDon.tongTien || 0;
    const conLaiMoi = tongTien - daThanhToanMoi;
    
    let trangThaiMoi: HoaDon['trangThai'] = 'chuaThanhToan';
    if (conLaiMoi <= 0) {
      trangThaiMoi = 'daThanhToan';
    } else if (daThanhToanMoi > 0) {
      trangThaiMoi = 'daThanhToanMotPhan';
    }

    const updatedHoaDon = await withRetry(() => HoaDonGS.findByIdAndUpdate(normalizedHoaDonId, {
      daThanhToan: daThanhToanMoi,
      conLai: conLaiMoi,
      trangThai: trangThaiMoi,
      updatedAt: new Date().toISOString(),
    })) as HoaDonDocument | null;

    // Lấy thông tin đầy đủ để trả về
    const [allPhongs, allKhachThues, allHopDongs, allNguoiDungs] = await Promise.all([
      withRetry(() => PhongGS.find()),
      withRetry(() => KhachThueGS.find()),
      withRetry(() => HopDongGS.find()),
      withRetry(() => NguoiDungGS.find())
    ]);

    const updatedPhongId = updatedHoaDon ? normalizeId(updatedHoaDon.phong) : null;
    const updatedKhachThueId = updatedHoaDon ? normalizeId(updatedHoaDon.khachThue) : null;
    const updatedHopDongId = updatedHoaDon ? normalizeId(updatedHoaDon.hopDong) : null;
    const nguoiNhanId = normalizeId(newThanhToan.nguoiNhan);

    const phong = updatedPhongId ? allPhongs.find((p) => compareIds(p._id, updatedPhongId)) : null;
    const khachThue = updatedKhachThueId ? allKhachThues.find((kt) => compareIds(kt._id, updatedKhachThueId)) : null;
    const hopDong = updatedHopDongId ? allHopDongs.find((hd) => compareIds(hd._id, updatedHopDongId)) : null;
    const nguoiNhan = nguoiNhanId ? allNguoiDungs.find((nd) => compareIds(nd._id, nguoiNhanId)) : null;

    const populatedThanhToan = {
      ...newThanhToan,
      hoaDon: updatedHoaDon ? {
        _id: updatedHoaDon._id,
        maHoaDon: updatedHoaDon.maHoaDon || (updatedHoaDon as { soHoaDon?: string }).soHoaDon || '',
        thang: updatedHoaDon.thang,
        nam: updatedHoaDon.nam,
        tongTien: updatedHoaDon.tongTien
      } : null,
      nguoiNhan: nguoiNhan ? {
        _id: nguoiNhan._id,
        hoTen: (nguoiNhan as { ten?: string; name?: string }).ten || (nguoiNhan as { name?: string }).name || '',
        email: (nguoiNhan as { email?: string }).email || ''
      } : null
    };

    const populatedHoaDon = updatedHoaDon ? {
      ...updatedHoaDon,
      phong: phong ? { _id: phong._id, maPhong: phong.maPhong } : null,
      khachThue: khachThue ? { 
        _id: khachThue._id, 
        hoTen: (khachThue as { ten?: string; hoTen?: string }).ten || (khachThue as { hoTen?: string }).hoTen || '' 
      } : null,
      hopDong: hopDong ? { 
        _id: hopDong._id, 
        maHopDong: (hopDong as { maHopDong?: string; soHopDong?: string }).maHopDong || (hopDong as { soHopDong?: string }).soHopDong || '' 
      } : null
    } : null;

    return successResponse({
      thanhToan: populatedThanhToan,
      hoaDon: populatedHoaDon
    }, 'Tạo thanh toán thành công', 201);
  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi tạo thanh toán');
  }
}
