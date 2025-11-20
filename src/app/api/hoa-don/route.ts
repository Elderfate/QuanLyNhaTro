import { NextRequest, NextResponse } from 'next/server';
import { HoaDonGS, HopDongGS, PhongGS, KhachThueGS } from '@/lib/googlesheets-models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PhiDichVu } from '@/types';

// GET - Lấy hóa đơn theo ID
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'Thiếu ID hóa đơn' },
        { status: 400 }
      );
    }

    const hoaDon = await HoaDonGS.findById(id);
    if (!hoaDon) {
      return NextResponse.json(
        { message: 'Hóa đơn không tồn tại' },
        { status: 404 }
      );
    }

    // Populate relationships
    if (hoaDon.hopDong) {
      const hopDong = await HopDongGS.findById(hoaDon.hopDong);
      hoaDon.hopDong = hopDong;
    }
    if (hoaDon.phong) {
      const phong = await PhongGS.findById(hoaDon.phong);
      hoaDon.phong = phong;
    }
    if (hoaDon.khachThue) {
      const khachThue = await KhachThueGS.findById(hoaDon.khachThue);
      hoaDon.khachThue = khachThue;
    }

    return NextResponse.json({
      success: true,
      data: hoaDon
    });
  } catch (error) {
    console.error('Error fetching hoa don:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Tạo hóa đơn mới
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json(
        { message: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Kiểm tra hợp đồng tồn tại
    const hopDongData = await HopDongGS.findById(hopDong);
    
    if (!hopDongData) {
      return NextResponse.json(
        { message: 'Hợp đồng không tồn tại' },
        { status: 404 }
      );
    }

    // Populate phong and khachThueId
    const phong = hopDongData.phong ? await PhongGS.findById(hopDongData.phong) : null;
    const khachThueIds = Array.isArray(hopDongData.khachThueId) 
      ? hopDongData.khachThueId 
      : [hopDongData.khachThueId];
    const khachThueList = await Promise.all(
      khachThueIds.map((id: string) => KhachThueGS.findById(id))
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
    const allHoaDon = await HoaDonGS.find();
    const existingHoaDon = allHoaDon.find((hd: any) => hd.maHoaDon === finalMaHoaDon || hd.soHoaDon === finalMaHoaDon);
    if (existingHoaDon) {
      // Nếu mã từ frontend bị trùng, tự sinh mã mới
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
      finalMaHoaDon = `HD${year}${month}${day}${randomNum}`;
    }

    const phongId = hopDongData.phong;
    const khachThueId = hopDongData.nguoiDaiDien || (khachThueList[0]?._id);

    // Hóa đơn hàng tháng
    if (!thang || !nam || tienPhong === undefined) {
      return NextResponse.json(
        { message: 'Thiếu thông tin cho hóa đơn hàng tháng' },
        { status: 400 }
      );
    }

    // Kiểm tra hóa đơn tháng này đã tồn tại chưa
    const existingMonthlyHoaDon = allHoaDon.find((hd: any) => 
      hd.hopDong === hopDong &&
      hd.thang === thang &&
      hd.nam === nam
    );
    
    if (existingMonthlyHoaDon) {
      return NextResponse.json(
        { message: `Hóa đơn tháng ${thang}/${nam} đã tồn tại` },
        { status: 400 }
      );
    }

    // Tự động tính chỉ số điện nước
    let chiSoDienBanDauValue = chiSoDienBanDau;
    let chiSoDienCuoiKyValue = chiSoDienCuoiKy;
    let chiSoNuocBanDauValue = chiSoNuocBanDau;
    let chiSoNuocCuoiKyValue = chiSoNuocCuoiKy;

    // Tìm hóa đơn gần nhất để lấy chỉ số cuối kỳ
    const hoaDonCuaHopDong = allHoaDon
      .filter((hd: any) => hd.hopDong === hopDong)
      .filter((hd: any) => hd.nam < nam || (hd.nam === nam && hd.thang < thang))
      .sort((a: any, b: any) => {
        if (b.nam !== a.nam) return b.nam - a.nam;
        return b.thang - a.thang;
      });
    const lastHoaDon = hoaDonCuaHopDong[0] || null;

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

    const hoaDonData = {
      _id: `hoadon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      maHoaDon: finalMaHoaDon,
      soHoaDon: finalMaHoaDon,
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
      chiSoDienMoi: chiSoDienCuoiKyValue,
      tienNuoc: tienNuocTinh,
      soNuoc,
      chiSoNuocBanDau: chiSoNuocBanDauValue,
      chiSoNuocCuoiKy: chiSoNuocCuoiKyValue,
      chiSoNuocMoi: chiSoNuocCuoiKyValue,
      phiDichVu: phiDichVu || [],
      tienDichVu: tienDichVu,
      tongTien,
      daThanhToan: 0,
      conLai: tongTien,
      trangThai: 'chuaThanhToan',
      hanThanhToan: hanThanhToanDate.toISOString(),
      ghiChu: ghiChu || '',
      ngayTao: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const hoaDon = await HoaDonGS.create(hoaDonData);

    // Populate để trả về dữ liệu đầy đủ
    if (hoaDon.hopDong) {
      const hopDongPop = await HopDongGS.findById(hoaDon.hopDong);
      hoaDon.hopDong = hopDongPop ? { _id: hopDongPop._id, maHopDong: hopDongPop.maHopDong || hopDongPop.soHopDong } : null;
    }
    if (hoaDon.phong) {
      const phongPop = await PhongGS.findById(hoaDon.phong);
      hoaDon.phong = phongPop ? { _id: phongPop._id, maPhong: phongPop.maPhong } : null;
    }
    if (hoaDon.khachThue) {
      const khachThuePop = await KhachThueGS.findById(hoaDon.khachThue);
      hoaDon.khachThue = khachThuePop ? {
        _id: khachThuePop._id,
        hoTen: khachThuePop.ten || khachThuePop.hoTen,
        soDienThoai: khachThuePop.soDienThoai
      } : null;
    }

    return NextResponse.json({
      success: true,
      data: hoaDon,
      message: 'Tạo hóa đơn thành công'
    });
  } catch (error) {
    console.error('Error creating hoa don:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật hóa đơn
export async function PUT(request: NextRequest) {
  try {
    console.log('PUT request received for hoa-don');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('Unauthorized request');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json(
        { message: 'Thiếu ID hóa đơn' },
        { status: 400 }
      );
    }

    // Kiểm tra hóa đơn tồn tại
    const existingHoaDon = await HoaDonGS.findById(id);
    if (!existingHoaDon) {
      return NextResponse.json(
        { message: 'Hóa đơn không tồn tại' },
        { status: 404 }
      );
    }

    // Kiểm tra hợp đồng tồn tại
    const hopDongData = await HopDongGS.findById(hopDong);
    if (!hopDongData) {
      return NextResponse.json(
        { message: 'Hợp đồng không tồn tại' },
        { status: 404 }
      );
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
    const updatedHoaDon = await HoaDonGS.findByIdAndUpdate(id, {
      maHoaDon,
      soHoaDon: maHoaDon,
      hopDong,
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
    });

    // Populate relationships
    if (updatedHoaDon && updatedHoaDon.hopDong) {
      const hopDongPop = await HopDongGS.findById(updatedHoaDon.hopDong);
      updatedHoaDon.hopDong = hopDongPop ? { _id: hopDongPop._id, maHopDong: hopDongPop.maHopDong || hopDongPop.soHopDong } : null;
    }
    if (updatedHoaDon && updatedHoaDon.phong) {
      const phongPop = await PhongGS.findById(updatedHoaDon.phong);
      updatedHoaDon.phong = phongPop ? { _id: phongPop._id, maPhong: phongPop.maPhong } : null;
    }
    if (updatedHoaDon && updatedHoaDon.khachThue) {
      const khachThuePop = await KhachThueGS.findById(updatedHoaDon.khachThue);
      updatedHoaDon.khachThue = khachThuePop ? {
        _id: khachThuePop._id,
        hoTen: khachThuePop.ten || khachThuePop.hoTen,
        soDienThoai: khachThuePop.soDienThoai
      } : null;
    }

    return NextResponse.json({
      success: true,
      data: updatedHoaDon,
      message: 'Cập nhật hóa đơn thành công'
    });
  } catch (error) {
    console.error('Error updating hoa don:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa hóa đơn
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'Thiếu ID hóa đơn' },
        { status: 400 }
      );
    }

    const deletedHoaDon = await HoaDonGS.findByIdAndDelete(id);
    if (!deletedHoaDon) {
      return NextResponse.json(
        { message: 'Hóa đơn không tồn tại' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Xóa hóa đơn thành công'
    });
  } catch (error) {
    console.error('Error deleting hoa don:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { 
        success: false,
        message: errorMessage || 'Có lỗi xảy ra khi xóa hóa đơn' 
      },
      { status: 500 }
    );
  }
}