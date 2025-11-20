import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { HopDongGS, HoaDonGS, PhongGS, KhachThueGS, ChiSoDienNuocGS } from '@/lib/googlesheets-models';
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
  badRequestResponse,
} from '@/lib/api-response';
import { normalizeId, compareIds } from '@/lib/id-utils';
import { withRetry } from '@/lib/retry-utils';
import type { HoaDonDocument, HopDongDocument, PhongDocument } from '@/lib/api-types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { thang, nam, phongIds } = body;

    if (!thang || !nam || !Array.isArray(phongIds) || phongIds.length === 0) {
      return badRequestResponse('Tháng, năm và danh sách phòng là bắt buộc');
    }

    // Get all contracts and invoices with retry logic
    let allHopDong: HopDongDocument[] = [];
    let allHoaDon: HoaDonDocument[] = [];
    let allPhong: PhongDocument[] = [];
    let allKhachThue: unknown[] = [];
    
    try {
      [allHopDong, allHoaDon, allPhong, allKhachThue] = await Promise.all([
        withRetry(() => HopDongGS.find()) as Promise<HopDongDocument[]>,
        withRetry(() => HoaDonGS.find()) as Promise<HoaDonDocument[]>,
        withRetry(() => PhongGS.find()) as Promise<PhongDocument[]>,
        withRetry(() => KhachThueGS.find()),
      ]);
    } catch (error) {
      console.error('Error fetching data for batch invoice creation:', error);
      return serverErrorResponse(
        error,
        'Lỗi khi tải dữ liệu từ hệ thống'
      );
    }

    const results = [];
    const errors = [];

    for (const phongId of phongIds) {
      try {
        // Find active contract for this room
        const now = new Date();
        const normalizedPhongId = normalizeId(phongId);
        if (!normalizedPhongId) {
          errors.push(`Phòng ${phongId} có ID không hợp lệ`);
          continue;
        }
        
        const hopDong = allHopDong.find((hd) => {
          if (hd.trangThai !== 'hoatDong') return false;
          
          const ngayBatDau = hd.ngayBatDau ? new Date(hd.ngayBatDau) : null;
          const ngayKetThuc = hd.ngayKetThuc ? new Date(hd.ngayKetThuc) : null;
          if (!ngayBatDau || !ngayKetThuc) return false;
          if (ngayBatDau > now || ngayKetThuc < now) return false;
          
          return compareIds(hd.phong, normalizedPhongId);
        }) as HopDongDocument | undefined;

        if (!hopDong) {
          errors.push(`Phòng ${phongId} không có hợp đồng đang hoạt động`);
          continue;
        }

        // Check if invoice already exists
        const hopDongId = normalizeId(hopDong._id);
        const existingInvoice = allHoaDon.find((hd) => {
          const hdHopDongId = normalizeId(hd.hopDong);
          return compareIds(hdHopDongId, hopDongId) &&
                 hd.thang === thang &&
                 hd.nam === nam;
        });

        if (existingInvoice) {
          errors.push(`Phòng ${phongId} đã có hóa đơn cho tháng ${thang}/${nam}`);
          continue;
        }

        // Get latest invoice for this contract to get previous readings
        const invoicesForContract = allHoaDon
          .filter((hd) => {
            const hdHopDongId = normalizeId(hd.hopDong);
            return compareIds(hdHopDongId, hopDongId);
          })
          .sort((a, b) => {
            if (b.nam !== a.nam) return b.nam - a.nam;
            return b.thang - a.thang;
          });

        const lastInvoice = invoicesForContract[0] || null;

        // Calculate chi so ban dau and cuoi ky
        let chiSoDienBanDau = hopDong.chiSoDienBanDau || 0;
        let chiSoNuocBanDau = hopDong.chiSoNuocBanDau || 0;

        if (lastInvoice) {
          chiSoDienBanDau = lastInvoice.chiSoDienCuoiKy || lastInvoice.chiSoDienMoi || chiSoDienBanDau;
          chiSoNuocBanDau = lastInvoice.chiSoNuocCuoiKy || lastInvoice.chiSoNuocMoi || chiSoNuocBanDau;
        }

        // For now, set cuoi ky = ban dau (user can edit later)
        // Or you can fetch from latest-reading API
        const chiSoDienCuoiKy = chiSoDienBanDau;
        const chiSoNuocCuoiKy = chiSoNuocBanDau;

        const soDien = Math.max(0, chiSoDienCuoiKy - chiSoDienBanDau);
        const soNuoc = Math.max(0, chiSoNuocCuoiKy - chiSoNuocBanDau);

        const tienDien = soDien * (hopDong.giaDien || 0);
        const tienNuoc = soNuoc * (hopDong.giaNuoc || 0);
        const phiDichVu = Array.isArray(hopDong.phiDichVu) ? hopDong.phiDichVu : [];
        const tongTienDichVu = phiDichVu.reduce((sum: number, dv: any) => sum + (dv.gia || 0), 0);
        
        // Get tienPhong from phong.giaThue instead of hopDong.giaThue
        const phong = allPhong.find((p) => compareIds(p._id, normalizedPhongId)) as PhongDocument | undefined;
        const tienPhong = phong?.giaThue || hopDong.giaThue || 0;
        const maPhong = phong?.maPhong || 'XXX';
        
        const tongTien = tienPhong + tienDien + tienNuoc + tongTienDichVu;

        // Generate invoice number
        const invoiceNumber = `HD${nam}${String(thang).padStart(2, '0')}${maPhong}${Date.now().toString().slice(-4)}`;

        // Calculate due date
        const ngayThanhToan = hopDong.ngayThanhToan || 1;
        const dueDate = new Date(nam, thang - 1, ngayThanhToan);
        if (dueDate < now) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }

        // Create invoice
        const nguoiDaiDienId = normalizeId(hopDong.nguoiDaiDien);
        const nguoiDaiDien = nguoiDaiDienId 
          ? allKhachThue.find((kt) => compareIds((kt as { _id: string })._id, nguoiDaiDienId))
          : null;

        // Reduce fields to avoid "Sheet is not large enough" error (max 30 columns)
        const hoaDonData: Partial<HoaDonDocument> = {
          _id: `hoadon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          maHoaDon: invoiceNumber,
          hopDong: hopDongId || '',
          phong: normalizedPhongId,
          khachThue: nguoiDaiDienId || (nguoiDaiDien as { _id?: string })?._id || '',
          thang: thang,
          nam: nam,
          tienPhong: tienPhong,
          tienDien: tienDien,
          soDien: soDien,
          chiSoDienBanDau: chiSoDienBanDau,
          chiSoDienCuoiKy: chiSoDienCuoiKy,
          tienNuoc: tienNuoc,
          soNuoc: soNuoc,
          chiSoNuocBanDau: chiSoNuocBanDau,
          chiSoNuocCuoiKy: chiSoNuocCuoiKy,
          phiDichVu: phiDichVu,
          tienDichVu: tongTienDichVu,
          tongTien: tongTien,
          daThanhToan: 0,
          conLai: tongTien,
          hanThanhToan: dueDate.toISOString(),
          trangThai: 'chuaThanhToan',
          ghiChu: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await withRetry(() => HoaDonGS.create(hoaDonData));
        results.push({
          phongId: normalizedPhongId,
          maPhong: maPhong,
          maHoaDon: invoiceNumber,
          tongTien: tongTien,
        });

      } catch (error) {
        console.error(`Error creating invoice for phong ${phongId}:`, error);
        errors.push(`Lỗi tạo hóa đơn cho phòng ${phongId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return successResponse({
      created: results.length,
      total: phongIds.length,
      results,
      errors,
    }, `Đã tạo ${results.length}/${phongIds.length} hóa đơn thành công`);

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi tạo hóa đơn hàng loạt');
  }
}

