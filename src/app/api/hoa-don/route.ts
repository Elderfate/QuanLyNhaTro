import { NextRequest } from 'next/server';
import { HoaDonGS, HopDongGS, PhongGS, KhachThueGS } from '@/lib/googlesheets-models';
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
import type { HoaDonDocument, HopDongDocument } from '@/lib/api-types';
import { PhiDichVu } from '@/types';

// GET - Lấy hóa đơn theo ID
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return badRequestResponse('Thiếu ID hóa đơn');
    }

    const hoaDon = await withRetry(() => HoaDonGS.findById(id)) as HoaDonDocument | null;
    if (!hoaDon) {
      return notFoundResponse('Hóa đơn không tồn tại');
    }

    // Populate relationships
    const hopDongId = normalizeId(hoaDon.hopDong);
    if (hopDongId) {
      const hopDong = await withRetry(() => HopDongGS.findById(hopDongId));
      hoaDon.hopDong = hopDong as unknown;
    }
    
    const phongId = normalizeId(hoaDon.phong);
    if (phongId) {
      const phong = await withRetry(() => PhongGS.findById(phongId));
      hoaDon.phong = phong as unknown;
    }
    
    const khachThueId = normalizeId(hoaDon.khachThue);
    if (khachThueId) {
      const khachThue = await withRetry(() => KhachThueGS.findById(khachThueId));
      hoaDon.khachThue = khachThue as unknown;
    }

    return successResponse(hoaDon);
  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi lấy thông tin hóa đơn');
  }
}

// POST - Tạo hóa đơn mới
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const {
      maHoaDon,
      hopDong,
      thang,
      nam,
      tienPhong,
      chiSoDienBanDau,
      chiSoDienCuoiKy,
      chiSoNuocBanDau,
      chiSoNuocCuoiKy,
      phiDichVu,
      ghiChu
    } = body;

    // Validate required fields
    if (!hopDong) {
      return badRequestResponse('Thiếu thông tin bắt buộc');
    }

    // Kiểm tra hợp đồng tồn tại
    const normalizedHopDongId = normalizeId(hopDong);
    if (!normalizedHopDongId) {
      return badRequestResponse('ID hợp đồng không hợp lệ');
    }
    
    const hopDongData = await withRetry(() => HopDongGS.findById(normalizedHopDongId)) as HopDongDocument | null;
    
    if (!hopDongData) {
      return notFoundResponse('Hợp đồng không tồn tại');
    }

    // Populate phong and khachThueId
    const phongId = normalizeId(hopDongData.phong);
    const phong = phongId ? await withRetry(() => PhongGS.findById(phongId)) : null;
    const khachThueIds = Array.isArray(hopDongData.khachThueId) 
      ? hopDongData.khachThueId 
      : [hopDongData.khachThueId];
    const normalizedKhachThueIds = khachThueIds.map(id => normalizeId(id)).filter((id): id is string => id !== null);
    const khachThueList = await Promise.all(
      normalizedKhachThueIds.map((id) => withRetry(() => KhachThueGS.findById(id)))
    );

    // Tạo mã hóa đơn (sử dụng mã từ frontend hoặc tự sinh)
    let finalMaHoaDon = maHoaDon;
    
    if (!finalMaHoaDon || finalMaHoaDon.trim() === '') {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
      finalMaHoaDon = `HD${year}${month}${day}${randomNum}`;
    }

    // Kiểm tra mã hóa đơn đã tồn tại chưa
    const allHoaDon = await withRetry(() => HoaDonGS.find());
    const existingHoaDon = allHoaDon.find((hd) => {
      const hdMaHoaDon = (hd as HoaDonDocument).maHoaDon || (hd as { soHoaDon?: string }).soHoaDon;
      return hdMaHoaDon === finalMaHoaDon;
    });
    if (existingHoaDon) {
      // Nếu mã từ frontend bị trùng, tự sinh mã mới
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
      finalMaHoaDon = `HD${year}${month}${day}${randomNum}`;
    }

    const normalizedPhongId = phongId;
    const nguoiDaiDienId = normalizeId(hopDongData.nguoiDaiDien);
    const khachThueId = nguoiDaiDienId || (khachThueList[0]?._id);

    // Hóa đơn hàng tháng
    if (!thang || !nam || tienPhong === undefined) {
      return badRequestResponse('Thiếu thông tin cho hóa đơn hàng tháng');
    }

    // Kiểm tra hóa đơn tháng này đã tồn tại chưa
    const existingMonthlyHoaDon = allHoaDon.find((hd) => {
      const hdHopDongId = normalizeId(hd.hopDong);
      return compareIds(hdHopDongId, normalizedHopDongId) &&
             (hd as HoaDonDocument).thang === thang &&
             (hd as HoaDonDocument).nam === nam;
    });
    
    if (existingMonthlyHoaDon) {
      return badRequestResponse(`Hóa đơn tháng ${thang}/${nam} đã tồn tại`);
    }

    // Tự động tính chỉ số điện nước
    let chiSoDienBanDauValue = chiSoDienBanDau;
    let chiSoDienCuoiKyValue = chiSoDienCuoiKy;
    let chiSoNuocBanDauValue = chiSoNuocBanDau;
    let chiSoNuocCuoiKyValue = chiSoNuocCuoiKy;

    // Tìm hóa đơn gần nhất để lấy chỉ số cuối kỳ
    const hoaDonCuaHopDong = allHoaDon
      .filter((hd) => {
        const hdHopDongId = normalizeId(hd.hopDong);
        return compareIds(hdHopDongId, normalizedHopDongId);
      })
      .filter((hd) => {
        const hdDoc = hd as HoaDonDocument;
        return hdDoc.nam < nam || (hdDoc.nam === nam && hdDoc.thang < thang);
      })
      .sort((a, b) => {
        const aDoc = a as HoaDonDocument;
        const bDoc = b as HoaDonDocument;
        if (bDoc.nam !== aDoc.nam) return bDoc.nam - aDoc.nam;
        return bDoc.thang - aDoc.thang;
      });
    const lastHoaDon = hoaDonCuaHopDong[0] as HoaDonDocument | undefined;

    if (lastHoaDon) {
      // Hóa đơn tiếp theo: lấy chỉ số cuối kỳ từ hóa đơn trước
      chiSoDienBanDauValue = lastHoaDon.chiSoDienCuoiKy || lastHoaDon.chiSoDienMoi || 0;
      chiSoNuocBanDauValue = lastHoaDon.chiSoNuocCuoiKy || lastHoaDon.chiSoNuocMoi || 0;
    } else {
      // Hóa đơn đầu tiên: lấy chỉ số ban đầu từ hợp đồng
      chiSoDienBanDauValue = hopDongData.chiSoDienBanDau || 0;
      chiSoNuocBanDauValue = hopDongData.chiSoNuocBanDau || 0;
    }

    // Nếu không có chỉ số cuối kỳ từ form, sử dụng chỉ số ban đầu
    if (!chiSoDienCuoiKyValue) {
      chiSoDienCuoiKyValue = chiSoDienBanDauValue;
    }
    if (!chiSoNuocCuoiKyValue) {
      chiSoNuocCuoiKyValue = chiSoNuocBanDauValue;
    }

    // Tính số điện nước
    const soDien = chiSoDienCuoiKyValue - chiSoDienBanDauValue;
    const soNuoc = chiSoNuocCuoiKyValue - chiSoNuocBanDauValue;

    // Tính tiền điện nước
    const tienDienTinh = soDien * (hopDongData.giaDien || 0);
    const tienNuocTinh = soNuoc * (hopDongData.giaNuoc || 0);
    const tienDichVu = phiDichVu?.reduce((sum: number, phi: PhiDichVu) => sum + phi.gia, 0) || 0;

    const tongTien = tienPhong + tienDienTinh + tienNuocTinh + tienDichVu;

    // Calculate hanThanhToan date
    const ngayThanhToan = hopDongData.ngayThanhToan || 1;
    const hanThanhToanDate = new Date(nam, thang - 1, ngayThanhToan);

    // Reduce fields to avoid "Sheet is not large enough" error
    // Only include essential fields (max 30 columns)
    const hoaDonData = {
      _id: `hoadon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      maHoaDon: finalMaHoaDon,
      hopDong: hopDong,
      phong: phongId,
      khachThue: khachThueId,
      thang,
      nam,
      tienPhong,
      tienDien: tienDienTinh,
      soDien,
      chiSoDienBanDau: chiSoDienBanDauValue,
      chiSoDienCuoiKy: chiSoDienCuoiKyValue,
      tienNuoc: tienNuocTinh,
      soNuoc,
      chiSoNuocBanDau: chiSoNuocBanDauValue,
      chiSoNuocCuoiKy: chiSoNuocCuoiKyValue,
      phiDichVu: phiDichVu || [],
      tienDichVu: tienDichVu,
      tongTien,
      daThanhToan: 0,
      conLai: tongTien,
      trangThai: 'chuaThanhToan',
      hanThanhToan: hanThanhToanDate.toISOString(),
      ghiChu: ghiChu || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const hoaDon = await withRetry(() => HoaDonGS.create(hoaDonData)) as HoaDonDocument;

    // Populate để trả về dữ liệu đầy đủ
    const createdHopDongId = normalizeId(hoaDon.hopDong);
    if (createdHopDongId) {
      const hopDongPop = await withRetry(() => HopDongGS.findById(createdHopDongId)) as HopDongDocument | null;
      hoaDon.hopDong = hopDongPop ? { _id: hopDongPop._id, maHopDong: hopDongPop.maHopDong || (hopDongPop as { soHopDong?: string }).soHopDong || '' } : null;
    }
    
    const createdPhongId = normalizeId(hoaDon.phong);
    if (createdPhongId) {
      const phongPop = await withRetry(() => PhongGS.findById(createdPhongId));
      hoaDon.phong = phongPop ? { _id: phongPop._id, maPhong: phongPop.maPhong } : null;
    }
    
    const createdKhachThueId = normalizeId(hoaDon.khachThue);
    if (createdKhachThueId) {
      const khachThuePop = await withRetry(() => KhachThueGS.findById(createdKhachThueId));
      hoaDon.khachThue = khachThuePop ? {
        _id: khachThuePop._id,
        hoTen: (khachThuePop as { ten?: string; hoTen?: string }).ten || (khachThuePop as { hoTen?: string }).hoTen || '',
        soDienThoai: (khachThuePop as { soDienThoai: string }).soDienThoai
      } : null;
    }

    return successResponse(hoaDon, 'Tạo hóa đơn thành công', 201);
  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi tạo hóa đơn');
  }
}

// PUT - Cập nhật hóa đơn
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const {
      id,
      maHoaDon,
      hopDong,
      thang,
      nam,
      tienPhong,
      chiSoDienBanDau,
      chiSoDienCuoiKy,
      chiSoNuocBanDau,
      chiSoNuocCuoiKy,
      phiDichVu,
      daThanhToan,
      trangThai,
      hanThanhToan,
      ghiChu
    } = body;

    // Validate required fields
    if (!id) {
      return badRequestResponse('Thiếu ID hóa đơn');
    }

    // Kiểm tra hóa đơn tồn tại
    const existingHoaDon = await withRetry(() => HoaDonGS.findById(id)) as HoaDonDocument | null;
    if (!existingHoaDon) {
      return notFoundResponse('Hóa đơn không tồn tại');
    }

    // Kiểm tra hợp đồng tồn tại
    const normalizedHopDongId = normalizeId(hopDong);
    if (!normalizedHopDongId) {
      return badRequestResponse('ID hợp đồng không hợp lệ');
    }
    
    const hopDongData = await withRetry(() => HopDongGS.findById(normalizedHopDongId)) as HopDongDocument | null;
    if (!hopDongData) {
      return notFoundResponse('Hợp đồng không tồn tại');
    }

    // Tính số điện nước
    const soDien = chiSoDienCuoiKy - chiSoDienBanDau;
    const soNuoc = chiSoNuocCuoiKy - chiSoNuocBanDau;

    // Tính tiền điện nước
    const tienDienTinh = soDien * (hopDongData.giaDien || 0);
    const tienNuocTinh = soNuoc * (hopDongData.giaNuoc || 0);
    const tienDichVu = phiDichVu?.reduce((sum: number, phi: PhiDichVu) => sum + phi.gia, 0) || 0;

    const tongTien = tienPhong + tienDienTinh + tienNuocTinh + tienDichVu;
    const conLai = tongTien - daThanhToan;

    // Cập nhật hóa đơn
    const updatedHoaDon = await withRetry(() => HoaDonGS.findByIdAndUpdate(id, {
      maHoaDon,
      soHoaDon: maHoaDon,
      hopDong: normalizedHopDongId,
      thang,
      nam,
      tienPhong,
      tienDien: tienDienTinh,
      soDien,
      chiSoDienBanDau,
      chiSoDienCuoiKy,
      chiSoDienMoi: chiSoDienCuoiKy,
      tienNuoc: tienNuocTinh,
      soNuoc,
      chiSoNuocBanDau,
      chiSoNuocCuoiKy,
      chiSoNuocMoi: chiSoNuocCuoiKy,
      phiDichVu: phiDichVu || [],
      tienDichVu: tienDichVu,
      tongTien,
      daThanhToan,
      conLai,
      trangThai,
      hanThanhToan: hanThanhToan ? new Date(hanThanhToan).toISOString() : existingHoaDon.hanThanhToan,
      ghiChu: ghiChu || existingHoaDon.ghiChu,
      updatedAt: new Date().toISOString(),
      ngayCapNhat: new Date().toISOString(),
    })) as HoaDonDocument | null;

    if (!updatedHoaDon) {
      return notFoundResponse('Hóa đơn không tồn tại');
    }

    // Populate relationships
    const updatedHopDongId = normalizeId(updatedHoaDon.hopDong);
    if (updatedHopDongId) {
      const hopDongPop = await withRetry(() => HopDongGS.findById(updatedHopDongId)) as HopDongDocument | null;
      updatedHoaDon.hopDong = hopDongPop ? { _id: hopDongPop._id, maHopDong: hopDongPop.maHopDong || (hopDongPop as { soHopDong?: string }).soHopDong || '' } : null;
    }
    
    const updatedPhongId = normalizeId(updatedHoaDon.phong);
    if (updatedPhongId) {
      const phongPop = await withRetry(() => PhongGS.findById(updatedPhongId));
      updatedHoaDon.phong = phongPop ? { _id: phongPop._id, maPhong: phongPop.maPhong } : null;
    }
    
    const updatedKhachThueId = normalizeId(updatedHoaDon.khachThue);
    if (updatedKhachThueId) {
      const khachThuePop = await withRetry(() => KhachThueGS.findById(updatedKhachThueId));
      updatedHoaDon.khachThue = khachThuePop ? {
        _id: khachThuePop._id,
        hoTen: (khachThuePop as { ten?: string; hoTen?: string }).ten || (khachThuePop as { hoTen?: string }).hoTen || '',
        soDienThoai: (khachThuePop as { soDienThoai: string }).soDienThoai
      } : null;
    }

    return successResponse(updatedHoaDon, 'Cập nhật hóa đơn thành công');
  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi cập nhật hóa đơn');
  }
}

// DELETE - Xóa hóa đơn
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return badRequestResponse('Thiếu ID hóa đơn');
    }

    const deletedHoaDon = await withRetry(() => HoaDonGS.findByIdAndDelete(id));
    if (!deletedHoaDon) {
      return notFoundResponse('Hóa đơn không tồn tại');
    }

    return successResponse(null, 'Xóa hóa đơn thành công');
  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi xóa hóa đơn');
  }
}