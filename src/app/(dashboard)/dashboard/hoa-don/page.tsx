'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ui/image-upload';
import { HoaDonDataTable } from './table';
import { DeleteConfirmPopover } from '@/components/ui/delete-confirm-popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Receipt, 
  AlertCircle,
  Zap,
  Download,
  CreditCard,
  Camera,
  FileText,
  Copy,
  RefreshCw,
  Calendar,
  Users,
  Home,
  Edit,
  Trash2
} from 'lucide-react';
import { HoaDon, HopDong, Phong, KhachThue } from '@/types';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useDeleteHoaDonMutation } from '@/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';
import { useData } from '@/hooks/use-data';

// Helper functions for form and dialogs
const getPhongName = (phongId: string | Phong, phongList: Phong[]) => {
  if (!phongId) return 'N/A';
  if (typeof phongId === 'object' && phongId.maPhong) {
    return phongId.maPhong;
  }
  if (typeof phongId === 'string') {
    const phong = phongList.find(p => p._id === phongId);
    return phong?.maPhong || 'N/A';
  }
  return 'N/A';
};

const getKhachThueName = (khachThueId: string | KhachThue, khachThueList: KhachThue[]) => {
  if (!khachThueId) return 'N/A';
  if (typeof khachThueId === 'object' && khachThueId.hoTen) {
    return khachThueId.hoTen;
  }
  if (typeof khachThueId === 'string') {
    const khachThue = khachThueList.find(k => k._id === khachThueId);
    return khachThue?.hoTen || 'N/A';
  }
  return 'N/A';
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export default function HoaDonPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Use single data load
  const { hoaDon: hoaDonList, hopDong: hopDongList, phong: phongList, khachThue: khachThueList, loading, refetch } = useData();
  
  const deleteHoaDonMutation = useDeleteHoaDonMutation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [isAutoCreating, setIsAutoCreating] = useState(false);
  const [viewingHoaDon, setViewingHoaDon] = useState<HoaDon | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [paymentHoaDon, setPaymentHoaDon] = useState<HoaDon | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  useEffect(() => {
    document.title = 'Quản lý Hóa đơn';
  }, []);

  const handleRefresh = async () => {
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['app-data'] });
    toast.success('Đã tải dữ liệu mới nhất');
  };

  const filteredHoaDon = hoaDonList.filter(hoaDon => {
    const matchesSearch = hoaDon.maHoaDon.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hoaDon.ghiChu?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || hoaDon.trangThai === statusFilter;
    const matchesMonth = monthFilter === 'all' || hoaDon.thang.toString() === monthFilter;
    const matchesYear = yearFilter === 'all' || hoaDon.nam.toString() === yearFilter;
    
    return matchesSearch && matchesStatus && matchesMonth && matchesYear;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'chuaThanhToan':
        return <Badge variant="destructive">Chưa thanh toán</Badge>;
      case 'daThanhToanMotPhan':
        return <Badge variant="secondary">Thanh toán một phần</Badge>;
      case 'daThanhToan':
        return <Badge variant="default">Đã thanh toán</Badge>;
      case 'quaHan':
        return <Badge variant="outline">Quá hạn</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMonthOptions = () => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  };

  const handleEdit = (hoaDon: HoaDon) => {
    console.log('Editing hoa don:', hoaDon);
    router.push(`/dashboard/hoa-don/${hoaDon._id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHoaDonMutation.mutateAsync(id);
      toast.success('Hóa đơn đã được xóa thành công');
    } catch (error) {
      console.error('Error deleting hoa don:', error);
      toast.error('Có lỗi xảy ra khi xóa hóa đơn');
    }
  };

  const handleDeleteMultiple = async (ids: string[]) => {
    if (ids.length === 0) return;
    
    try {
      // Xóa từng hóa đơn (có thể cải thiện bằng batch delete API)
      const deletePromises = ids.map(id => 
        fetch(`/api/hoa-don?id=${id}`, { method: 'DELETE' })
      );
      
      const results = await Promise.all(deletePromises);
      const failedDeletes = results.filter(result => !result.ok);
      
      if (failedDeletes.length === 0) {
        queryClient.invalidateQueries({ queryKey: ['hoa-don'] });
        toast.success(`Đã xóa thành công ${ids.length} hóa đơn`);
      } else {
        toast.error(`Có ${failedDeletes.length} hóa đơn không thể xóa`);
      }
    } catch (error) {
      console.error('Error deleting multiple hoa don:', error);
      toast.error('Có lỗi xảy ra khi xóa hóa đơn');
    }
  };

  const handleView = (hoaDon: HoaDon) => {
    setViewingHoaDon(hoaDon);
    setIsViewDialogOpen(true);
  };

  const handlePayment = (hoaDon: HoaDon) => {
    setPaymentHoaDon(hoaDon);
    setIsPaymentDialogOpen(true);
  };

  const handleCopyLink = (hoaDon: HoaDon) => {
    const publicUrl = `${window.location.origin}/hoa-don/${hoaDon._id}`;
    
    navigator.clipboard.writeText(publicUrl).then(() => {
      toast.success('Đã sao chép link hóa đơn vào clipboard!');
    }).catch(() => {
      // Fallback: hiển thị modal với link
      const modal = document.createElement('div');
      modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
          <div style="background: white; padding: 20px; border-radius: 8px; max-width: 500px; width: 90%;">
            <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">Link hóa đơn công khai</h3>
            <p style="margin: 0 0 10px 0; color: #666;">Gửi link này cho khách hàng để họ có thể xem hóa đơn:</p>
            <input type="text" value="${publicUrl}" readonly style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px;" />
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
              <button onclick="this.closest('div').remove()" style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">Đóng</button>
              <button onclick="navigator.clipboard.writeText('${publicUrl}').then(() => alert('Đã sao chép!')).catch(() => alert('Không thể sao chép')); this.closest('div').remove();" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Sao chép</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    });
  };

  const handleDownload = (hoaDon: HoaDon) => {
    // Create a simple HTML invoice and download as PDF
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Hóa đơn ${hoaDon.maHoaDon}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-info { margin-bottom: 20px; }
          .items { margin: 20px 0; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { border-top: 2px solid #000; padding-top: 10px; margin-top: 20px; }
          .footer { margin-top: 30px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>HÓA ĐƠN THUÊ PHÒNG</h1>
          <p>Mã hóa đơn: ${hoaDon.maHoaDon}</p>
        </div>
        
        <div class="invoice-info">
          <p><strong>Phòng:</strong> ${getPhongName(hoaDon.phong, phongList)}</p>
          <p><strong>Khách thuê:</strong> ${getKhachThueName(hoaDon.khachThue, khachThueList)}</p>
          <p><strong>Tháng/Năm:</strong> ${hoaDon.thang}/${hoaDon.nam}</p>
          <p><strong>Hạn thanh toán:</strong> ${new Date(hoaDon.hanThanhToan).toLocaleDateString('vi-VN')}</p>
        </div>
        
        <div class="items">
          <h3>Chi tiết hóa đơn:</h3>
          <div class="item">
            <span>Tiền phòng</span>
            <span>${formatCurrency(hoaDon.tienPhong)}</span>
          </div>
          <div class="item">
            <span>Tiền điện (${hoaDon.soDien} kWh)</span>
            <span>${formatCurrency(hoaDon.tienDien)}</span>
          </div>
          <div class="item">
            <span>Tiền nước (${hoaDon.soNuoc} m³)</span>
            <span>${formatCurrency(hoaDon.tienNuoc)}</span>
          </div>
          ${hoaDon.phiDichVu.map(phi => `
            <div class="item">
              <span>${phi.ten}</span>
              <span>${formatCurrency(phi.gia)}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="total">
          <div class="item">
            <span><strong>Tổng tiền:</strong></span>
            <span><strong>${formatCurrency(hoaDon.tongTien)}</strong></span>
          </div>
          <div class="item">
            <span>Đã thanh toán:</span>
            <span>${formatCurrency(hoaDon.daThanhToan)}</span>
          </div>
          <div class="item">
            <span>Còn lại:</span>
            <span>${formatCurrency(hoaDon.conLai)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Trạng thái: ${hoaDon.trangThai === 'daThanhToan' ? 'Đã thanh toán' : 
                         hoaDon.trangThai === 'daThanhToanMotPhan' ? 'Thanh toán một phần' : 
                         hoaDon.trangThai === 'quaHan' ? 'Quá hạn' : 'Chưa thanh toán'}</p>
          ${hoaDon.ghiChu ? `<p>Ghi chú: ${hoaDon.ghiChu}</p>` : ''}
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hoa-don-${hoaDon.maHoaDon}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleScreenshot = async (hoaDon: HoaDon) => {
    try {
      // Tạo element tạm thời để chụp ảnh
      const tempElement = document.createElement('div');
      tempElement.innerHTML = `
        <div style="
          width: 800px; 
          padding: 40px; 
          background: #ffffff; 
          font-family: Arial, sans-serif;
          border: 1px solid #dddddd;
          margin: 20px;
          color: #000000;
        ">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 28px; font-weight: bold; margin: 0; color: #000;">HÓA ĐƠN THUÊ PHÒNG</h1>
            <p style="font-size: 18px; margin: 10px 0 0 0; color: #333;">${hoaDon.maHoaDon}</p>
          </div>
          
          <!-- Main Info Sections -->
          <div style="display: flex; gap: 30px; margin-bottom: 30px;">
            <div style="flex: 1;">
              <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #333;">Thông tin phòng</h3>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Phòng:</strong> ${getPhongName(hoaDon.phong, phongList)}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Khách thuê:</strong> ${getKhachThueName(hoaDon.khachThue, khachThueList)}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Hợp đồng:</strong> N/A</p>
            </div>
            <div style="flex: 1;">
              <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #333;">Thông tin thanh toán</h3>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Tháng/Năm:</strong> ${hoaDon.thang}/${hoaDon.nam}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Hạn thanh toán:</strong> ${new Date(hoaDon.hanThanhToan).toLocaleDateString('vi-VN')}</p>
              <div style="margin: 10px 0;">
                <span style="
                  background: #000000; 
                  color: #ffffff; 
                  padding: 4px 12px; 
                  border-radius: 4px; 
                  font-size: 12px; 
                  font-weight: bold;
                ">
                  ${hoaDon.trangThai === 'daThanhToan' ? 'Đã thanh toán' : 
                    hoaDon.trangThai === 'daThanhToanMotPhan' ? 'Thanh toán một phần' : 
                    hoaDon.trangThai === 'quaHan' ? 'Quá hạn' : 'Chưa thanh toán'}
                </span>
              </div>
            </div>
          </div>

          <!-- Electricity and Water Readings -->
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #333;">Chỉ số điện nước</h3>
            <div style="display: flex; gap: 20px;">
              <div style="flex: 1;">
                <h4 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #555;">Điện</h4>
                <div style="font-size: 13px; line-height: 1.6;">
                  <div style="display: flex; justify-content: space-between;"><span>Chỉ số ban đầu:</span><span>${hoaDon.chiSoDienBanDau || 0} kWh</span></div>
                  <div style="display: flex; justify-content: space-between;"><span>Chỉ số cuối kỳ:</span><span>${hoaDon.chiSoDienCuoiKy || 0} kWh</span></div>
                  <div style="display: flex; justify-content: space-between; font-weight: bold;"><span>Số điện sử dụng:</span><span>${hoaDon.soDien || 0} kWh</span></div>
                </div>
              </div>
              <div style="flex: 1;">
                <h4 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #555;">Nước</h4>
                <div style="font-size: 13px; line-height: 1.6;">
                  <div style="display: flex; justify-content: space-between;"><span>Chỉ số ban đầu:</span><span>${hoaDon.chiSoNuocBanDau || 0} m³</span></div>
                  <div style="display: flex; justify-content: space-between;"><span>Chỉ số cuối kỳ:</span><span>${hoaDon.chiSoNuocCuoiKy || 0} m³</span></div>
                  <div style="display: flex; justify-content: space-between; font-weight: bold;"><span>Số nước sử dụng:</span><span>${hoaDon.soNuoc || 0} m³</span></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Invoice Details -->
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #333;">Chi tiết hóa đơn</h3>
            <div style="font-size: 14px; line-height: 1.8;">
              <div style="display: flex; justify-content: space-between;"><span>Tiền phòng</span><span>${formatCurrency(hoaDon.tienPhong)}</span></div>
              <div style="display: flex; justify-content: space-between;"><span>Tiền điện (${hoaDon.soDien} kWh)</span><span>${formatCurrency(hoaDon.tienDien)}</span></div>
              <div style="display: flex; justify-content: space-between;"><span>Tiền nước (${hoaDon.soNuoc} m³)</span><span>${formatCurrency(hoaDon.tienNuoc)}</span></div>
              ${hoaDon.phiDichVu.map(phi => `
                <div style="display: flex; justify-content: space-between;"><span>${phi.ten}</span><span>${formatCurrency(phi.gia)}</span></div>
              `).join('')}
            </div>
          </div>

          <!-- Summary Section -->
          <div style="border-top: 1px solid #000; padding-top: 20px;">
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-bottom: 10px;">
              <span>Tổng tiền:</span>
              <span>${formatCurrency(hoaDon.tongTien)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px;">
              <span>Đã thanh toán:</span>
              <span style="color: #10b981;">${formatCurrency(hoaDon.daThanhToan)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 14px;">
              <span>Còn lại:</span>
              <span style="color: #10b981; font-weight: bold;">
                ${formatCurrency(hoaDon.conLai)}
              </span>
            </div>
          </div>
        </div>
      `;
      
      tempElement.style.position = 'absolute';
      tempElement.style.left = '-9999px';
      tempElement.style.top = '-9999px';
      document.body.appendChild(tempElement);

      // Chụp ảnh
      const canvas = await html2canvas(tempElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Xóa element tạm thời
      document.body.removeChild(tempElement);

      // Tạo PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Tải xuống PDF
      pdf.save(`hoa-don-${hoaDon.maHoaDon}.pdf`);
      toast.success('Đã xuất hóa đơn thành PDF thành công!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Có lỗi xảy ra khi xuất PDF');
    }
  };

  const handleAutoCreateInvoices = async () => {
    if (!confirm('Bạn có chắc chắn muốn tạo hóa đơn tự động cho tất cả hợp đồng đang hoạt động?')) {
      return;
    }

    setIsAutoCreating(true);
    try {
      const response = await fetch('/api/auto-invoice', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Đã tạo ${result.data.createdInvoices} hóa đơn tự động`);
        if (result.data.errors.length > 0) {
          toast.warning(`Một số lỗi xảy ra: ${result.data.errors.length} lỗi`);
          console.warn('Chi tiết lỗi:', result.data.errors);
        }
        fetchData(); // Refresh data
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Có lỗi xảy ra khi tạo hóa đơn tự động');
      }
    } catch (error) {
      console.error('Error auto creating invoices:', error);
      toast.error('Có lỗi xảy ra khi tạo hóa đơn tự động');
    } finally {
      setIsAutoCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Quản lý hóa đơn</h1>
          <p className="text-xs md:text-sm text-gray-600">Danh sách tất cả hóa đơn trong hệ thống</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{loading ? 'Đang tải...' : 'Tải mới'}</span>
          </Button>
          <Button size="sm" onClick={() => router.push('/dashboard/hoa-don/them-moi')} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Tạo hóa đơn</span>
            <span className="sm:hidden">Tạo</span>
          </Button>
        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 md:gap-4 lg:gap-6">
        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Tổng hóa đơn</p>
              <p className="text-base md:text-2xl font-bold">{hoaDonList.length}</p>
            </div>
            <Receipt className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Chưa thanh toán</p>
              <p className="text-base md:text-2xl font-bold text-red-600">
                {hoaDonList.filter(h => h.trangThai === 'chuaThanhToan').length}
              </p>
            </div>
            <Receipt className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Quá hạn</p>
              <p className="text-base md:text-2xl font-bold text-orange-600">
                {hoaDonList.filter(h => new Date(h.hanThanhToan) < new Date()).length}
              </p>
            </div>
            <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-orange-600" />
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Doanh thu</p>
              <p className="text-xs md:text-2xl font-bold text-green-600 truncate">
                {formatCurrency(hoaDonList.reduce((sum, h) => sum + h.daThanhToan, 0))}
              </p>
            </div>
            <Receipt className="h-3 w-3 md:h-4 md:w-4 text-green-600 flex-shrink-0" />
          </div>
        </Card>
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Danh sách hóa đơn</CardTitle>
          <CardDescription>
            {filteredHoaDon.length} hóa đơn được tìm thấy
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <HoaDonDataTable
            data={filteredHoaDon}
            phongList={phongList}
            khachThueList={khachThueList}
            onView={handleView}
            onDownload={handleDownload}
            onScreenshot={handleScreenshot}
            onShare={handleCopyLink}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDeleteMultiple={handleDeleteMultiple}
            onPayment={handlePayment}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            monthFilter={monthFilter}
            onMonthChange={setMonthFilter}
            yearFilter={yearFilter}
            onYearChange={setYearFilter}
            getMonthOptions={getMonthOptions}
            getYearOptions={getYearOptions}
          />
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Danh sách hóa đơn</h2>
          <span className="text-sm text-gray-500">{filteredHoaDon.length} hóa đơn</span>
        </div>
        
        {/* Mobile Filters */}
        <div className="space-y-2 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm hóa đơn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm">Tất cả</SelectItem>
                <SelectItem value="chuaThanhToan" className="text-sm">Chưa thanh toán</SelectItem>
                <SelectItem value="daThanhToan" className="text-sm">Đã thanh toán</SelectItem>
                <SelectItem value="thanhToanMotPhan" className="text-sm">Thanh toán 1 phần</SelectItem>
              </SelectContent>
            </Select>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Tháng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm">Tất cả</SelectItem>
                {getMonthOptions().map(month => (
                  <SelectItem key={month} value={month.toString()} className="text-sm">
                    Tháng {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Năm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm">Tất cả</SelectItem>
                {getYearOptions().map(year => (
                  <SelectItem key={year} value={year.toString()} className="text-sm">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile Card List */}
        <div className="space-y-3">
          {filteredHoaDon.map((hoaDon) => {
            const isOverdue = new Date(hoaDon.hanThanhToan) < new Date() && hoaDon.trangThai !== 'daThanhToan';
            
            return (
              <Card key={hoaDon._id} className="p-4">
                <div className="space-y-3">
                  {/* Header with invoice code and status */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{hoaDon.maHoaDon}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Home className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-600">{getPhongName(hoaDon.phong, phongList)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {getStatusBadge(hoaDon.trangThai)}
                      {isOverdue && (
                        <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                          Quá hạn
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Customer and period info */}
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">{getKhachThueName(hoaDon.khachThue, khachThueList)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Tháng {hoaDon.thang}/{hoaDon.nam}</span>
                      <span className="mx-1">•</span>
                      <span>Hạn: {new Date(hoaDon.hanThanhToan).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>

                  {/* Amount info */}
                  <div className="border-t pt-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Tổng tiền:</span>
                        <p className="font-semibold text-blue-600">{formatCurrency(hoaDon.tongTien)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Đã thanh toán:</span>
                        <p className="font-semibold text-green-600">{formatCurrency(hoaDon.daThanhToan)}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Còn lại:</span>
                        <p className="font-semibold text-red-600">{formatCurrency(hoaDon.conLai)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(hoaDon)}
                      className="flex-1"
                    >
                      <FileText className="h-3.5 w-3.5 mr-1" />
                      Xem
                    </Button>
                    {hoaDon.conLai > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePayment(hoaDon)}
                        className="flex-1 text-green-600 hover:bg-green-50"
                      >
                        <CreditCard className="h-3.5 w-3.5 mr-1" />
                        Thanh toán
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(hoaDon)}
                      className="flex-1"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Link
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredHoaDon.length === 0 && (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Không có hóa đơn nào</p>
          </div>
        )}
      </div>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[95vw] md:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Chi tiết hóa đơn</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Thông tin chi tiết hóa đơn {viewingHoaDon?.maHoaDon}
            </DialogDescription>
          </DialogHeader>
          
          {viewingHoaDon && (
            <div className="space-y-4 md:space-y-6">
              {/* Invoice Header */}
              <div className="text-center border-b pb-3 md:pb-4">
                <h2 className="text-lg md:text-2xl font-bold">HÓA ĐƠN THUÊ PHÒNG</h2>
                <p className="text-base md:text-lg text-gray-600">{viewingHoaDon.maHoaDon}</p>
              </div>

              {/* Invoice Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <h3 className="text-sm md:text-base font-semibold mb-2">Thông tin phòng</h3>
                  <p className="text-xs md:text-sm"><strong>Phòng:</strong> {getPhongName(viewingHoaDon.phong, phongList)}</p>
                  <p className="text-xs md:text-sm"><strong>Khách thuê:</strong> {getKhachThueName(viewingHoaDon.khachThue, khachThueList)}</p>
                  <p className="text-xs md:text-sm"><strong>Hợp đồng:</strong> {
                    hopDongList.find(hd => hd._id === viewingHoaDon.hopDong)?.maHopDong || 'N/A'
                  }</p>
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-semibold mb-2">Thông tin thanh toán</h3>
                  <p className="text-xs md:text-sm"><strong>Tháng/Năm:</strong> {viewingHoaDon.thang}/{viewingHoaDon.nam}</p>
                  <p className="text-xs md:text-sm"><strong>Hạn thanh toán:</strong> {new Date(viewingHoaDon.hanThanhToan).toLocaleDateString('vi-VN')}</p>
                  <p className="text-xs md:text-sm"><strong>Trạng thái:</strong> {getStatusBadge(viewingHoaDon.trangThai)}</p>
                </div>
              </div>

              {/* Chỉ số điện nước */}
              <div>
                <h3 className="text-sm md:text-base font-semibold mb-3">Chỉ số điện nước</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
                  <div>
                    <h4 className="font-medium mb-2">Điện</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Chỉ số ban đầu:</span>
                        <span>{viewingHoaDon.chiSoDienBanDau || 0} kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Chỉ số cuối kỳ:</span>
                        <span>{viewingHoaDon.chiSoDienCuoiKy || 0} kWh</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Số điện sử dụng:</span>
                        <span>{viewingHoaDon.soDien || 0} kWh</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Nước</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Chỉ số ban đầu:</span>
                        <span>{viewingHoaDon.chiSoNuocBanDau || 0} m³</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Chỉ số cuối kỳ:</span>
                        <span>{viewingHoaDon.chiSoNuocCuoiKy || 0} m³</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Số nước sử dụng:</span>
                        <span>{viewingHoaDon.soNuoc || 0} m³</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div>
                <h3 className="text-sm md:text-base font-semibold mb-3">Chi tiết hóa đơn</h3>
                <div className="space-y-2 text-xs md:text-sm">
                  <div className="flex justify-between">
                    <span>Tiền phòng</span>
                    <span>{formatCurrency(viewingHoaDon.tienPhong)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiền điện ({viewingHoaDon.soDien} kWh)</span>
                    <span>{formatCurrency(viewingHoaDon.tienDien)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiền nước ({viewingHoaDon.soNuoc} m³)</span>
                    <span>{formatCurrency(viewingHoaDon.tienNuoc)}</span>
                  </div>
                  {viewingHoaDon.phiDichVu.map((phi, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{phi.ten}</span>
                      <span>{formatCurrency(phi.gia)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-3 md:pt-4">
                <div className="flex justify-between text-base md:text-lg font-semibold">
                  <span>Tổng tiền:</span>
                  <span>{formatCurrency(viewingHoaDon.tongTien)}</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span>Đã thanh toán:</span>
                  <span className="text-green-600">{formatCurrency(viewingHoaDon.daThanhToan)}</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span>Còn lại:</span>
                  <span className={viewingHoaDon.conLai > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                    {formatCurrency(viewingHoaDon.conLai)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {viewingHoaDon.ghiChu && (
                <div>
                  <h3 className="text-sm md:text-base font-semibold mb-2">Ghi chú</h3>
                  <p className="text-xs md:text-sm text-gray-600">{viewingHoaDon.ghiChu}</p>
                </div>
              )}

              {/* Actions */}
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsViewDialogOpen(false)} className="w-full sm:w-auto">
                  Đóng
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleCopyLink(viewingHoaDon)} className="w-full sm:w-auto">
                  <Copy className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  Copy link
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDownload(viewingHoaDon)} className="w-full sm:w-auto">
                  <Download className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  Tải HTML
                </Button>
                <Button size="sm" onClick={() => handleScreenshot(viewingHoaDon)} className="w-full sm:w-auto">
                  <Camera className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  Xuất PDF
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="w-[95vw] md:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Xác nhận thanh toán</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Tạo thanh toán cho hóa đơn {paymentHoaDon?.maHoaDon}
            </DialogDescription>
          </DialogHeader>
          
          {paymentHoaDon && (
            <PaymentForm 
              hoaDon={paymentHoaDon}
              onClose={() => setIsPaymentDialogOpen(false)}
              onSuccess={(updatedHoaDon) => {
                setIsPaymentDialogOpen(false);
                // Invalidate queries để refetch data
                queryClient.invalidateQueries({ queryKey: ['hoa-don'] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Payment Form Component
function PaymentForm({ 
  hoaDon, 
  onClose, 
  onSuccess 
}: { 
  hoaDon: HoaDon;
  onClose: () => void;
  onSuccess: (updatedHoaDon?: HoaDon) => void;
}) {
  const [formData, setFormData] = useState({
    soTien: hoaDon.conLai, // Mặc định thanh toán toàn bộ số tiền còn lại
    phuongThuc: 'tienMat' as 'tienMat' | 'chuyenKhoan' | 'viDienTu',
    nganHang: '',
    soGiaoDich: '',
    ngayThanhToan: new Date().toISOString().split('T')[0],
    ghiChu: '',
    anhBienLai: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const requestData = {
        hoaDonId: hoaDon._id,
        soTien: formData.soTien,
        phuongThuc: formData.phuongThuc,
        thongTinChuyenKhoan: formData.phuongThuc === 'chuyenKhoan' ? {
          nganHang: formData.nganHang,
          soGiaoDich: formData.soGiaoDich
        } : undefined,
        ngayThanhToan: formData.ngayThanhToan,
        ghiChu: formData.ghiChu,
        anhBienLai: formData.anhBienLai
      };
      
      console.log('Submitting payment:', requestData);
      
      const response = await fetch('/api/thanh-toan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Thanh toán đã được tạo thành công');
        onSuccess(result.data?.hoaDon); // Truyền hóa đơn đã cập nhật
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error('Có lỗi xảy ra khi tạo thanh toán');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Thông tin hóa đơn */}
      <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
        <h3 className="text-sm md:text-base font-semibold mb-3">Thông tin hóa đơn</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
          <div>
            <span className="text-gray-600">Mã hóa đơn:</span>
            <div className="font-medium">{hoaDon.maHoaDon}</div>
          </div>
          <div>
            <span className="text-gray-600">Tháng/Năm:</span>
            <div className="font-medium">{hoaDon.thang}/{hoaDon.nam}</div>
          </div>
          <div>
            <span className="text-gray-600">Tổng tiền:</span>
            <div className="font-medium">{formatCurrency(hoaDon.tongTien)}</div>
          </div>
          <div>
            <span className="text-gray-600">Đã thanh toán:</span>
            <div className="font-medium text-green-600">{formatCurrency(hoaDon.daThanhToan)}</div>
          </div>
          <div className="col-span-2">
            <span className="text-gray-600">Còn lại:</span>
            <div className="font-medium text-red-600 text-lg">{formatCurrency(hoaDon.conLai)}</div>
          </div>
        </div>
      </div>

      {/* Form thanh toán */}
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="space-y-2">
          <Label htmlFor="soTien" className="text-xs md:text-sm">Số tiền thanh toán (VNĐ) *</Label>
          <Input
            id="soTien"
            type="number"
            min="1"
            max={hoaDon.conLai}
            value={formData.soTien}
            onChange={(e) => setFormData(prev => ({ ...prev, soTien: parseInt(e.target.value) || 0 }))}
            required
            className="text-base md:text-lg"
          />
          <div className="text-[10px] md:text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
            💰 Tối đa có thể thanh toán: <span className="font-semibold">{formatCurrency(hoaDon.conLai)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phuongThuc" className="text-xs md:text-sm">Phương thức thanh toán *</Label>
          <Select value={formData.phuongThuc} onValueChange={(value) => setFormData(prev => ({ ...prev, phuongThuc: value as 'tienMat' | 'chuyenKhoan' | 'viDienTu' }))}>
            <SelectTrigger className="h-10 md:h-12 text-sm">
              <SelectValue placeholder="Chọn phương thức thanh toán" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tienMat" className="text-sm">💵 Tiền mặt</SelectItem>
              <SelectItem value="chuyenKhoan" className="text-sm">🏦 Chuyển khoản</SelectItem>
              <SelectItem value="viDienTu" className="text-sm">📱 Ví điện tử</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.phuongThuc === 'chuyenKhoan' && (
          <div className="space-y-3 md:space-y-4 p-3 md:p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="text-xs md:text-sm font-semibold text-green-800 flex items-center gap-2">
              🏦 Thông tin chuyển khoản
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label htmlFor="nganHang" className="text-xs md:text-sm">Ngân hàng</Label>
                <Input
                  id="nganHang"
                  value={formData.nganHang}
                  onChange={(e) => setFormData(prev => ({ ...prev, nganHang: e.target.value }))}
                  placeholder="Ví dụ: Vietcombank, BIDV..."
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="soGiaoDich" className="text-xs md:text-sm">Số giao dịch/Mã tham chiếu</Label>
                <Input
                  id="soGiaoDich"
                  value={formData.soGiaoDich}
                  onChange={(e) => setFormData(prev => ({ ...prev, soGiaoDich: e.target.value }))}
                  placeholder="Mã giao dịch từ ngân hàng"
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="space-y-2">
            <Label htmlFor="ngayThanhToan" className="text-xs md:text-sm">Ngày thanh toán *</Label>
            <Input
              id="ngayThanhToan"
              type="date"
              value={formData.ngayThanhToan}
              onChange={(e) => setFormData(prev => ({ ...prev, ngayThanhToan: e.target.value }))}
              required
              className="h-10 md:h-12 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ghiChu" className="text-xs md:text-sm">Ghi chú</Label>
            <Input
              id="ghiChu"
              value={formData.ghiChu}
              onChange={(e) => setFormData(prev => ({ ...prev, ghiChu: e.target.value }))}
              placeholder="Ghi chú về giao dịch..."
              className="h-10 md:h-12 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs md:text-sm">Ảnh biên lai thanh toán</Label>
          <ImageUpload
            imageUrl={formData.anhBienLai}
            onImageChange={(url) => setFormData(prev => ({ ...prev, anhBienLai: url }))}
            placeholder="Chọn ảnh biên lai thanh toán"
          />
          <div className="text-[10px] md:text-xs text-gray-500">
            📷 Tải lên ảnh biên lai để xác nhận giao dịch (tùy chọn)
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 md:pt-6 border-t">
          <Button 
            type="button" 
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={submitting}
            className="w-full sm:w-auto sm:min-w-[100px]"
          >
            Hủy
          </Button>
          <Button 
            type="submit"
            size="sm"
            disabled={submitting}
            className="w-full sm:w-auto sm:min-w-[160px]"
          >
            <CreditCard className="h-3 w-3 md:h-4 md:w-4 mr-2" />
            {submitting ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
          </Button>
        </DialogFooter>
      </form>
    </div>
  );
}

