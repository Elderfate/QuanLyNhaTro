import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ThongBaoGS, HoaDonGS, SuCoGS, HopDongGS, KhachThueGS, PhongGS } from '@/lib/googlesheets-models';

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
    const type = searchParams.get('type') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let notifications = [];

    switch (type) {
      case 'overdue_invoices':
        notifications = await getOverdueInvoices();
        break;
      case 'expiring_contracts':
        notifications = await getExpiringContracts();
        break;
      case 'pending_issues':
        notifications = await getPendingIssues();
        break;
      case 'system':
        notifications = await getSystemNotifications();
        break;
      default:
        notifications = await getAllNotifications();
    }

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNotifications = notifications.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedNotifications,
      pagination: {
        page,
        limit,
        total: notifications.length,
        totalPages: Math.ceil(notifications.length / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { message: 'Lỗi khi lấy thông báo' },
      { status: 500 }
    );
  }
}

async function getOverdueInvoices() {
  const now = new Date();
  const allHoaDon = await HoaDonGS.find();
  const overdueInvoices = allHoaDon
    .filter((hd: any) => {
      const hanThanhToan = hd.hanThanhToan ? new Date(hd.hanThanhToan) : null;
      return hanThanhToan && hanThanhToan < now &&
             ['chuaThanhToan', 'daThanhToanMotPhan'].includes(hd.trangThai);
    })
    .sort((a: any, b: any) => {
      const dateA = a.hanThanhToan ? new Date(a.hanThanhToan).getTime() : 0;
      const dateB = b.hanThanhToan ? new Date(b.hanThanhToan).getTime() : 0;
      return dateA - dateB;
    });

  const result = await Promise.all(overdueInvoices.map(async (invoice: any) => {
    const phong = invoice.phong ? await PhongGS.findById(invoice.phong) : null;
    const khachThue = invoice.khachThue ? await KhachThueGS.findById(invoice.khachThue) : null;
    
    return {
      id: `overdue_invoice_${invoice._id}`,
      type: 'overdue_invoice',
      title: 'Hóa đơn quá hạn thanh toán',
      message: `Hóa đơn ${invoice.maHoaDon || invoice.soHoaDon} của phòng ${phong?.maPhong || 'N/A'} đã quá hạn thanh toán`,
      data: {
        invoiceId: invoice._id,
        maHoaDon: invoice.maHoaDon || invoice.soHoaDon,
        phong: phong?.maPhong || 'N/A',
        khachThue: khachThue?.ten || khachThue?.hoTen || 'N/A',
        hanThanhToan: invoice.hanThanhToan,
        conLai: invoice.conLai || 0,
      },
      priority: 'high',
      createdAt: invoice.hanThanhToan,
    };
  }));

  return result;
}

async function getExpiringContracts() {
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  const now = new Date();

  const allHopDong = await HopDongGS.find();
  const expiringContracts = allHopDong
    .filter((hd: any) => {
      const ngayKetThuc = hd.ngayKetThuc ? new Date(hd.ngayKetThuc) : null;
      return hd.trangThai === 'hoatDong' && ngayKetThuc && ngayKetThuc <= nextMonth;
    })
    .sort((a: any, b: any) => {
      const dateA = a.ngayKetThuc ? new Date(a.ngayKetThuc).getTime() : 0;
      const dateB = b.ngayKetThuc ? new Date(b.ngayKetThuc).getTime() : 0;
      return dateA - dateB;
    });

  const result = await Promise.all(expiringContracts.map(async (contract: any) => {
    const phong = contract.phong ? await PhongGS.findById(contract.phong) : null;
    const nguoiDaiDien = contract.nguoiDaiDien ? await KhachThueGS.findById(contract.nguoiDaiDien) : null;
    const ngayKetThuc = contract.ngayKetThuc ? new Date(contract.ngayKetThuc) : null;
    const daysLeft = ngayKetThuc ? Math.ceil((ngayKetThuc.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    return {
      id: `expiring_contract_${contract._id}`,
      type: 'expiring_contract',
      title: 'Hợp đồng sắp hết hạn',
      message: `Hợp đồng ${contract.maHopDong || contract.soHopDong} của phòng ${phong?.maPhong || 'N/A'} sẽ hết hạn trong ${daysLeft} ngày`,
      data: {
        contractId: contract._id,
        maHopDong: contract.maHopDong || contract.soHopDong,
        phong: phong?.maPhong || 'N/A',
        khachThue: nguoiDaiDien?.ten || nguoiDaiDien?.hoTen || 'N/A',
        ngayKetThuc: contract.ngayKetThuc,
        daysLeft,
      },
      priority: daysLeft <= 7 ? 'high' : daysLeft <= 15 ? 'medium' : 'low',
      createdAt: contract.ngayKetThuc,
    };
  }));

  return result;
}

async function getPendingIssues() {
  const allSuCo = await SuCoGS.find();
  const pendingIssues = allSuCo
    .filter((sc: any) => ['moi', 'dangXuLy'].includes(sc.trangThai))
    .sort((a: any, b: any) => {
      const priorityOrder = { 'khancap': 4, 'cao': 3, 'trungBinh': 2, 'thap': 1 };
      const priorityA = priorityOrder[a.mucDoUuTien as keyof typeof priorityOrder] || 2;
      const priorityB = priorityOrder[b.mucDoUuTien as keyof typeof priorityOrder] || 2;
      if (priorityB !== priorityA) return priorityB - priorityA;
      
      const dateA = a.ngayBaoCao || a.ngayBao ? new Date(a.ngayBaoCao || a.ngayBao).getTime() : 0;
      const dateB = b.ngayBaoCao || b.ngayBao ? new Date(b.ngayBaoCao || b.ngayBao).getTime() : 0;
      return dateB - dateA;
    });

  const result = await Promise.all(pendingIssues.map(async (issue: any) => {
    const phong = issue.phong ? await PhongGS.findById(issue.phong) : null;
    const khachThue = issue.khachThue ? await KhachThueGS.findById(issue.khachThue) : null;
    
    const priorityMap: Record<string, string> = {
      'khancap': 'critical',
      'cao': 'high',
      'trungBinh': 'medium',
      'thap': 'low',
    };

    const statusMap: Record<string, string> = {
      'moi': 'Mới',
      'dangXuLy': 'Đang xử lý',
    };

    return {
      id: `pending_issue_${issue._id}`,
      type: 'pending_issue',
      title: 'Sự cố cần xử lý',
      message: `Sự cố "${issue.tieuDe || 'N/A'}" tại phòng ${phong?.maPhong || 'N/A'} - ${statusMap[issue.trangThai] || issue.trangThai}`,
      data: {
        issueId: issue._id,
        tieuDe: issue.tieuDe,
        phong: phong?.maPhong || 'N/A',
        khachThue: khachThue?.ten || khachThue?.hoTen || 'N/A',
        loaiSuCo: issue.loaiSuCo,
        mucDoUuTien: issue.mucDoUuTien,
        trangThai: issue.trangThai,
        ngayBaoCao: issue.ngayBaoCao || issue.ngayBao,
      },
      priority: priorityMap[issue.mucDoUuTien] || 'medium',
      createdAt: issue.ngayBaoCao || issue.ngayBao,
    };
  }));

  return result;
}

async function getSystemNotifications() {
  // Get system-wide notifications (like maintenance, updates, etc.)
  const allThongBao = await ThongBaoGS.find();
  const systemNotifications = allThongBao
    .filter((tb: any) => tb.loai === 'chung')
    .sort((a: any, b: any) => {
      const dateA = a.ngayGui ? new Date(a.ngayGui).getTime() : 0;
      const dateB = b.ngayGui ? new Date(b.ngayGui).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 10);

  const result = await Promise.all(systemNotifications.map(async (notification: any) => {
    const nguoiGui = notification.nguoiGui ? await (await import('@/lib/googlesheets-models')).NguoiDungGS.findById(notification.nguoiGui) : null;
    
    return {
      id: `system_${notification._id}`,
      type: 'system',
      title: notification.tieuDe || 'Thông báo',
      message: notification.noiDung || '',
      data: {
        notificationId: notification._id,
        nguoiGui: nguoiGui?.ten || 'Hệ thống',
      },
      priority: 'medium',
      createdAt: notification.ngayGui,
    };
  }));

  return result;
}

async function getAllNotifications() {
  const [overdueInvoices, expiringContracts, pendingIssues, systemNotifications] = await Promise.all([
    getOverdueInvoices(),
    getExpiringContracts(),
    getPendingIssues(),
    getSystemNotifications(),
  ]);

  // Combine and sort by priority and date
  const allNotifications = [
    ...overdueInvoices,
    ...expiringContracts,
    ...pendingIssues,
    ...systemNotifications,
  ];

  // Sort by priority (critical > high > medium > low) and then by date
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  
  return allNotifications.sort((a, b) => {
    const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// POST endpoint to mark notifications as read
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
    const { notificationId, type } = body;

    // For system notifications, mark as read
    if (type === 'system' && notificationId) {
      const thongBao = await ThongBaoGS.findById(notificationId);
      if (thongBao) {
        const daDoc = Array.isArray(thongBao.daDoc) ? thongBao.daDoc : [];
        if (!daDoc.includes(session.user.id)) {
          daDoc.push(session.user.id);
        }
        await ThongBaoGS.findByIdAndUpdate(notificationId, {
          daDoc,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Đã đánh dấu thông báo là đã đọc',
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { message: 'Lỗi khi đánh dấu thông báo' },
      { status: 500 }
    );
  }
}
