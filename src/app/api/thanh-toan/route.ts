import { NextRequest, NextResponse } from 'next/server';
import { ThanhToanGS, HoaDonGS, PhongGS, KhachThueGS, NguoiDungGS, HopDongGS } from '@/lib/googlesheets-models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST - Tạo thanh toán mới
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json(
        { message: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Kiểm tra hóa đơn tồn tại
    const hoaDon = await HoaDonGS.findById(hoaDonId);
    if (!hoaDon) {
      return NextResponse.json(
        { message: 'Hóa đơn không tồn tại' },
        { status: 404 }
      );
    }

    // Kiểm tra số tiền thanh toán không vượt quá số tiền còn lại
    if (soTien > (hoaDon.conLai || 0)) {
      return NextResponse.json(
        { message: 'Số tiền thanh toán không được vượt quá số tiền còn lại' },
        { status: 400 }
      );
    }

    // Validate thông tin chuyển khoản nếu phương thức là chuyển khoản
    if (phuongThuc === 'chuyenKhoan' && !thongTinChuyenKhoan) {
      return NextResponse.json(
        { message: 'Thông tin chuyển khoản là bắt buộc' },
        { status: 400 }
      );
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

    const newThanhToan = await ThanhToanGS.create(thanhToanData);

    // Cập nhật hóa đơn
    const daThanhToanMoi = (hoaDon.daThanhToan || 0) + soTien;
    const conLaiMoi = (hoaDon.tongTien || 0) - daThanhToanMoi;
    
    let trangThaiMoi = 'chuaThanhToan';
    if (conLaiMoi <= 0) {
      trangThaiMoi = 'daThanhToan';
    } else if (daThanhToanMoi > 0) {
      trangThaiMoi = 'daThanhToanMotPhan';
    }

    const updatedHoaDon = await HoaDonGS.findByIdAndUpdate(hoaDonId, {
      daThanhToan: daThanhToanMoi,
      conLai: conLaiMoi,
      trangThai: trangThaiMoi,
      updatedAt: new Date().toISOString(),
    });

    // Lấy thông tin đầy đủ để trả về
    const [allPhongs, allKhachThues, allHopDongs, allNguoiDungs] = await Promise.all([
      PhongGS.find(),
      KhachThueGS.find(),
      HopDongGS.find(),
      NguoiDungGS.find()
    ]);

    const phong = updatedHoaDon?.phong ? allPhongs.find((p: any) => p._id === updatedHoaDon.phong) : null;
    const khachThue = updatedHoaDon?.khachThue ? allKhachThues.find((kt: any) => kt._id === updatedHoaDon.khachThue) : null;
    const hopDong = updatedHoaDon?.hopDong ? allHopDongs.find((hd: any) => hd._id === updatedHoaDon.hopDong) : null;
    const nguoiNhan = allNguoiDungs.find((nd: any) => nd._id === newThanhToan.nguoiNhan);

    const populatedThanhToan = {
      ...newThanhToan,
      hoaDon: updatedHoaDon ? {
        _id: updatedHoaDon._id,
        maHoaDon: updatedHoaDon.maHoaDon || updatedHoaDon.soHoaDon,
        thang: updatedHoaDon.thang,
        nam: updatedHoaDon.nam,
        tongTien: updatedHoaDon.tongTien
      } : null,
      nguoiNhan: nguoiNhan ? {
        _id: nguoiNhan._id,
        hoTen: nguoiNhan.ten || nguoiNhan.name,
        email: nguoiNhan.email
      } : null
    };

    const populatedHoaDon = updatedHoaDon ? {
      ...updatedHoaDon,
      phong: phong ? { _id: phong._id, maPhong: phong.maPhong } : null,
      khachThue: khachThue ? { _id: khachThue._id, hoTen: khachThue.ten || khachThue.hoTen } : null,
      hopDong: hopDong ? { _id: hopDong._id, maHopDong: hopDong.maHopDong || hopDong.soHopDong } : null
    } : null;

    return NextResponse.json({
      success: true,
      data: {
        thanhToan: populatedThanhToan,
        hoaDon: populatedHoaDon
      },
      message: 'Tạo thanh toán thành công'
    });
  } catch (error) {
    console.error('Error creating thanh toan:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
