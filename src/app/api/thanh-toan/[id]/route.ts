import { NextRequest, NextResponse } from 'next/server';
import { ThanhToanGS, HoaDonGS, NguoiDungGS } from '@/lib/googlesheets-models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PUT - Cập nhật thanh toán
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json(
        { message: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Tìm thanh toán hiện tại
    const thanhToanHienTai = await ThanhToanGS.findById(id);
    if (!thanhToanHienTai) {
      return NextResponse.json(
        { message: 'Thanh toán không tồn tại' },
        { status: 404 }
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

    // Tính toán lại số tiền còn lại của hóa đơn
    // Trước tiên, hoàn lại số tiền cũ
    const hoaDonCu = await HoaDonGS.findById(thanhToanHienTai.hoaDon);
    if (hoaDonCu) {
      const daThanhToanCu = (hoaDonCu.daThanhToan || 0) - (thanhToanHienTai.soTien || 0);
      const conLaiCu = (hoaDonCu.tongTien || 0) - daThanhToanCu;
      
      let trangThaiCu = 'chuaThanhToan';
      if (conLaiCu <= 0) {
        trangThaiCu = 'daThanhToan';
      } else if (daThanhToanCu > 0) {
        trangThaiCu = 'daThanhToanMotPhan';
      }
      
      await HoaDonGS.findByIdAndUpdate(hoaDonCu._id, {
        daThanhToan: daThanhToanCu,
        conLai: conLaiCu,
        trangThai: trangThaiCu,
        updatedAt: new Date().toISOString(),
      });
    }

    // Kiểm tra số tiền thanh toán mới không vượt quá số tiền còn lại
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

    // Cập nhật thanh toán
    const updatedThanhToan = await ThanhToanGS.findByIdAndUpdate(id, {
      hoaDon: hoaDonId,
      soTien,
      phuongThuc,
      thongTinChuyenKhoan: phuongThuc === 'chuyenKhoan' ? thongTinChuyenKhoan : undefined,
      ngayThanhToan: ngayThanhToan || new Date().toISOString(),
      ghiChu: ghiChu || '',
      anhBienLai: anhBienLai || '',
      updatedAt: new Date().toISOString(),
    });

    // Cập nhật hóa đơn mới
    const daThanhToanMoi = (hoaDon.daThanhToan || 0) + soTien;
    const conLaiMoi = (hoaDon.tongTien || 0) - daThanhToanMoi;
    
    let trangThaiMoi = 'chuaThanhToan';
    if (conLaiMoi <= 0) {
      trangThaiMoi = 'daThanhToan';
    } else if (daThanhToanMoi > 0) {
      trangThaiMoi = 'daThanhToanMotPhan';
    }

    await HoaDonGS.findByIdAndUpdate(hoaDonId, {
      daThanhToan: daThanhToanMoi,
      conLai: conLaiMoi,
      trangThai: trangThaiMoi,
      updatedAt: new Date().toISOString(),
    });

    // Populate để trả về dữ liệu đầy đủ
    if (updatedThanhToan && updatedThanhToan.hoaDon) {
      const hoaDonPop = await HoaDonGS.findById(updatedThanhToan.hoaDon);
      updatedThanhToan.hoaDon = hoaDonPop ? {
        _id: hoaDonPop._id,
        maHoaDon: hoaDonPop.maHoaDon || hoaDonPop.soHoaDon,
        thang: hoaDonPop.thang,
        nam: hoaDonPop.nam,
        tongTien: hoaDonPop.tongTien
      } : null;
    }
    if (updatedThanhToan && updatedThanhToan.nguoiNhan) {
      const nguoiNhan = await NguoiDungGS.findById(updatedThanhToan.nguoiNhan);
      updatedThanhToan.nguoiNhan = nguoiNhan ? {
        _id: nguoiNhan._id,
        hoTen: nguoiNhan.ten,
        email: nguoiNhan.email
      } : null;
    }

    return NextResponse.json({
      success: true,
      data: updatedThanhToan,
      message: 'Cập nhật thanh toán thành công'
    });
  } catch (error) {
    console.error('Error updating thanh toan:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
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
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Tìm thanh toán
    const thanhToan = await ThanhToanGS.findById(id);
    if (!thanhToan) {
      return NextResponse.json(
        { message: 'Thanh toán không tồn tại' },
        { status: 404 }
      );
    }

    // Cập nhật lại hóa đơn (hoàn lại số tiền)
    const hoaDon = await HoaDonGS.findById(thanhToan.hoaDon);
    if (hoaDon) {
      const daThanhToanMoi = (hoaDon.daThanhToan || 0) - (thanhToan.soTien || 0);
      const conLaiMoi = (hoaDon.tongTien || 0) - daThanhToanMoi;
      
      let trangThaiMoi = 'chuaThanhToan';
      if (conLaiMoi <= 0) {
        trangThaiMoi = 'daThanhToan';
      } else if (daThanhToanMoi > 0) {
        trangThaiMoi = 'daThanhToanMotPhan';
      }
      
      await HoaDonGS.findByIdAndUpdate(hoaDon._id, {
        daThanhToan: daThanhToanMoi,
        conLai: conLaiMoi,
        trangThai: trangThaiMoi,
        updatedAt: new Date().toISOString(),
      });
    }

    // Xóa thanh toán
    await ThanhToanGS.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Xóa thanh toán thành công'
    });
  } catch (error) {
    console.error('Error deleting thanh toan:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
