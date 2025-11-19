'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  DoorOpen, 
  Users, 
  Receipt, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react';
import { useData } from '@/hooks/use-data';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { stats, loading } = useData();

  useEffect(() => {
    document.title = 'Dashboard';
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 md:gap-4 lg:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-2 md:p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-2 w-24" />
                </div>
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-2 w-20" />
                </div>
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats && !loading) return null;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-xs md:text-sm text-gray-600">Tổng quan hệ thống quản lý phòng trọ</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 md:gap-4 lg:gap-6">
        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Tổng phòng</p>
              <p className="text-base md:text-2xl font-bold">{stats.tongSoPhong}</p>
              <p className="text-[8px] md:text-xs text-gray-500">
                {stats.phongDangThue} đang thuê
              </p>
            </div>
            <Building2 className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Phòng trống</p>
              <p className="text-base md:text-2xl font-bold text-green-600">{stats.phongTrong}</p>
              <p className="text-[8px] md:text-xs text-gray-500">
                {((stats.phongTrong / stats.tongSoPhong) * 100).toFixed(1)}% tổng
              </p>
            </div>
            <DoorOpen className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Doanh thu</p>
              <p className="text-base md:text-2xl font-bold">{formatCurrency(stats.doanhThuThang)}</p>
              <p className="text-[8px] md:text-xs text-gray-500">
                +12% tháng trước
              </p>
            </div>
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Sự cố</p>
              <p className="text-base md:text-2xl font-bold text-red-600">{stats.suCoCanXuLy}</p>
              <p className="text-[8px] md:text-xs text-gray-500">
                Cần xử lý
              </p>
            </div>
            <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
        <Card className="p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">Hóa đơn sắp đến hạn</p>
              <p className="text-lg md:text-2xl font-bold text-orange-600">{stats.hoaDonSapDenHan}</p>
              <p className="text-[8px] md:text-xs text-gray-500">
                Cần theo dõi
              </p>
            </div>
            <Calendar className="h-4 w-4 text-orange-600" />
          </div>
        </Card>

        <Card className="p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">Hợp đồng sắp hết hạn</p>
              <p className="text-lg md:text-2xl font-bold text-yellow-600">{stats.hopDongSapHetHan}</p>
              <p className="text-[8px] md:text-xs text-gray-500">
                Cần gia hạn
              </p>
            </div>
            <Clock className="h-4 w-4 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600">Doanh thu năm</p>
              <p className="text-lg md:text-2xl font-bold">{formatCurrency(stats.doanhThuNam)}</p>
              <p className="text-[8px] md:text-xs text-gray-500">
                Tổng doanh thu
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Hoạt động gần đây</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Các hoạt động mới nhất trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium truncate">Khách thuê mới đăng ký</p>
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">Nguyễn Văn A - Phòng P101</p>
              </div>
              <Badge variant="secondary" className="text-[10px] md:text-xs">Mới</Badge>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium truncate">Thanh toán thành công</p>
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">Phòng P102 - 2,500,000 VNĐ</p>
              </div>
              <Badge variant="outline" className="text-[10px] md:text-xs">Hoàn thành</Badge>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium truncate">Báo cáo sự cố</p>
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">Phòng P105 - Hỏng điều hòa</p>
              </div>
              <Badge variant="destructive" className="text-[10px] md:text-xs">Cần xử lý</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Thống kê phòng</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Tình trạng sử dụng phòng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                  <span className="text-xs md:text-sm">Phòng trống</span>
                </div>
                <span className="text-xs md:text-sm font-medium">{stats.phongTrong}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                  <span className="text-xs md:text-sm">Đang thuê</span>
                </div>
                <span className="text-xs md:text-sm font-medium">{stats.phongDangThue}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
                  <span className="text-xs md:text-sm">Bảo trì</span>
                </div>
                <span className="text-xs md:text-sm font-medium">{stats.phongBaoTri}</span>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm font-medium">Tổng cộng</span>
                  <span className="text-xs md:text-sm font-medium">{stats.tongSoPhong}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
