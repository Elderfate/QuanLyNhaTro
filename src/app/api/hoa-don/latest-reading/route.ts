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

    // Kiểm tra hợp đồng tồn tại với retry logic
    let hopDongData;
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        hopDongData = await HopDongGS.findById(hopDongId);
        break;
      } catch (error: any) {
        if (error.response?.status === 429 && retries < maxRetries - 1) {
          // Quota exceeded - wait and retry
          const waitTime = (retries + 1) * 2000; // Exponential backoff: 2s, 4s, 6s
          console.log(`API 429 error, retrying in ${waitTime}ms... (attempt ${retries + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retries++;
        } else {
          throw error;
        }
      }
    }
    
    if (!hopDongData) {
      return NextResponse.json(
        { message: 'Hợp đồng không tồn tại' },
        { status: 404 }
      );
    }

    // Tìm hóa đơn gần nhất để lấy chỉ số cuối kỳ với retry logic
    let allHoaDon;
    retries = 0;
    
    while (retries < maxRetries) {
      try {
        allHoaDon = await HoaDonGS.find();
        break;
      } catch (error: any) {
        if (error.response?.status === 429 && retries < maxRetries - 1) {
          const waitTime = (retries + 1) * 2000;
          console.log(`API 429 error fetching invoices, retrying in ${waitTime}ms... (attempt ${retries + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retries++;
        } else {
          // If we can't fetch all invoices, return default values
          console.warn('Could not fetch invoices, using contract default values');
          allHoaDon = [];
          break;
        }
      }
    }
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
  } catch (error: any) {
    console.error('Error fetching latest electricity reading:', error);
    
    // Handle 429 errors specifically
    if (error.response?.status === 429) {
      return NextResponse.json(
        { 
          message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau vài giây.',
          error: 'QUOTA_EXCEEDED'
        },
        { status: 429 }
      );
    }
    
    // Return default values instead of error to prevent UI crash
    return NextResponse.json({
      success: true,
      data: {
        chiSoDienBanDau: 0,
        chiSoNuocBanDau: 0,
        isFirstInvoice: true,
        lastInvoiceMonth: null
      },
      message: 'Không thể lấy chỉ số từ hệ thống, sử dụng giá trị mặc định'
    });
  }
}
