'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, FileText, AlertCircle, MapPin, Calendar, DollarSign, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function KhachThueDashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('khachThueToken');
      if (!token) return;

      const response = await fetch('/api/auth/khach-thue/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setDashboardData(result.data);
      } else {
        toast.error('Không thể tải thông tin');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return <div className="text-center text-gray-600">Không có dữ liệu</div>;
  }

  const { khachThue, hopDongHienTai, soHoaDonChuaThanhToan, hoaDonGanNhat } = dashboardData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
        <p className="text-gray-600">Xin chào {khachThue.hoTen}, đây là thông tin của bạn</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phòng đang thuê</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hopDongHienTai?.phong?.maPhong || 'Chưa thuê'}
            </div>
            {hopDongHienTai?.phong?.toaNha && (
              <p className="text-xs text-muted-foreground">
                {hopDongHienTai.phong.toaNha.tenToaNha}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hóa đơn chưa thanh toán</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{soHoaDonChuaThanhToan}</div>
            <p className="text-xs text-muted-foreground">
              {soHoaDonChuaThanhToan > 0 ? 'Cần thanh toán' : 'Đã thanh toán hết'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {khachThue.trangThai === 'dangThue' ? (
                <Badge className="bg-green-600">Đang thuê</Badge>
              ) : khachThue.trangThai === 'daTraPhong' ? (
                <Badge variant="secondary">Đã trả phòng</Badge>
              ) : (
                <Badge variant="outline">Chưa thuê</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Thông tin phòng */}
      {hopDongHienTai && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Thông tin phòng đang thuê
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4">Thông tin phòng</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Home className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Mã phòng</p>
                    <p className="font-medium">{hopDongHienTai.phong.maPhong}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tòa nhà</p>
                    <p className="font-medium">{hopDongHienTai.phong.toaNha.tenToaNha}</p>
                    <p className="text-sm text-muted-foreground">
                      {hopDongHienTai.phong.toaNha.diaChi?.duong}, {hopDongHienTai.phong.toaNha.diaChi?.phuong}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Giá thuê/tháng</p>
                    <p className="font-medium text-green-600">{formatCurrency(hopDongHienTai.phong.giaThue)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Thông tin hợp đồng</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Mã hợp đồng</p>
                    <p className="font-medium">{hopDongHienTai.maHopDong}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Thời gian thuê</p>
                    <p className="font-medium">
                      {formatDate(hopDongHienTai.ngayBatDau)} - {formatDate(hopDongHienTai.ngayKetThuc)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tiền cọc</p>
                    <p className="font-medium text-orange-600">{formatCurrency(hopDongHienTai.tienCoc)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hóa đơn gần nhất */}
      {hoaDonGanNhat && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Hóa đơn gần nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Mã hóa đơn</p>
                <p className="font-medium">{hoaDonGanNhat.maHoaDon}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tháng</p>
                <p className="font-medium">{hoaDonGanNhat.thang}/{hoaDonGanNhat.nam}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng tiền</p>
                <p className="font-medium text-green-600">{formatCurrency(hoaDonGanNhat.tongTien)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trạng thái</p>
                {hoaDonGanNhat.trangThai === 'daThanhToan' ? (
                  <Badge className="bg-green-600">Đã thanh toán</Badge>
                ) : hoaDonGanNhat.trangThai === 'chuaThanhToan' ? (
                  <Badge variant="outline">Chưa thanh toán</Badge>
                ) : hoaDonGanNhat.trangThai === 'quaHan' ? (
                  <Badge variant="destructive">Quá hạn</Badge>
                ) : (
                  <Badge variant="secondary">Thanh toán một phần</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Thông tin liên hệ */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin liên hệ</CardTitle>
          <CardDescription>Vui lòng liên hệ quản lý nếu có thắc mắc</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Hotline: 0123-456-789</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Email: support@phongtro.com</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

