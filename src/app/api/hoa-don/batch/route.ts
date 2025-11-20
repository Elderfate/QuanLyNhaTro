import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { HopDongGS, HoaDonGS, PhongGS, KhachThueGS } from '@/lib/googlesheets-models';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { thang, nam, phongIds } = body;

    if (!thang || !nam || !Array.isArray(phongIds) || phongIds.length === 0) {
      return NextResponse.json(
        { message: 'Tháng, năm và danh sách phòng là bắt buộc' },
        { status: 400 }
      );
    }

    // Get all contracts and invoices with retry logic for 429 errors
    let allHopDong, allHoaDon, allPhong, allKhachThue;
    let retries = 0;
    const maxRetries = 3;
    
    // Helper function to retry on 429
    const retryFetch = async (fn: () => Promise<any>, name: string) => {
      retries = 0;
      while (retries < maxRetries) {
        try {
          return await fn();
        } catch (error: any) {
          if (error.response?.status === 429 && retries < maxRetries - 1) {
            const waitTime = (retries + 1) * 2000;
            console.log(`API 429 error fetching ${name}, retrying in ${waitTime}ms... (attempt ${retries + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retries++;
          } else {
            throw error;
          }
        }
      }
    };
    
    try {
      allHopDong = await retryFetch(() => HopDongGS.find(), 'contracts');
      allHoaDon = await retryFetch(() => HoaDonGS.find(), 'invoices');
      allPhong = await retryFetch(() => PhongGS.find(), 'rooms');
      allKhachThue = await retryFetch(() => KhachThueGS.find(), 'tenants');
    } catch (error: any) {
      console.error('Error fetching data for batch invoice creation:', error);
      return NextResponse.json(
        { 
          success: false,
          message: error.response?.status === 429 
            ? 'Quá nhiều yêu cầu. Vui lòng thử lại sau vài giây.'
            : 'Lỗi khi tải dữ liệu từ hệ thống',
          data: { created: 0, total: 0, results: [], errors: [] }
        },
        { status: error.response?.status || 500 }
      );
    }

    const results = [];
    const errors = [];

    for (const phongId of phongIds) {
      try {
        // Find active contract for this room
        const now = new Date();
        const hopDong = allHopDong.find((hd: any) => {
          const ngayBatDau = hd.ngayBatDau ? new Date(hd.ngayBatDau) : null;
          const ngayKetThuc = hd.ngayKetThuc ? new Date(hd.ngayKetThuc) : null;
          // Normalize phong ID
          let phongIdFromHd = hd.phong;
          if (typeof phongIdFromHd === 'object' && phongIdFromHd !== null) {
            phongIdFromHd = phongIdFromHd._id || phongIdFromHd.id || phongIdFromHd;
          }
          return String(phongIdFromHd) === String(phongId) &&
                 hd.trangThai === 'hoatDong' &&
                 ngayBatDau && ngayBatDau <= now &&
                 ngayKetThuc && ngayKetThuc >= now;
        });

        if (!hopDong) {
          errors.push(`Phòng ${phongId} không có hợp đồng đang hoạt động`);
          continue;
        }

        // Check if invoice already exists
        const existingInvoice = allHoaDon.find((hd: any) => {
          const hopDongId = typeof hd.hopDong === 'object' ? hd.hopDong._id : hd.hopDong;
          return String(hopDongId) === String(hopDong._id) &&
                 hd.thang === thang &&
                 hd.nam === nam;
        });

        if (existingInvoice) {
          errors.push(`Phòng ${phongId} đã có hóa đơn cho tháng ${thang}/${nam}`);
          continue;
        }

        // Get latest invoice for this contract to get previous readings
        const invoicesForContract = allHoaDon
          .filter((hd: any) => {
            const hopDongId = typeof hd.hopDong === 'object' ? hd.hopDong._id : hd.hopDong;
            return String(hopDongId) === String(hopDong._id);
          })
          .sort((a: any, b: any) => {
            if (a.nam !== b.nam) return b.nam - a.nam;
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
        const phong = allPhong.find((p: any) => String(p._id) === String(phongId));
        const tienPhong = phong?.giaThue || hopDong.giaThue || 0;
        
        const tongTien = tienPhong + tienDien + tienNuoc + tongTienDichVu;

        // Generate invoice number
        const phong = allPhong.find((p: any) => String(p._id) === String(phongId));
        const maPhong = phong?.maPhong || 'XXX';
        const invoiceNumber = `HD${nam}${String(thang).padStart(2, '0')}${maPhong}${Date.now().toString().slice(-4)}`;

        // Calculate due date
        const ngayThanhToan = hopDong.ngayThanhToan || 1;
        const dueDate = new Date(nam, thang - 1, ngayThanhToan);
        if (dueDate < now) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }

        // Create invoice
        const nguoiDaiDien = hopDong.nguoiDaiDien 
          ? allKhachThue.find((kt: any) => String(kt._id) === String(hopDong.nguoiDaiDien))
          : null;

        // Reduce fields to avoid "Sheet is not large enough" error (max 30 columns)
        // Reduce fields to avoid "Sheet is not large enough" error (max 30 columns)
        const hoaDonData = {
          _id: `hoadon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          maHoaDon: invoiceNumber,
          hopDong: hopDong._id,
          phong: phongId,
          khachThue: nguoiDaiDien?._id || hopDong.nguoiDaiDien,
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

        await HoaDonGS.create(hoaDonData);
        results.push({
          phongId,
          maPhong: maPhong,
          maHoaDon: invoiceNumber,
          tongTien: tongTien,
        });

      } catch (error) {
        console.error(`Error creating invoice for phong ${phongId}:`, error);
        errors.push(`Lỗi tạo hóa đơn cho phòng ${phongId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        created: results.length,
        total: phongIds.length,
        results,
        errors,
      },
      message: `Đã tạo ${results.length}/${phongIds.length} hóa đơn thành công`,
    });

  } catch (error) {
    console.error('Error in batch invoice creation:', error);
    return NextResponse.json(
      { message: 'Lỗi khi tạo hóa đơn hàng loạt' },
      { status: 500 }
    );
  }
}

