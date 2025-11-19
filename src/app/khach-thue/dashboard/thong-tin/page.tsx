'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, MapPin, Calendar, CreditCard, Home } from 'lucide-react';

export default function ThongTinPage() {
  const [khachThue, setKhachThue] = useState<any>(null);
  const [hopDong, setHopDong] = useState<any>(null);
  const [phong, setPhong] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const khachThueData = localStorage.getItem('khachThueData');
    if (khachThueData) {
      const data = JSON.parse(khachThueData);
      setKhachThue(data);
      fetchContractAndRoom(data);
    }
  }, []);

  const fetchContractAndRoom = async (khachThueData: any) => {
    try {
      setLoading(true);
      const response = await fetch('/api/data');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Find active contract
          const allHopDong = result.data.hopDong || [];
          const activeContract = allHopDong.find((hd: any) => {
            const nguoiDaiDien = typeof hd.nguoiDaiDien === 'object' 
              ? hd.nguoiDaiDien._id 
              : hd.nguoiDaiDien;
            return nguoiDaiDien === khachThueData._id && hd.trangThai === 'hoatDong';
          });
          setHopDong(activeContract);

          if (activeContract) {
            const phongId = typeof activeContract.phong === 'object'
              ? activeContract.phong._id
              : activeContract.phong;
            const allPhong = result.data.phong || [];
            const tenantPhong = allPhong.find((p: any) => p._id === phongId);
            setPhong(tenantPhong);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!khachThue) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-500">Không tìm thấy thông tin</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h1>
        <p className="text-sm text-gray-600 mt-1">Xem và quản lý thông tin của bạn</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Thông tin cá nhân */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Thông tin cá nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Họ tên</p>
                <p className="font-semibold">{khachThue.hoTen || khachThue.ten || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Số điện thoại</p>
                <p className="font-semibold">{khachThue.soDienThoai || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{khachThue.email || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">CCCD/CMND</p>
                <p className="font-semibold">{khachThue.cccd || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Quê quán</p>
                <p className="font-semibold">{khachThue.queQuan || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Ngày sinh</p>
                <p className="font-semibold">{formatDate(khachThue.ngaySinh)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thông tin hợp đồng và phòng */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Thông tin thuê trọ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {phong ? (
              <>
                <div className="flex items-center gap-3">
                  <Home className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Phòng</p>
                    <p className="font-semibold">{phong.maPhong || 'N/A'}</p>
                  </div>
                </div>
                {phong.toaNha && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Tòa nhà</p>
                      <p className="font-semibold">
                        {typeof phong.toaNha === 'object' 
                          ? phong.toaNha.tenToaNha 
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 text-gray-500 flex items-center justify-center">
                    <span className="text-xs">m²</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Diện tích</p>
                    <p className="font-semibold">{phong.dienTich || 'N/A'} m²</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 text-gray-500 flex items-center justify-center">
                    <span className="text-xs">₫</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Giá thuê</p>
                    <p className="font-semibold">{formatCurrency(phong.giaThue || 0)}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-500">Chưa có thông tin phòng</p>
            )}

            {hopDong && (
              <>
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-semibold mb-2">Hợp đồng</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Mã hợp đồng</p>
                        <p className="font-semibold">
                          {hopDong.maHopDong || hopDong.soHopDong || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Ngày bắt đầu</p>
                        <p className="font-semibold">{formatDate(hopDong.ngayBatDau)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Ngày kết thúc</p>
                        <p className="font-semibold">{formatDate(hopDong.ngayKetThuc)}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Badge className={
                        hopDong.trangThai === 'hoatDong' 
                          ? 'bg-green-500' 
                          : 'bg-gray-500'
                      }>
                        {hopDong.trangThai === 'hoatDong' ? 'Đang hoạt động' : hopDong.trangThai}
                      </Badge>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

