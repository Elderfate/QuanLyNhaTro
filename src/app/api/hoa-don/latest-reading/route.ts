import { NextRequest, NextResponse } from 'next/server';
import { HoaDonGS, HopDongGS } from '@/lib/googlesheets-models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Lấy chỉ số điện nước mới nhất cho hợp đồng
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hopDongId = searchParams.get('hopDong');
    const thang = parseInt(searchParams.get('thang') || '1');
    const nam = parseInt(searchParams.get('nam') || new Date().getFullYear());

    if (!hopDongId) {
      return NextResponse.json(
        { message: 'Thiếu ID hợp đồng' },
        { status: 400 }
      );
    }

    // Kiểm tra hợp đồng tồn tại
    const hopDongData = await HopDongGS.findById(hopDongId);
    if (!hopDongData) {
      return NextResponse.json(
        { message: 'Hợp đồng không tồn tại' },
        { status: 404 }
      );
    }

    // Tìm hóa đơn gần nhất để lấy chỉ số cuối kỳ
    const allHoaDon = await HoaDonGS.find();
    const hoaDonCuaHopDong = allHoaDon
      .filter((hd: any) => hd.hopDong === hopDongId)
      .filter((hd: any) => hd.nam < nam || (hd.nam === nam && hd.thang < thang))
      .sort((a: any, b: any) => {
        if (b.nam !== a.nam) return b.nam - a.nam;
        return b.thang - a.thang;
      });
    const lastHoaDon = hoaDonCuaHopDong[0] || null;

    let chiSoDienBanDau = 0;
    let chiSoNuocBanDau = 0;

    if (lastHoaDon) {
      // Hóa đơn tiếp theo: lấy chỉ số cuối kỳ từ hóa đơn trước
      chiSoDienBanDau = lastHoaDon.chiSoDienCuoiKy || lastHoaDon.chiSoDienMoi || 0;
      chiSoNuocBanDau = lastHoaDon.chiSoNuocCuoiKy || lastHoaDon.chiSoNuocMoi || 0;
    } else {
      // Hóa đơn đầu tiên: lấy chỉ số ban đầu từ hợp đồng
      chiSoDienBanDau = hopDongData.chiSoDienBanDau || 0;
      chiSoNuocBanDau = hopDongData.chiSoNuocBanDau || 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        chiSoDienBanDau,
        chiSoNuocBanDau,
        isFirstInvoice: !lastHoaDon,
        lastInvoiceMonth: lastHoaDon ? `${lastHoaDon.thang}/${lastHoaDon.nam}` : null
      },
      message: lastHoaDon 
        ? `Lấy chỉ số từ hóa đơn ${lastHoaDon.thang}/${lastHoaDon.nam}` 
        : 'Lấy chỉ số ban đầu từ hợp đồng'
    });
  } catch (error) {
    console.error('Error fetching latest electricity reading:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
