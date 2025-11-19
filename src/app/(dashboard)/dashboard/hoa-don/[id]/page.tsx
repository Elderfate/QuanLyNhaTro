'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Zap,
  Droplets,
  Wrench,
  Calculator
} from 'lucide-react';
import { HoaDon, HopDong, Phong, KhachThue } from '@/types';
import { toast } from 'sonner';
import { useData } from '@/hooks/use-data';

// Helper functions
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

export default function ChinhSuaHoaDonPage() {
  const router = useRouter();
  const params = useParams();
  const hoaDonId = params.id as string;

  const { hopDong: allHopDong, phong: allPhong, khachThue: allKhachThue } = useData();
  // Filter active hopDong
  const hopDongList = allHopDong.filter((hd: HopDong) => hd.trangThai === 'hoatDong');
  const phongList = allPhong;
  const khachThueList = allKhachThue;

  const [hoaDon, setHoaDon] = useState<HoaDon | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    maHoaDon: '',
    hopDong: '',
    phong: '',
    khachThue: '',
    thang: new Date().getMonth() + 1,
    nam: new Date().getFullYear(),
    tienPhong: 0,
    tienDien: 0,
    soDien: 0,
    chiSoDienBanDau: 0,
    chiSoDienCuoiKy: 0,
    tienNuoc: 0,
    soNuoc: 0,
    chiSoNuocBanDau: 0,
    chiSoNuocCuoiKy: 0,
    phiDichVu: [] as Array<{ten: string, gia: number}>,
    tongTien: 0,
    daThanhToan: 0,
    conLai: 0,
    trangThai: 'chuaThanhToan' as 'chuaThanhToan' | 'daThanhToanMotPhan' | 'daThanhToan' | 'quaHan',
    hanThanhToan: '',
    ghiChu: '',
  });

  const [newPhiDichVu, setNewPhiDichVu] = useState({ ten: '', gia: 0 });

  useEffect(() => {
    if (hoaDonId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoaDonId]);

  const fetchData = async () => {
    try {
      // Fetch hóa đơn chi tiết theo ID
      const hoaDonResponse = await fetch(`/api/hoa-don?id=${hoaDonId}`);
      if (hoaDonResponse.ok) {
        const hoaDonData = await hoaDonResponse.json();
        const hoaDonItem = hoaDonData.data;
        if (hoaDonItem) {
          setHoaDon(hoaDonItem);
          console.log('Hoa don loaded for editing:', hoaDonItem);
          
          // Set form data
          console.log('Setting form data with electricity readings:', {
            chiSoDienBanDau: hoaDonItem.chiSoDienBanDau,
            chiSoDienCuoiKy: hoaDonItem.chiSoDienCuoiKy,
            chiSoNuocBanDau: hoaDonItem.chiSoNuocBanDau,
            chiSoNuocCuoiKy: hoaDonItem.chiSoNuocCuoiKy
          });
          
          setFormData({
            maHoaDon: hoaDonItem.maHoaDon || '',
            hopDong: typeof hoaDonItem.hopDong === 'object' ? (hoaDonItem.hopDong as {_id: string})?._id || '' : hoaDonItem.hopDong || '',
            phong: typeof hoaDonItem.phong === 'object' ? (hoaDonItem.phong as {_id: string})?._id || '' : hoaDonItem.phong || '',
            khachThue: typeof hoaDonItem.khachThue === 'object' ? (hoaDonItem.khachThue as {_id: string})?._id || '' : hoaDonItem.khachThue || '',
            thang: hoaDonItem.thang || new Date().getMonth() + 1,
            nam: hoaDonItem.nam || new Date().getFullYear(),
            tienPhong: hoaDonItem.tienPhong || 0,
            tienDien: hoaDonItem.tienDien || 0,
            soDien: hoaDonItem.soDien || 0,
            chiSoDienBanDau: hoaDonItem.chiSoDienBanDau ?? 0,
            chiSoDienCuoiKy: hoaDonItem.chiSoDienCuoiKy ?? 0,
            tienNuoc: hoaDonItem.tienNuoc || 0,
            soNuoc: hoaDonItem.soNuoc || 0,
            chiSoNuocBanDau: hoaDonItem.chiSoNuocBanDau ?? 0,
            chiSoNuocCuoiKy: hoaDonItem.chiSoNuocCuoiKy ?? 0,
            phiDichVu: hoaDonItem.phiDichVu || [],
            tongTien: hoaDonItem.tongTien || 0,
            daThanhToan: hoaDonItem.daThanhToan || 0,
            conLai: hoaDonItem.conLai || 0,
            trangThai: hoaDonItem.trangThai || 'chuaThanhToan',
            hanThanhToan: hoaDonItem.hanThanhToan ? 
              (typeof hoaDonItem.hanThanhToan === 'string' ? (hoaDonItem.hanThanhToan as string).split('T')[0] : 
               new Date(hoaDonItem.hanThanhToan as Date).toISOString().split('T')[0]) : '',
            ghiChu: hoaDonItem.ghiChu || '',
          });
        } else {
          toast.error('Không tìm thấy hóa đơn');
          router.push('/dashboard/hoa-don');
          return;
        }
      } else {
        toast.error('Lỗi khi tải thông tin hóa đơn');
        router.push('/dashboard/hoa-don');
        return;
      }

      // HopDong, Phong, KhachThue data already loaded from useData hook
      // No need to fetch again
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const totalPhiDichVu = formData.phiDichVu.reduce((sum: number, phi) => sum + phi.gia, 0);
    
    // Tính tiền điện nước từ chỉ số
    const soDien = formData.chiSoDienCuoiKy - formData.chiSoDienBanDau;
    const soNuoc = formData.chiSoNuocCuoiKy - formData.chiSoNuocBanDau;
    
    // Lấy giá điện nước từ hợp đồng
    const selectedHopDong = hopDongList.find(hd => hd._id === formData.hopDong);
    const giaDien = selectedHopDong?.giaDien || 0;
    const giaNuoc = selectedHopDong?.giaNuoc || 0;
    
    const tienDienTinh = soDien * giaDien;
    const tienNuocTinh = soNuoc * giaNuoc;
    
    const total = formData.tienPhong + tienDienTinh + tienNuocTinh + totalPhiDichVu;
    const conLai = total - formData.daThanhToan;
    
    setFormData(prev => ({
      ...prev,
      soDien: Math.max(0, soDien),
      soNuoc: Math.max(0, soNuoc),
      tienDien: tienDienTinh,
      tienNuoc: tienNuocTinh,
      tongTien: total,
      conLai: conLai
    }));
  };

  useEffect(() => {
    calculateTotal();
  }, [formData.tienPhong, formData.chiSoDienBanDau, formData.chiSoDienCuoiKy, formData.chiSoNuocBanDau, formData.chiSoNuocCuoiKy, formData.phiDichVu, formData.daThanhToan, formData.hopDong, hopDongList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const requestData = {
        ...formData,
        id: hoaDonId
      };
      
      console.log('Submitting form data for update:', requestData);
      
      const response = await fetch('/api/hoa-don', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const result = await response.json();
        // Xóa cache
        sessionStorage.removeItem('hoa-don-data');
        toast.success(result.message || 'Hóa đơn đã được cập nhật thành công');
        router.replace('/dashboard/hoa-don');
        router.refresh();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Có lỗi xảy ra khi gửi dữ liệu');
    } finally {
      setSubmitting(false);
    }
  };

  const addPhiDichVu = () => {
    if (newPhiDichVu.ten && newPhiDichVu.gia > 0) {
      setFormData(prev => ({
        ...prev,
        phiDichVu: [...prev.phiDichVu, { ...newPhiDichVu }]
      }));
      setNewPhiDichVu({ ten: '', gia: 0 });
    }
  };

  const removePhiDichVu = (index: number) => {
    setFormData(prev => ({
      ...prev,
      phiDichVu: prev.phiDichVu.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!hoaDon) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => router.push('/dashboard/hoa-don')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Không tìm thấy hóa đơn</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 md:gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.push('/dashboard/hoa-don')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Chỉnh sửa hóa đơn</h1>
          <p className="text-xs md:text-sm text-gray-600">Cập nhật thông tin hóa đơn {hoaDon.maHoaDon}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Thông tin hóa đơn</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Cập nhật thông tin hóa đơn {hoaDon.maHoaDon}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="thong-tin" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="thong-tin" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-1 md:px-3">
                  <FileText className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Thông tin</span>
                  <span className="sm:hidden">TT</span>
                </TabsTrigger>
                <TabsTrigger value="dien" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-1 md:px-3">
                  <Zap className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Điện</span>
                  <span className="sm:hidden">Đ</span>
                </TabsTrigger>
                <TabsTrigger value="nuoc" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-1 md:px-3">
                  <Droplets className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Nước</span>
                  <span className="sm:hidden">N</span>
                </TabsTrigger>
                <TabsTrigger value="dich-vu" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-1 md:px-3">
                  <Wrench className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Dịch vụ</span>
                  <span className="sm:hidden">DV</span>
                </TabsTrigger>
                <TabsTrigger value="tong-ket" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-1 md:px-3">
                  <Calculator className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Tổng kết</span>
                  <span className="sm:hidden">TK</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="thong-tin" className="space-y-3 md:space-y-4 mt-4 md:mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="maHoaDon" className="text-xs md:text-sm">Mã hóa đơn</Label>
                    <Input
                      id="maHoaDon"
                      value={formData.maHoaDon}
                      onChange={(e) => setFormData(prev => ({ ...prev, maHoaDon: e.target.value.toUpperCase() }))}
                      placeholder="HD202401001"
                      required
                      className="h-10 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="hopDong" className="text-sm">Hợp đồng *</Label>
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mb-1">
                      {hopDongList.filter(hd => hd.trangThai === 'hoatDong').length} hợp đồng hoạt động
                    </div>
                    <Select value={formData.hopDong} onValueChange={(value) => setFormData(prev => ({ ...prev, hopDong: value }))}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Chọn hợp đồng" />
                      </SelectTrigger>
                      <SelectContent>
                        {hopDongList.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500">Đang tải hợp đồng...</div>
                        ) : (
                          hopDongList
                            .filter(hd => hd.trangThai === 'hoatDong')
                            .map((hopDong) => {
                              const phongName = typeof hopDong.phong === 'object' && (hopDong.phong as Phong)?.maPhong 
                                ? (hopDong.phong as Phong).maPhong 
                                : getPhongName(hopDong.phong as string, phongList);
                              return (
                                <SelectItem key={hopDong._id} value={hopDong._id!}>
                                  {hopDong.maHopDong} - {phongName}
                                </SelectItem>
                              );
                            })
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="phong" className="text-sm">Phòng</Label>
                    <Input
                      id="phong"
                      value={getPhongName(formData.phong, phongList)}
                      disabled
                      className="bg-gray-50 h-10"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="khachThue" className="text-sm">Khách thuê</Label>
                    <Input
                      id="khachThue"
                      value={getKhachThueName(formData.khachThue, khachThueList)}
                      disabled
                      className="bg-gray-50 h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="thang" className="text-sm">Tháng</Label>
                    <Input
                      id="thang"
                      type="number"
                      min="1"
                      max="12"
                      value={formData.thang}
                      onChange={(e) => setFormData(prev => ({ ...prev, thang: parseInt(e.target.value) || 1 }))}
                      required
                      className="h-10 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="nam" className="text-sm">Năm</Label>
                    <Input
                      id="nam"
                      type="number"
                      min="2020"
                      value={formData.nam}
                      onChange={(e) => setFormData(prev => ({ ...prev, nam: parseInt(e.target.value) || new Date().getFullYear() }))}
                      required
                      className="h-10 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="hanThanhToan" className="text-sm">Hạn thanh toán</Label>
                    <Input
                      id="hanThanhToan"
                      type="date"
                      value={formData.hanThanhToan}
                      onChange={(e) => setFormData(prev => ({ ...prev, hanThanhToan: e.target.value }))}
                      required
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="tienPhong" className="text-sm">Tiền phòng (VNĐ)</Label>
                    <Input
                      id="tienPhong"
                      type="number"
                      min="0"
                      value={formData.tienPhong}
                      onChange={(e) => setFormData(prev => ({ ...prev, tienPhong: parseInt(e.target.value) || 0 }))}
                      required
                      className="h-10 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="daThanhToan" className="text-sm">Đã thanh toán (VNĐ)</Label>
                    <Input
                      id="daThanhToan"
                      type="number"
                      min="0"
                      value={formData.daThanhToan}
                      onChange={(e) => setFormData(prev => ({ ...prev, daThanhToan: parseInt(e.target.value) || 0 }))}
                      required
                      className="h-10 text-sm"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="dien" className="space-y-4 mt-6">
                <h3 className="text-base font-semibold">⚡ Chỉ số điện</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="chiSoDienBanDau" className="text-sm">Chỉ số ban đầu (kWh)</Label>
                    <Input
                      id="chiSoDienBanDau"
                      type="number"
                      min="0"
                      value={formData.chiSoDienBanDau}
                      onChange={(e) => setFormData(prev => ({ ...prev, chiSoDienBanDau: parseInt(e.target.value) || 0 }))}
                      required
                      className="h-10 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="chiSoDienCuoiKy" className="text-sm">Chỉ số cuối kỳ (kWh)</Label>
                    <Input
                      id="chiSoDienCuoiKy"
                      type="number"
                      min="0"
                      value={formData.chiSoDienCuoiKy}
                      onChange={(e) => setFormData(prev => ({ ...prev, chiSoDienCuoiKy: parseInt(e.target.value) || 0 }))}
                      required
                      className="h-10 text-sm"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="soDien" className="text-sm">Số điện sử dụng (kWh)</Label>
                    <Input
                      id="soDien"
                      type="number"
                      min="0"
                      value={formData.soDien}
                      disabled
                      className="bg-gray-50 h-10"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="tienDien" className="text-sm">Tiền điện (VNĐ)</Label>
                    <Input
                      id="tienDien"
                      type="number"
                      min="0"
                      value={formData.tienDien}
                      disabled
                      className="bg-gray-50 h-10"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="nuoc" className="space-y-4 mt-6">
                <h3 className="text-base font-semibold">💧 Chỉ số nước</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="chiSoNuocBanDau" className="text-sm">Chỉ số ban đầu (m³)</Label>
                    <Input
                      id="chiSoNuocBanDau"
                      type="number"
                      min="0"
                      value={formData.chiSoNuocBanDau}
                      onChange={(e) => setFormData(prev => ({ ...prev, chiSoNuocBanDau: parseInt(e.target.value) || 0 }))}
                      required
                      className="h-10 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="chiSoNuocCuoiKy" className="text-sm">Chỉ số cuối kỳ (m³)</Label>
                    <Input
                      id="chiSoNuocCuoiKy"
                      type="number"
                      min="0"
                      value={formData.chiSoNuocCuoiKy}
                      onChange={(e) => setFormData(prev => ({ ...prev, chiSoNuocCuoiKy: parseInt(e.target.value) || 0 }))}
                      required
                      className="h-10 text-sm"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="soNuoc" className="text-sm">Số nước sử dụng (m³)</Label>
                    <Input
                      id="soNuoc"
                      type="number"
                      min="0"
                      value={formData.soNuoc}
                      disabled
                      className="bg-gray-50 h-10"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="tienNuoc" className="text-sm">Tiền nước (VNĐ)</Label>
                    <Input
                      id="tienNuoc"
                      type="number"
                      min="0"
                      value={formData.tienNuoc}
                      disabled
                      className="bg-gray-50 h-10"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="dich-vu" className="space-y-4 mt-6">
                <h3 className="text-base font-semibold">🔧 Phí dịch vụ</h3>
                
                {formData.phiDichVu.length > 0 && (
                  <div className="space-y-2">
                    {formData.phiDichVu.map((phi, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                        <span className="text-sm font-medium">{phi.ten}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-blue-600 font-medium">{phi.gia.toLocaleString('vi-VN')} VNĐ</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removePhiDichVu(index)}
                            className="h-7 px-2 text-xs"
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label className="text-sm">Thêm phí dịch vụ</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Tên dịch vụ"
                      value={newPhiDichVu.ten}
                      onChange={(e) => setNewPhiDichVu(prev => ({ ...prev, ten: e.target.value }))}
                      className="flex-1 h-9"
                    />
                    <Input
                      placeholder="Giá"
                      type="number"
                      min="0"
                      value={newPhiDichVu.gia}
                      onChange={(e) => setNewPhiDichVu(prev => ({ ...prev, gia: parseInt(e.target.value) || 0 }))}
                      className="w-24 h-9"
                    />
                    <Button 
                      type="button" 
                      onClick={addPhiDichVu}
                      disabled={!newPhiDichVu.ten || newPhiDichVu.gia <= 0}
                      className="h-9 px-3 text-sm"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tong-ket" className="space-y-4 mt-6">
                <h3 className="text-base font-semibold">💰 Tổng kết</h3>
                <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Tổng tiền</div>
                    <div className="text-lg font-bold text-gray-900">{formData.tongTien.toLocaleString('vi-VN')} VNĐ</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Đã thanh toán</div>
                    <div className="text-lg font-bold text-green-600">{formData.daThanhToan.toLocaleString('vi-VN')} VNĐ</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Còn lại</div>
                    <div className={`text-lg font-bold ${formData.conLai > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formData.conLai.toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trangThai" className="text-sm">Trạng thái</Label>
                    <Select value={formData.trangThai} onValueChange={(value) => setFormData(prev => ({ ...prev, trangThai: value as 'chuaThanhToan' | 'daThanhToanMotPhan' | 'daThanhToan' | 'quaHan' }))}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chuaThanhToan">Chưa thanh toán</SelectItem>
                        <SelectItem value="daThanhToanMotPhan">Thanh toán một phần</SelectItem>
                        <SelectItem value="daThanhToan">Đã thanh toán</SelectItem>
                        <SelectItem value="quaHan">Quá hạn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ghiChu" className="text-sm">Ghi chú</Label>
                    <Input
                      id="ghiChu"
                      value={formData.ghiChu}
                      onChange={(e) => setFormData(prev => ({ ...prev, ghiChu: e.target.value }))}
                      placeholder="Ghi chú về hóa đơn..."
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 md:gap-3 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/dashboard/hoa-don')}
                    disabled={submitting}
                    className="w-full sm:w-auto sm:min-w-[80px]"
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="submit"
                    size="sm"
                    loading={submitting}
                    disabled={submitting}
                    className="w-full sm:w-auto sm:min-w-[120px]"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Cập nhật hóa đơn
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}