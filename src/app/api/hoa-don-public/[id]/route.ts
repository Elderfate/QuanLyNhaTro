import { NextRequest, NextResponse } from 'next/server';
import { HoaDonGS, ThanhToanGS, HopDongGS, PhongGS, KhachThueGS } from '@/lib/googlesheets-models';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hoaDonId = params.id;
    
    if (!hoaDonId) {
      return NextResponse.json(
        { success: false, message: 'ID hóa đơn không hợp lệ' },
        { status: 400 }
      );
    }

    // Lấy thông tin hóa đơn
    const hoaDon = await HoaDonGS.findById(hoaDonId);

    if (!hoaDon) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy hóa đơn' },
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

    // Lấy lịch sử thanh toán của hóa đơn này
    const allThanhToan = await ThanhToanGS.find();
    const thanhToanList = allThanhToan
      .filter((tt: any) => tt.hoaDon === hoaDonId)
      .sort((a: any, b: any) => {
        const dateA = a.ngayThanhToan ? new Date(a.ngayThanhToan).getTime() : 0;
        const dateB = b.ngayThanhToan ? new Date(b.ngayThanhToan).getTime() : 0;
        return dateB - dateA;
      });

    return NextResponse.json({
      success: true,
      data: {
        hoaDon,
        thanhToanList
      }
    });

  } catch (error) {
    console.error('Error fetching public invoice:', error);
    return NextResponse.json(
      { success: false, message: 'Có lỗi xảy ra khi tải thông tin hóa đơn' },
      { status: 500 }
    );
  }
}
