'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Home, 
  MapPin, 
  Users, 
  Square, 
  DollarSign, 
  Phone,
  Eye,
  ArrowLeft,
  Star,
  ZoomIn
} from 'lucide-react';
import { Phong, ToaNha } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';
import { ImageCarousel } from '@/components/ui/image-carousel';

export default function XemPhongPage() {
  const [phongList, setPhongList] = useState<Phong[]>([]);
  const [toaNhaList, setToaNhaList] = useState<ToaNha[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedToaNha, setSelectedToaNha] = useState('');
  const [selectedTrangThai, setSelectedTrangThai] = useState('');
  const [selectedPhong, setSelectedPhong] = useState<Phong | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    fetchPhong();
    fetchToaNha();
    
    // Check for phong parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const phongParam = urlParams.get('phong');
    if (phongParam) {
      setSearchTerm(phongParam);
    }
  }, []);

  const fetchPhong = async () => {
    try {
      const params = new URLSearchParams();
      params.append('limit', '100');
      if (selectedToaNha && selectedToaNha !== 'all') params.append('toaNha', selectedToaNha);
      if (selectedTrangThai && selectedTrangThai !== 'all') params.append('trangThai', selectedTrangThai);
      
      const response = await fetch(`/api/phong-public?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPhongList(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching phong:', error);
      toast.error('Có lỗi xảy ra khi tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  };

  const fetchToaNha = async () => {
    try {
      const response = await fetch('/api/toa-nha-public');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setToaNhaList(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching toa nha:', error);
    }
  };

  useEffect(() => {
    fetchPhong();
  }, [selectedToaNha, selectedTrangThai]);

  // Auto-open phong details when phong parameter is in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const phongParam = urlParams.get('phong');
    if (phongParam && phongList.length > 0) {
      const targetPhong = phongList.find(p => p.maPhong.toLowerCase() === phongParam.toLowerCase());
      if (targetPhong) {
        setSelectedPhong(targetPhong);
        setShowDetails(true);
        setSelectedImageIndex(0);
      }
    }
  }, [phongList]);

  const filteredPhong = phongList.filter(phong =>
    phong.maPhong.toLowerCase().includes(searchTerm.toLowerCase()) ||
    phong.moTa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (typeof phong.toaNha === 'object' && phong.toaNha && (phong.toaNha as any).tenToaNha?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTrangThaiBadge = (trangThai: string) => {
    const variants = {
      trong: { variant: 'secondary' as const, label: 'Trống', color: 'text-green-600' },
      daDat: { variant: 'outline' as const, label: 'Đã đặt', color: 'text-blue-600' },
      dangThue: { variant: 'default' as const, label: 'Đang thuê', color: 'text-orange-600' },
      baoTri: { variant: 'destructive' as const, label: 'Bảo trì', color: 'text-red-600' },
    };
    
    const config = variants[trangThai as keyof typeof variants] || variants.trong;
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const tienNghiLabels = {
    dieuhoa: 'Điều hòa',
    nonglanh: 'Nóng lạnh',
    tulanh: 'Tủ lạnh',
    giuong: 'Giường',
    tuquanao: 'Tủ quần áo',
    banlamviec: 'Bàn làm việc',
    ghe: 'Ghế',
    tivi: 'TV',
    wifi: 'WiFi',
    maygiat: 'Máy giặt',
    bep: 'Bếp',
    noi: 'Nồi',
    chen: 'Chén',
    bat: 'Bát',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative">
        {/* Polka dot background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="h-8 bg-gradient-to-r from-indigo-200 to-cyan-200 rounded-xl w-48 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-96 bg-gradient-to-br from-white to-indigo-50 rounded-2xl shadow-lg animate-pulse border border-indigo-100"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showDetails && selectedPhong) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative">
        {/* Polka dot background */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, #6366f1 1.5px, transparent 1.5px)',
            backgroundSize: '25px 25px'
          }}></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-4 md:py-8">
          {/* Header */}
          <div className="mb-4 md:mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(false)}
              className="mb-3 md:mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-800 via-purple-700 to-cyan-700 bg-clip-text text-transparent">
                  Phòng {selectedPhong.maPhong}
                </h1>
                <p className="text-xs md:text-sm text-slate-600">
                  {typeof selectedPhong.toaNha === 'object' ? (selectedPhong.toaNha as any).tenToaNha : 'N/A'} - Tầng {selectedPhong.tang}
                </p>
              </div>
              <div className="text-left md:text-right">
                <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  {formatCurrency(selectedPhong.giaThue)}
                </div>
                <div className="text-xs md:text-sm text-slate-500">/ tháng</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {/* Thông tin chính */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* Ảnh phòng */}
              {selectedPhong.anhPhong && selectedPhong.anhPhong.length > 0 ? (
                <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                  <CardHeader className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <CardTitle className="text-base md:text-lg bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent">Hình ảnh phòng</CardTitle>
                      <ImageCarousel
                        images={selectedPhong.anhPhong}
                        trigger={
                          <Button variant="outline" size="sm" className="text-xs md:text-sm w-full sm:w-auto">
                            <ZoomIn className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                            Xem toàn màn hình
                          </Button>
                        }
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <div className="space-y-3 md:space-y-4">
                      {/* Hình lớn */}
                      <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={selectedPhong.anhPhong[selectedImageIndex]}
                          alt={`Ảnh phòng ${selectedImageIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Các hình nhỏ */}
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                        {selectedPhong.anhPhong.map((image, index) => (
                          <div 
                            key={index} 
                            className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                              index === selectedImageIndex 
                                ? 'border-blue-500 ring-2 ring-blue-200' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedImageIndex(index)}
                          >
                            <img
                              src={image}
                              alt={`Ảnh phòng ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 p-4 md:p-6">
                    <Home className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mb-4" />
                    <p className="text-sm md:text-base text-gray-500">Chưa có hình ảnh phòng</p>
                  </CardContent>
                </Card>
              )}

              {/* Mô tả */}
              {selectedPhong.moTa && (
                <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-base md:text-lg bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent">Mô tả</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap">{selectedPhong.moTa}</p>
                  </CardContent>
                </Card>
              )}

              {/* Tiện nghi */}
              {selectedPhong.tienNghi && selectedPhong.tienNghi.length > 0 && (
                <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-base md:text-lg bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent">Tiện nghi</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                      {selectedPhong.tienNghi.map((tienNghi) => (
                        <div key={tienNghi} className="flex items-center space-x-2">
                          <Star className="h-3 w-3 md:h-4 md:w-4 text-yellow-500 flex-shrink-0" />
                          <span className="text-xs md:text-sm truncate">{tienNghiLabels[tienNghi as keyof typeof tienNghiLabels] || tienNghi}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Thông tin chi tiết */}
            <div className="space-y-4 md:space-y-6">
              <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent">Thông tin phòng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Mã phòng:</span>
                    <span className="font-medium">{selectedPhong.maPhong}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Tòa nhà:</span>
                    <span className="font-medium truncate ml-2">
                      {typeof selectedPhong.toaNha === 'object' ? (selectedPhong.toaNha as any).tenToaNha : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Tầng:</span>
                    <span className="font-medium">{selectedPhong.tang}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Diện tích:</span>
                    <span className="font-medium">{selectedPhong.dienTich} m²</span>
                  </div>
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Số người tối đa:</span>
                    <span className="font-medium">{selectedPhong.soNguoiToiDa} người</span>
                  </div>
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Trạng thái:</span>
                    {getTrangThaiBadge(selectedPhong.trangThai)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50/80 to-green-100/80 backdrop-blur-sm">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">Giá thuê</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-gray-600">Giá thuê:</span>
                    <span className="font-bold text-base md:text-lg text-green-600">
                      {formatCurrency(selectedPhong.giaThue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-gray-600">Tiền cọc:</span>
                    <span className="text-sm md:text-base font-medium">
                      {formatCurrency(selectedPhong.tienCoc)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {selectedPhong.trangThai === 'trong' && (
                <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50/80 to-emerald-100/80 backdrop-blur-sm">
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-base md:text-lg bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">Liên hệ thuê phòng</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
                    <p className="text-xs md:text-sm text-slate-600">
                      Phòng này hiện đang trống và có thể cho thuê. Vui lòng liên hệ để biết thêm thông tin.
                    </p>
                    <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300" size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Liên hệ ngay
                    </Button>
                  </CardContent>
                </Card>
              )}

              {selectedPhong.trangThai === 'dangThue' && (
                <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50/80 to-amber-100/80 backdrop-blur-sm">
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-base md:text-lg bg-gradient-to-r from-orange-700 to-amber-600 bg-clip-text text-transparent">Trạng thái phòng</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm md:text-base font-medium text-orange-600">Đang cho thuê</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600">
                      Phòng này hiện đang được cho thuê. Bạn có thể xem thông tin chi tiết và hình ảnh phòng.
                    </p>
                  </CardContent>
                </Card>
              )}

              {selectedPhong.trangThai === 'daDat' && (
                <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50/80 to-sky-100/80 backdrop-blur-sm">
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-base md:text-lg bg-gradient-to-r from-blue-700 to-sky-600 bg-clip-text text-transparent">Trạng thái phòng</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm md:text-base font-medium text-blue-600">Đã được đặt</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600">
                      Phòng này đã được đặt trước. Bạn có thể xem thông tin chi tiết và hình ảnh phòng.
                    </p>
                  </CardContent>
                </Card>
              )}

              {selectedPhong.trangThai === 'baoTri' && (
                <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50/80 to-rose-100/80 backdrop-blur-sm">
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-base md:text-lg bg-gradient-to-r from-red-700 to-rose-600 bg-clip-text text-transparent">Trạng thái phòng</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm md:text-base font-medium text-red-600">Đang bảo trì</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600">
                      Phòng này hiện đang được bảo trì và chưa thể cho thuê.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative">
      {/* Polka dot background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, #6366f1 2px, transparent 2px)',
          backgroundSize: '30px 30px'
        }}></div>
      </div>
      
      <div className="relative container mx-auto px-4 py-4 md:py-8">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-800 via-purple-700 to-cyan-700 bg-clip-text text-transparent">
                Danh sách phòng cho thuê
              </h1>
              <p className="text-xs md:text-sm text-slate-600">Tìm phòng phù hợp với nhu cầu của bạn</p>
            </div>
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Về trang chủ
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="relative">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-cyan-500/5 rounded-3xl blur-xl"></div>
            
            <Card className="relative border-0 shadow-2xl bg-white/95 backdrop-blur-md overflow-hidden">
              {/* Gradient border effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl p-[1px]">
                <div className="w-full h-full bg-white/95 backdrop-blur-md rounded-3xl"></div>
              </div>
              
              <div className="relative p-6 md:p-8">
                {/* Header with icon */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Search className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-700 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                      Tìm kiếm phòng
                    </h2>
                    <p className="text-xs md:text-sm text-slate-500">Tìm phòng phù hợp với nhu cầu của bạn</p>
                  </div>
                </div>

                {/* Search and filter grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {/* Search input */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tìm kiếm</label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300" />
                        <Input
                          placeholder="Nhập mã phòng, mô tả..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-12 pr-4 py-3 h-12 text-sm border-0 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/20 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Building filter */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tòa nhà</label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative">
                        <Select value={selectedToaNha} onValueChange={setSelectedToaNha}>
                          <SelectTrigger className="h-12 text-sm border-0 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/20 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg">
                            <SelectValue placeholder="Chọn tòa nhà" />
                          </SelectTrigger>
                          <SelectContent className="border-0 shadow-xl rounded-xl bg-white/95 backdrop-blur-md">
                            <SelectItem value="all" className="text-sm hover:bg-slate-50">Tất cả tòa nhà</SelectItem>
                            {toaNhaList.map((toaNha) => (
                              <SelectItem key={toaNha._id} value={toaNha._id!} className="text-sm hover:bg-slate-50">
                                {toaNha.tenToaNha}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Status filter */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Trạng thái</label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative">
                        <Select value={selectedTrangThai} onValueChange={setSelectedTrangThai}>
                          <SelectTrigger className="h-12 text-sm border-0 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/20 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg">
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                          <SelectContent className="border-0 shadow-xl rounded-xl bg-white/95 backdrop-blur-md">
                            <SelectItem value="all" className="text-sm hover:bg-slate-50">Tất cả trạng thái</SelectItem>
                            <SelectItem value="trong" className="text-sm hover:bg-emerald-50 text-emerald-700">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                Trống
                              </div>
                            </SelectItem>
                            <SelectItem value="daDat" className="text-sm hover:bg-blue-50 text-blue-700">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                Đã đặt
                              </div>
                            </SelectItem>
                            <SelectItem value="dangThue" className="text-sm hover:bg-orange-50 text-orange-700">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                Đang thuê
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Results summary */}
                <div className="mt-6 pt-6 border-t border-slate-200/50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                      Hiển thị <span className="font-semibold text-slate-800">{filteredPhong.length}</span> trong <span className="font-semibold text-slate-800">{phongList.length}</span> phòng
                    </p>
                    {(searchTerm || selectedToaNha || selectedTrangThai) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedToaNha('');
                          setSelectedTrangThai('');
                        }}
                        className="text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                      >
                        Xóa bộ lọc
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-4 md:mb-8">
          <Card className="p-3 md:p-4 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] md:text-xs font-medium text-indigo-600">Tổng số phòng</p>
                <p className="text-base md:text-2xl font-bold text-indigo-800">{phongList.length}</p>
              </div>
              <Home className="h-3 w-3 md:h-4 md:w-4 text-indigo-500" />
            </div>
          </Card>

          <Card className="p-3 md:p-4 border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] md:text-xs font-medium text-emerald-600">Phòng trống</p>
                <p className="text-base md:text-2xl font-bold text-emerald-700">
                  {phongList.filter(p => p.trangThai === 'trong').length}
                </p>
              </div>
              <Users className="h-3 w-3 md:h-4 md:w-4 text-emerald-500" />
            </div>
          </Card>

          <Card className="p-3 md:p-4 border-0 shadow-lg bg-gradient-to-br from-sky-50 to-blue-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] md:text-xs font-medium text-sky-600">Đang thuê</p>
                <p className="text-base md:text-2xl font-bold text-sky-700">
                  {phongList.filter(p => p.trangThai === 'dangThue').length}
                </p>
              </div>
              <Users className="h-3 w-3 md:h-4 md:w-4 text-sky-500" />
            </div>
          </Card>

          <Card className="p-3 md:p-4 border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] md:text-xs font-medium text-amber-600">Đã đặt</p>
                <p className="text-base md:text-2xl font-bold text-amber-700">
                  {phongList.filter(p => p.trangThai === 'daDat').length}
                </p>
              </div>
              <Users className="h-3 w-3 md:h-4 md:w-4 text-amber-500" />
            </div>
          </Card>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredPhong.map((phong) => (
            <Card key={phong._id} className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer bg-white/90 backdrop-blur-sm hover:scale-[1.02] hover:bg-white/95">
              <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                {phong.anhPhong && phong.anhPhong.length > 0 ? (
                  <>
                    <img
                      src={phong.anhPhong[0]}
                      alt={`Phòng ${phong.maPhong}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <ImageCarousel
                      images={phong.anhPhong}
                      className="opacity-0 group-hover:opacity-100 transition-all duration-300"
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="h-12 w-12 md:h-16 md:w-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  {getTrangThaiBadge(phong.trangThai)}
                </div>
              </div>
              
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-base md:text-lg">
                  <span className="bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-transparent">Phòng {phong.maPhong}</span>
                  <span className="text-base md:text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    {formatCurrency(phong.giaThue)}
                  </span>
                </CardTitle>
                <CardDescription className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm">
                  <span className="flex items-center">
                    <MapPin className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{typeof phong.toaNha === 'object' ? (phong.toaNha as any).tenToaNha : 'N/A'}</span>
                  </span>
                  <span className="flex items-center">
                    <Square className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
                    {phong.dienTich}m²
                  </span>
                  <span className="flex items-center">
                    <Users className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
                    {phong.soNguoiToiDa} người
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 md:p-6">
                {phong.moTa && (
                  <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 line-clamp-2">
                    {phong.moTa}
                  </p>
                )}
                
                {phong.tienNghi && phong.tienNghi.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3 md:mb-4">
                    {phong.tienNghi.slice(0, 3).map((tienNghi) => (
                      <Badge key={tienNghi} variant="outline" className="text-[10px] md:text-xs">
                        {tienNghiLabels[tienNghi as keyof typeof tienNghiLabels] || tienNghi}
                      </Badge>
                    ))}
                    {phong.tienNghi.length > 3 && (
                      <Badge variant="outline" className="text-[10px] md:text-xs">
                        +{phong.tienNghi.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <Button 
                  size="sm"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group" 
                  onClick={() => {
                    setSelectedPhong(phong);
                    setShowDetails(true);
                  }}
                >
                  <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Xem chi tiết
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPhong.length === 0 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12 p-4 md:p-6">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                <Home className="h-10 w-10 md:h-12 md:w-12 text-indigo-500" />
              </div>
              <h3 className="text-base md:text-lg font-medium bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-transparent mb-2">
                Không tìm thấy phòng nào
              </h3>
              <p className="text-xs md:text-sm text-slate-500 text-center">
                Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
