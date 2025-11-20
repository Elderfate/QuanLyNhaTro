import { NextRequest } from 'next/server';
import { HoaDonGS, HopDongGS } from '@/lib/googlesheets-models';
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

// GET - Lấy chỉ số điện nước mới nhất cho hợp đồng
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const hopDongId = searchParams.get('hopDong');
    const thang = parseInt(searchParams.get('thang') || '1', 10);
    const nam = parseInt(searchParams.get('nam') || String(new Date().getFullYear()), 10);

    if (!hopDongId) {
      return badRequestResponse('Thiếu ID hợp đồng');
    }

    // Kiểm tra hợp đồng tồn tại với retry logic
    const normalizedHopDongId = normalizeId(hopDongId);
    if (!normalizedHopDongId) {
      return badRequestResponse('ID hợp đồng không hợp lệ');
    }
    
    let hopDongData: HopDongDocument | null;
    try {
      hopDongData = await withRetry(() => HopDongGS.findById(normalizedHopDongId)) as HopDongDocument | null;
    } catch (error) {
      // Return default values on error
      return successResponse({
        chiSoDienBanDau: 0,
        chiSoNuocBanDau: 0,
        isFirstInvoice: true,
        lastInvoiceMonth: null
      }, 'Không thể lấy chỉ số từ hệ thống, sử dụng giá trị mặc định');
    }
    
    if (!hopDongData) {
      return notFoundResponse('Hợp đồng không tồn tại');
    }

    // Tìm hóa đơn gần nhất để lấy chỉ số cuối kỳ với retry logic
    let allHoaDon: HoaDonDocument[] = [];
    try {
      allHoaDon = await withRetry(() => HoaDonGS.find()) as HoaDonDocument[];
    } catch (error) {
      // If we can't fetch all invoices, use contract default values
      console.warn('Could not fetch invoices, using contract default values');
    }
    
    const hoaDonCuaHopDong = allHoaDon
      .filter((hd) => {
        const hdHopDongId = normalizeId(hd.hopDong);
        return compareIds(hdHopDongId, normalizedHopDongId);
      })
      .filter((hd) => hd.nam < nam || (hd.nam === nam && hd.thang < thang))
      .sort((a, b) => {
        if (b.nam !== a.nam) return b.nam - a.nam;
        return b.thang - a.thang;
      });
    const lastHoaDon = hoaDonCuaHopDong[0];

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

    return successResponse({
      chiSoDienBanDau,
      chiSoNuocBanDau,
      isFirstInvoice: !lastHoaDon,
      lastInvoiceMonth: lastHoaDon ? `${lastHoaDon.thang}/${lastHoaDon.nam}` : null
    }, lastHoaDon 
      ? `Lấy chỉ số từ hóa đơn ${lastHoaDon.thang}/${lastHoaDon.nam}` 
      : 'Lấy chỉ số ban đầu từ hợp đồng');
  } catch (error) {
    console.error('Error fetching latest electricity reading:', error);
    
    // Return default values instead of error to prevent UI crash
    return successResponse({
      chiSoDienBanDau: 0,
      chiSoNuocBanDau: 0,
      isFirstInvoice: true,
      lastInvoiceMonth: null
    }, 'Không thể lấy chỉ số từ hệ thống, sử dụng giá trị mặc định');
  }
}
