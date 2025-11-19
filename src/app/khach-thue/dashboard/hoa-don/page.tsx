'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, DollarSign, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface HoaDon {
  _id: string;
  maHoaDon?: string;
  soHoaDon?: string;
  hopDong?: any;
  phong?: any;
  khachThue?: any;
  tongTien?: number;
  daThanhToan?: number;
  conLai?: number;
  trangThai?: string;
  hanThanhToan?: string;
  ngayTao?: string;
}

export default function HoaDonPage() {
  const [hoaDonList, setHoaDonList] = useState<HoaDon[]>([]);
  const [loading, setLoading] = useState(true);
  const [khachThue, setKhachThue] = useState<any>(null);

  useEffect(() => {
    const khachThueData = localStorage.getItem('khachThueData');
    if (khachThueData) {
      const data = JSON.parse(khachThueData);
      setKhachThue(data);
      fetchHoaDon(data._id);
    }
  }, []);

  const fetchHoaDon = async (khachThueId: string) => {
    try {
      setLoading(true);
      // Fetch all invoices and filter by tenant
      const response = await fetch('/api/data');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const allHoaDon = result.data.hoaDon || [];
          // Filter invoices for this tenant
          const tenantInvoices = allHoaDon.filter((hd: any) => 
            hd.khachThue === khachThueId || 
            (typeof hd.khachThue === 'object' && hd.khachThue._id === khachThueId)
          );
          setHoaDonList(tenantInvoices);
        }
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Không thể tải danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (trangThai?: string) => {
    switch (trangThai) {
      case 'daThanhToan':
        return <Badge className="bg-green-500">Đã thanh toán</Badge>;
      case 'chuaThanhToan':
        return <Badge variant="destructive">Chưa thanh toán</Badge>;
      case 'daThanhToanMotPhan':
        return <Badge className="bg-yellow-500">Đã thanh toán một phần</Badge>;
      default:
        return <Badge variant="outline">{trangThai || 'N/A'}</Badge>;
    }
  };

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hóa đơn của tôi</h1>
        <p className="text-sm text-gray-600 mt-1">Danh sách tất cả hóa đơn</p>
      </div>

      {hoaDonList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Chưa có hóa đơn nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {hoaDonList.map((hoaDon) => (
            <Card key={hoaDon._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {hoaDon.maHoaDon || hoaDon.soHoaDon || `HĐ-${hoaDon._id.slice(-6)}`}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Phòng: {hoaDon.phong?.maPhong || 'N/A'}
                    </CardDescription>
                  </div>
                  {getStatusBadge(hoaDon.trangThai)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Tổng tiền:</span>
                      <span className="font-semibold">{formatCurrency(hoaDon.tongTien)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-600">Đã thanh toán:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(hoaDon.daThanhToan || 0)}
                      </span>
                    </div>
                    {hoaDon.conLai && hoaDon.conLai > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span className="text-gray-600">Còn lại:</span>
                        <span className="font-semibold text-yellow-600">
                          {formatCurrency(hoaDon.conLai)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Hạn thanh toán:</span>
                      <span className="font-semibold">{formatDate(hoaDon.hanThanhToan)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Ngày tạo:</span>
                      <span className="font-semibold">{formatDate(hoaDon.ngayTao)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Link href={`/hoa-don/${hoaDon._id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Xem chi tiết
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

