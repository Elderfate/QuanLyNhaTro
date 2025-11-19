import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { HoaDonGS, ThanhToanGS, PhongGS, HopDongGS } from '@/lib/googlesheets-models';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'revenue';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format') || 'json';

    let start, end;
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default to current month
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    switch (type) {
      case 'revenue':
        return await getRevenueReport(start, end, format);
      case 'rooms':
        return await getRoomReport(format);
      case 'contracts':
        return await getContractReport(start, end, format);
      case 'payments':
        return await getPaymentReport(start, end, format);
      default:
        return NextResponse.json(
          { message: 'Loại báo cáo không hợp lệ' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { message: 'Lỗi khi tạo báo cáo' },
      { status: 500 }
    );
  }
}

async function getRevenueReport(start: Date, end: Date, format: string) {
  // Get all payments and filter by date
  const allThanhToan = await ThanhToanGS.find();
  const filteredPayments = allThanhToan.filter((tt: any) => {
    const ngayThanhToan = tt.ngayThanhToan ? new Date(tt.ngayThanhToan) : null;
    return ngayThanhToan && ngayThanhToan >= start && ngayThanhToan <= end;
  });

  // Group by month
  const revenueByMonthMap = new Map<string, { total: number; count: number }>();
  filteredPayments.forEach((tt: any) => {
    const date = new Date(tt.ngayThanhToan);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const existing = revenueByMonthMap.get(key) || { total: 0, count: 0 };
    revenueByMonthMap.set(key, {
      total: existing.total + (tt.soTien || 0),
      count: existing.count + 1,
    });
  });

  const revenueByMonth = Array.from(revenueByMonthMap.entries()).map(([key, value]) => {
    const [year, month] = key.split('-').map(Number);
    return {
      _id: { year, month },
      total: value.total,
      count: value.count,
    };
  }).sort((a, b) => {
    if (a._id.year !== b._id.year) return a._id.year - b._id.year;
    return a._id.month - b._id.month;
  });

  // Group by payment method
  const revenueByMethodMap = new Map<string, { total: number; count: number }>();
  filteredPayments.forEach((tt: any) => {
    const method = tt.phuongThuc || 'unknown';
    const existing = revenueByMethodMap.get(method) || { total: 0, count: 0 };
    revenueByMethodMap.set(method, {
      total: existing.total + (tt.soTien || 0),
      count: existing.count + 1,
    });
  });

  const revenueByMethod = Array.from(revenueByMethodMap.entries()).map(([method, value]) => ({
    _id: method,
    total: value.total,
    count: value.count,
  }));

  // Calculate total revenue
  const totalRevenue = filteredPayments.reduce((sum, tt: any) => sum + (tt.soTien || 0), 0);
  const totalPayments = filteredPayments.length;

  const data = {
    period: {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    },
    totalRevenue,
    totalPayments,
    revenueByMonth,
    revenueByMethod,
  };

  if (format === 'csv') {
    const csv = generateRevenueCSV(data);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="revenue-report.csv"',
      },
    });
  }

  return NextResponse.json({
    success: true,
    data,
  });
}

async function getRoomReport(format: string) {
  const allPhong = await PhongGS.find();
  const totalRooms = allPhong.length;
  const occupiedRooms = allPhong.filter((p: any) => p.trangThai === 'dangThue').length;
  const emptyRooms = allPhong.filter((p: any) => p.trangThai === 'trong').length;
  const maintenanceRooms = allPhong.filter((p: any) => p.trangThai === 'baoTri').length;

  // Group by status
  const roomStatsMap = new Map<string, number>();
  allPhong.forEach((p: any) => {
    const status = p.trangThai || 'unknown';
    roomStatsMap.set(status, (roomStatsMap.get(status) || 0) + 1);
  });

  const roomStats = Array.from(roomStatsMap.entries()).map(([status, count]) => ({
    _id: status,
    count,
  }));

  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

  const data = {
    totalRooms,
    occupiedRooms,
    emptyRooms,
    maintenanceRooms,
    occupancyRate: Math.round(occupancyRate * 100) / 100,
    roomStats,
  };

  if (format === 'csv') {
    const csv = generateRoomCSV(data);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="room-report.csv"',
      },
    });
  }

  return NextResponse.json({
    success: true,
    data,
  });
}

async function getContractReport(start: Date, end: Date, format: string) {
  const allHopDong = await HopDongGS.find();
  const filteredContracts = allHopDong.filter((hd: any) => {
    const ngayTao = hd.ngayTao || hd.createdAt || hd.ngayBatDau;
    if (!ngayTao) return false;
    const date = new Date(ngayTao);
    return date >= start && date <= end;
  });

  // Populate relationships
  const contracts = await Promise.all(filteredContracts.map(async (hd: any) => {
    const phong = hd.phong ? await PhongGS.findById(hd.phong) : null;
    const nguoiDaiDien = hd.nguoiDaiDien ? await (await import('@/lib/googlesheets-models')).KhachThueGS.findById(hd.nguoiDaiDien) : null;
    return {
      ...hd,
      phong: phong ? { maPhong: phong.maPhong, toaNha: phong.toaNha } : null,
      nguoiDaiDien: nguoiDaiDien ? { hoTen: nguoiDaiDien.ten || nguoiDaiDien.hoTen, soDienThoai: nguoiDaiDien.soDienThoai } : null,
    };
  }));

  contracts.sort((a: any, b: any) => {
    const dateA = a.ngayTao || a.createdAt || a.ngayBatDau ? new Date(a.ngayTao || a.createdAt || a.ngayBatDau).getTime() : 0;
    const dateB = b.ngayTao || b.createdAt || b.ngayBatDau ? new Date(b.ngayTao || b.createdAt || b.ngayBatDau).getTime() : 0;
    return dateB - dateA;
  });

  // Group by status
  const contractStatsMap = new Map<string, { count: number; totalValue: number }>();
  filteredContracts.forEach((hd: any) => {
    const status = hd.trangThai || 'unknown';
    const existing = contractStatsMap.get(status) || { count: 0, totalValue: 0 };
    contractStatsMap.set(status, {
      count: existing.count + 1,
      totalValue: existing.totalValue + (hd.giaThue || 0),
    });
  });

  const contractStats = Array.from(contractStatsMap.entries()).map(([status, value]) => ({
    _id: status,
    count: value.count,
    totalValue: value.totalValue,
  }));

  const data = {
    period: {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    },
    totalContracts: contracts.length,
    contracts,
    contractStats,
  };

  if (format === 'csv') {
    const csv = generateContractCSV(data);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="contract-report.csv"',
      },
    });
  }

  return NextResponse.json({
    success: true,
    data,
  });
}

async function getPaymentReport(start: Date, end: Date, format: string) {
  const allThanhToan = await ThanhToanGS.find();
  const filteredPayments = allThanhToan.filter((tt: any) => {
    const ngayThanhToan = tt.ngayThanhToan ? new Date(tt.ngayThanhToan) : null;
    return ngayThanhToan && ngayThanhToan >= start && ngayThanhToan <= end;
  });

  // Populate relationships
  const payments = await Promise.all(filteredPayments.map(async (tt: any) => {
    const hoaDon = tt.hoaDon ? await HoaDonGS.findById(tt.hoaDon) : null;
    const nguoiNhan = tt.nguoiNhan ? await (await import('@/lib/googlesheets-models')).NguoiDungGS.findById(tt.nguoiNhan) : null;
    return {
      ...tt,
      hoaDon: hoaDon ? { maHoaDon: hoaDon.maHoaDon || hoaDon.soHoaDon, tongTien: hoaDon.tongTien } : null,
      nguoiNhan: nguoiNhan ? { ten: nguoiNhan.ten, email: nguoiNhan.email } : null,
    };
  }));

  payments.sort((a: any, b: any) => {
    const dateA = a.ngayThanhToan ? new Date(a.ngayThanhToan).getTime() : 0;
    const dateB = b.ngayThanhToan ? new Date(b.ngayThanhToan).getTime() : 0;
    return dateB - dateA;
  });

  // Group by payment method
  const paymentStatsMap = new Map<string, { total: number; count: number }>();
  filteredPayments.forEach((tt: any) => {
    const method = tt.phuongThuc || 'unknown';
    const existing = paymentStatsMap.get(method) || { total: 0, count: 0 };
    paymentStatsMap.set(method, {
      total: existing.total + (tt.soTien || 0),
      count: existing.count + 1,
    });
  });

  const paymentStats = Array.from(paymentStatsMap.entries()).map(([method, value]) => ({
    _id: method,
    total: value.total,
    count: value.count,
  }));

  const data = {
    period: {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    },
    totalPayments: payments.length,
    totalAmount: payments.reduce((sum: number, p: any) => sum + (p.soTien || 0), 0),
    payments,
    paymentStats,
  };

  if (format === 'csv') {
    const csv = generatePaymentCSV(data);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="payment-report.csv"',
      },
    });
  }

  return NextResponse.json({
    success: true,
    data,
  });
}

function generateRevenueCSV(data: any): string {
  let csv = 'Báo cáo doanh thu\n';
  csv += `Từ ngày: ${data.period.start}\n`;
  csv += `Đến ngày: ${data.period.end}\n`;
  csv += `Tổng doanh thu: ${data.totalRevenue.toLocaleString('vi-VN')} VNĐ\n`;
  csv += `Tổng số giao dịch: ${data.totalPayments}\n\n`;
  
  csv += 'Doanh thu theo tháng:\n';
  csv += 'Tháng,Năm,Tổng tiền,Số giao dịch\n';
  data.revenueByMonth.forEach((item: any) => {
    csv += `${item._id.month},${item._id.year},${item.total.toLocaleString('vi-VN')},${item.count}\n`;
  });
  
  csv += '\nDoanh thu theo phương thức:\n';
  csv += 'Phương thức,Tổng tiền,Số giao dịch\n';
  data.revenueByMethod.forEach((item: any) => {
    const method = item._id === 'tienMat' ? 'Tiền mặt' : 
                   item._id === 'chuyenKhoan' ? 'Chuyển khoản' : 'Ví điện tử';
    csv += `${method},${item.total.toLocaleString('vi-VN')},${item.count}\n`;
  });
  
  return csv;
}

function generateRoomCSV(data: any): string {
  let csv = 'Báo cáo phòng\n';
  csv += `Tổng số phòng: ${data.totalRooms}\n`;
  csv += `Phòng đang thuê: ${data.occupiedRooms}\n`;
  csv += `Phòng trống: ${data.emptyRooms}\n`;
  csv += `Phòng bảo trì: ${data.maintenanceRooms}\n`;
  csv += `Tỷ lệ lấp đầy: ${data.occupancyRate}%\n\n`;
  
  csv += 'Thống kê theo trạng thái:\n';
  csv += 'Trạng thái,Số lượng\n';
  data.roomStats.forEach((item: any) => {
    const status = item._id === 'trong' ? 'Trống' :
                   item._id === 'dangThue' ? 'Đang thuê' :
                   item._id === 'baoTri' ? 'Bảo trì' : 'Đã đặt';
    csv += `${status},${item.count}\n`;
  });
  
  return csv;
}

function generateContractCSV(data: any): string {
  let csv = 'Báo cáo hợp đồng\n';
  csv += `Từ ngày: ${data.period.start}\n`;
  csv += `Đến ngày: ${data.period.end}\n`;
  csv += `Tổng số hợp đồng: ${data.totalContracts}\n\n`;
  
  csv += 'Chi tiết hợp đồng:\n';
  csv += 'Mã hợp đồng,Phòng,Khách thuê,Ngày bắt đầu,Ngày kết thúc,Giá thuê,Trạng thái\n';
  data.contracts.forEach((contract: any) => {
    const status = contract.trangThai === 'hoatDong' ? 'Hoạt động' :
                   contract.trangThai === 'hetHan' ? 'Hết hạn' : 'Đã hủy';
    const ngayBatDau = contract.ngayBatDau ? new Date(contract.ngayBatDau).toISOString().split('T')[0] : '';
    const ngayKetThuc = contract.ngayKetThuc ? new Date(contract.ngayKetThuc).toISOString().split('T')[0] : '';
    csv += `${contract.maHopDong || contract.soHopDong},${contract.phong?.maPhong || 'N/A'},${contract.nguoiDaiDien?.hoTen || 'N/A'},${ngayBatDau},${ngayKetThuc},${(contract.giaThue || 0).toLocaleString('vi-VN')},${status}\n`;
  });
  
  return csv;
}

function generatePaymentCSV(data: any): string {
  let csv = 'Báo cáo thanh toán\n';
  csv += `Từ ngày: ${data.period.start}\n`;
  csv += `Đến ngày: ${data.period.end}\n`;
  csv += `Tổng số giao dịch: ${data.totalPayments}\n`;
  csv += `Tổng số tiền: ${data.totalAmount.toLocaleString('vi-VN')} VNĐ\n\n`;
  
  csv += 'Chi tiết thanh toán:\n';
  csv += 'Ngày thanh toán,Hóa đơn,Số tiền,Phương thức,Người nhận\n';
  data.payments.forEach((payment: any) => {
    const method = payment.phuongThuc === 'tienMat' ? 'Tiền mặt' :
                   payment.phuongThuc === 'chuyenKhoan' ? 'Chuyển khoản' : 'Ví điện tử';
    const ngayThanhToan = payment.ngayThanhToan ? new Date(payment.ngayThanhToan).toISOString().split('T')[0] : '';
    csv += `${ngayThanhToan},${payment.hoaDon?.maHoaDon || payment.hoaDon?.soHoaDon || 'N/A'},${(payment.soTien || 0).toLocaleString('vi-VN')},${method},${payment.nguoiNhan?.ten || 'N/A'}\n`;
  });
  
  return csv;
}
