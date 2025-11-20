import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { HopDongGS, HoaDonGS, ChiSoDienNuocGS, PhongGS, KhachThueGS } from '@/lib/googlesheets-models';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get all active contracts
    const allHopDong = await HopDongGS.find();
    const activeContractsRaw = allHopDong.filter((hd: any) => {
      const ngayBatDau = hd.ngayBatDau ? new Date(hd.ngayBatDau) : null;
      const ngayKetThuc = hd.ngayKetThuc ? new Date(hd.ngayKetThuc) : null;
      return hd.trangThai === 'hoatDong' &&
             ngayBatDau && ngayBatDau <= currentDate &&
             ngayKetThuc && ngayKetThuc >= currentDate;
    });

    // Populate relationships
    const activeContracts = await Promise.all(activeContractsRaw.map(async (hd: any) => {
      const phong = hd.phong ? await PhongGS.findById(hd.phong) : null;
      const nguoiDaiDien = hd.nguoiDaiDien ? await KhachThueGS.findById(hd.nguoiDaiDien) : null;
      return {
        ...hd,
        phong: phong ? { _id: phong._id, maPhong: phong.maPhong } : null,
        nguoiDaiDien: nguoiDaiDien ? { _id: nguoiDaiDien._id } : null,
      };
    }));

    let createdInvoices = 0;
    let errors = [];

    for (const contract of activeContracts) {
      try {
        // Check if invoice already exists for this contract and month
        const allHoaDon = await HoaDonGS.find();
        const existingInvoice = allHoaDon.find((hd: any) =>
          hd.hopDong === contract._id &&
          hd.thang === currentMonth &&
          hd.nam === currentYear
        );

        if (existingInvoice) {
          continue; // Skip if invoice already exists
        }

        // Get utility readings for this month
        const allChiSo = await ChiSoDienNuocGS.find();
        const chiSo = allChiSo.find((cs: any) =>
          cs.phong === contract.phong?._id &&
          cs.thang === currentMonth &&
          cs.nam === currentYear
        );

        if (!chiSo) {
          errors.push(`Chưa có chỉ số điện nước cho phòng ${contract.phong.maPhong} tháng ${currentMonth}/${currentYear}`);
          continue;
        }

        // Tính toán số điện nước tiêu thụ
        let soDienTieuThu = chiSo.soDienTieuThu || chiSo.soKwh || 0;
        let soNuocTieuThu = chiSo.soNuocTieuThu || chiSo.soKhoi || 0;
        
        // Nếu đây là tháng đầu tiên của hợp đồng, tính từ chỉ số ban đầu
        const ngayBatDau = contract.ngayBatDau ? new Date(contract.ngayBatDau) : null;
        if (ngayBatDau) {
          const thangBatDau = ngayBatDau.getMonth() + 1;
          const namBatDau = ngayBatDau.getFullYear();
          
          if (currentMonth === thangBatDau && currentYear === namBatDau) {
            // Tháng đầu tiên: tính từ chỉ số ban đầu đến chỉ số hiện tại
            const chiSoDienMoi = typeof chiSo.chiSoDienMoi === 'number' ? chiSo.chiSoDienMoi : (typeof chiSo.chiSoDienCuoiKy === 'number' ? chiSo.chiSoDienCuoiKy : 0);
            const chiSoNuocMoi = typeof chiSo.chiSoNuocMoi === 'number' ? chiSo.chiSoNuocMoi : (typeof chiSo.chiSoNuocCuoiKy === 'number' ? chiSo.chiSoNuocCuoiKy : 0);
            const chiSoDienBanDau = typeof contract.chiSoDienBanDau === 'number' ? contract.chiSoDienBanDau : 0;
            const chiSoNuocBanDau = typeof contract.chiSoNuocBanDau === 'number' ? contract.chiSoNuocBanDau : 0;
            soDienTieuThu = Math.max(0, chiSoDienMoi - chiSoDienBanDau);
            soNuocTieuThu = Math.max(0, chiSoNuocMoi - chiSoNuocBanDau);
          }
        }

        // Calculate costs
        const giaDien = typeof contract.giaDien === 'number' ? contract.giaDien : 0;
        const giaNuoc = typeof contract.giaNuoc === 'number' ? contract.giaNuoc : 0;
        const tienDien = soDienTieuThu * giaDien;
        const tienNuoc = soNuocTieuThu * giaNuoc;
        const phiDichVu = Array.isArray(contract.phiDichVu) ? contract.phiDichVu : [];
        const tongTienDichVu = phiDichVu.reduce((sum: number, dv: any) => sum + (dv.gia || 0), 0);
        const tongTien = (contract.giaThue || 0) + tienDien + tienNuoc + tongTienDichVu;

        // Generate invoice number
        const invoiceNumber = `HD${currentYear}${currentMonth.toString().padStart(2, '0')}${contract.phong?.maPhong || 'XXX'}`;

        // Calculate due date (based on contract payment day)
        const ngayThanhToan = contract.ngayThanhToan || 1;
        const dueDate = new Date(currentYear, currentMonth - 1, ngayThanhToan);
        if (dueDate < currentDate) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }

        // Create invoice
        await HoaDonGS.create({
          _id: `hoadon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          maHoaDon: invoiceNumber,
          soHoaDon: invoiceNumber,
          hopDong: contract._id,
          phong: contract.phong?._id,
          khachThue: contract.nguoiDaiDien?._id,
          thang: currentMonth,
          nam: currentYear,
          tienPhong: contract.giaThue || 0,
          tienDien,
          soDien: soDienTieuThu,
          tienNuoc,
          soNuoc: soNuocTieuThu,
          phiDichVu: phiDichVu,
          tienDichVu: tongTienDichVu,
          tongTien,
          daThanhToan: 0,
          conLai: tongTien,
          hanThanhToan: dueDate.toISOString(),
          trangThai: 'chuaThanhToan',
          ngayTao: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        createdInvoices++;

      } catch (error) {
        console.error(`Error creating invoice for contract ${contract.maHopDong}:`, error);
        errors.push(`Lỗi tạo hóa đơn cho hợp đồng ${contract.maHopDong}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        createdInvoices,
        totalContracts: activeContracts.length,
        errors,
      },
      message: `Đã tạo ${createdInvoices} hóa đơn tự động`,
    });

  } catch (error) {
    console.error('Error in auto invoice generation:', error);
    return NextResponse.json(
      { message: 'Lỗi khi tạo hóa đơn tự động' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if auto-invoice can be run
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Count active contracts
    const allHopDong = await HopDongGS.find();
    const activeContractsCount = allHopDong.filter((hd: any) => {
      const ngayBatDau = hd.ngayBatDau ? new Date(hd.ngayBatDau) : null;
      const ngayKetThuc = hd.ngayKetThuc ? new Date(hd.ngayKetThuc) : null;
      return hd.trangThai === 'hoatDong' &&
             ngayBatDau && ngayBatDau <= currentDate &&
             ngayKetThuc && ngayKetThuc >= currentDate;
    }).length;

    // Count existing invoices for this month
    const allHoaDon = await HoaDonGS.find();
    const existingInvoicesCount = allHoaDon.filter((hd: any) =>
      hd.thang === currentMonth && hd.nam === currentYear
    ).length;

    // Count contracts without utility readings
    const allChiSo = await ChiSoDienNuocGS.find();
    const activeContracts = allHopDong.filter((hd: any) => {
      const ngayBatDau = hd.ngayBatDau ? new Date(hd.ngayBatDau) : null;
      const ngayKetThuc = hd.ngayKetThuc ? new Date(hd.ngayKetThuc) : null;
      return hd.trangThai === 'hoatDong' &&
             ngayBatDau && ngayBatDau <= currentDate &&
             ngayKetThuc && ngayKetThuc >= currentDate;
    });

    const contractsWithoutReadingsCount = activeContracts.filter((hd: any) => {
      const hasReading = allChiSo.some((cs: any) =>
        cs.phong === hd.phong &&
        cs.thang === currentMonth &&
        cs.nam === currentYear
      );
      return !hasReading;
    }).length;

    return NextResponse.json({
      success: true,
      data: {
        currentMonth,
        currentYear,
        activeContractsCount,
        existingInvoicesCount,
        contractsWithoutReadingsCount,
        canRun: activeContractsCount > 0 && contractsWithoutReadingsCount === 0,
      },
    });

  } catch (error) {
    console.error('Error checking auto-invoice status:', error);
    return NextResponse.json(
      { message: 'Lỗi khi kiểm tra trạng thái tạo hóa đơn tự động' },
      { status: 500 }
    );
  }
}
