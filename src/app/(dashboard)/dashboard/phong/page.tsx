'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Home, 
  MapPin,
  Users,
  Eye,
  ExternalLink,
  Copy,
  Info,
  Image,
  RefreshCw
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Phong, ToaNha } from '@/types';
import { PhongDataTable } from './table';
import { PhongImageUpload } from '@/components/ui/phong-image-upload';
import { DeleteConfirmPopover } from '@/components/ui/delete-confirm-popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useDeletePhongMutation } from '@/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';
import { useData } from '@/hooks/use-data';
import { Skeleton } from '@/components/ui/skeleton';

export default function PhongPage() {
  const queryClient = useQueryClient();
  
  // Use single data load
  const { phong: phongList, toaNha: toaNhaList, loading, refetch } = useData();
  
  const deletePhongMutation = useDeletePhongMutation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedToaNha, setSelectedToaNha] = useState('');
  const [selectedTrangThai, setSelectedTrangThai] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPhong, setEditingPhong] = useState<Phong | null>(null);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [viewingImages, setViewingImages] = useState<string[]>([]);
  const [viewingPhongName, setViewingPhongName] = useState('');
  const [isTenantsViewerOpen, setIsTenantsViewerOpen] = useState(false);
  const [viewingTenants, setViewingTenants] = useState<any[]>([]);
  const [viewingTenantsPhongName, setViewingTenantsPhongName] = useState('');

  useEffect(() => {
    document.title = 'Quản lý Phòng';
  }, []);

  const handleRefresh = async () => {
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['app-data'] });
    toast.success('Đã tải dữ liệu mới nhất');
  };

  const filteredPhong = phongList.filter(phong =>
    phong.maPhong.toLowerCase().includes(searchTerm.toLowerCase()) ||
    phong.moTa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (phong: Phong) => {
    setEditingPhong(phong);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePhongMutation.mutateAsync(id);
          toast.success('Xóa phòng thành công!');
    } catch (error) {
      console.error('Error deleting phong:', error);
      toast.error('Có lỗi xảy ra khi xóa phòng');
    }
  };

  const handleViewImages = (phong: Phong) => {
    if (phong.anhPhong && phong.anhPhong.length > 0) {
      setViewingImages(phong.anhPhong);
      setViewingPhongName(phong.maPhong);
      setIsImageViewerOpen(true);
    } else {
      toast.info('Phòng này chưa có ảnh nào');
    }
  };

  const handleViewTenants = (phong: Phong) => {
    const phongData = phong as any;
    const hopDong = phongData.hopDongHienTai;
    
    if (hopDong && hopDong.khachThueId && hopDong.khachThueId.length > 0) {
      setViewingTenants(hopDong.khachThueId);
      setViewingTenantsPhongName(phong.maPhong);
      setIsTenantsViewerOpen(true);
    } else {
      toast.info('Phòng này chưa có người thuê');
    }
  };


  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Quản lý phòng</h1>
          <p className="text-xs md:text-sm text-gray-600">Danh sách tất cả phòng trong hệ thống</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Đang tải...' : 'Tải mới'}
          </Button>
     
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditingPhong(null)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Thêm phòng
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw] md:w-full">
              <DialogHeader>
                <DialogTitle className="text-base md:text-lg">
                  {editingPhong ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
                </DialogTitle>
                <DialogDescription className="text-xs md:text-sm">
                  {editingPhong ? 'Cập nhật thông tin phòng' : 'Nhập thông tin phòng mới'}
                </DialogDescription>
              </DialogHeader>
              
              <PhongForm 
                phong={editingPhong}
                toaNhaList={toaNhaList}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['phong'] });
                  setIsDialogOpen(false);
                  toast.success(editingPhong ? 'Cập nhật phòng thành công!' : 'Thêm phòng thành công!');
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        <Card className="p-2 md:p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Tổng số phòng</p>
              <p className="text-lg md:text-xl font-bold">{phongList.length}</p>
            </div>
            <Home className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
          </div>
        </Card>

        <Card className="p-2 md:p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Phòng trống</p>
              <p className="text-lg md:text-xl font-bold text-green-600">
                {phongList.filter(p => p.trangThai === 'trong').length}
              </p>
            </div>
            <Users className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
          </div>
        </Card>

        <Card className="p-2 md:p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Đang thuê</p>
              <p className="text-lg md:text-xl font-bold text-blue-600">
                {phongList.filter(p => p.trangThai === 'dangThue').length}
              </p>
            </div>
            <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
          </div>
        </Card>

        <Card className="p-2 md:p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Bảo trì</p>
              <p className="text-lg md:text-xl font-bold text-red-600">
                {phongList.filter(p => p.trangThai === 'baoTri').length}
              </p>
            </div>
            <Users className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Danh sách phòng</CardTitle>
          <CardDescription>
            {filteredPhong.length} phòng được tìm thấy
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <PhongDataTable 
            data={filteredPhong}
            toaNhaList={toaNhaList}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewImages={handleViewImages}
            onViewTenants={handleViewTenants}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedToaNha={selectedToaNha}
            onToaNhaChange={setSelectedToaNha}
            selectedTrangThai={selectedTrangThai}
            onTrangThaiChange={setSelectedTrangThai}
            allToaNhaList={toaNhaList}
          />
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-semibold">Danh sách phòng</h2>
          <span className="text-xs text-gray-600">{filteredPhong.length} phòng</span>
        </div>

        {/* Mobile Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={selectedToaNha} onValueChange={setSelectedToaNha}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Tòa nhà" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm">Tất cả tòa nhà</SelectItem>
                {toaNhaList.map((toaNha) => (
                  <SelectItem key={toaNha._id} value={toaNha._id!} className="text-sm">
                    {toaNha.tenToaNha}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTrangThai} onValueChange={setSelectedTrangThai}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm">Tất cả</SelectItem>
                <SelectItem value="trong" className="text-sm">Trống</SelectItem>
                <SelectItem value="daDat" className="text-sm">Đã đặt</SelectItem>
                <SelectItem value="dangThue" className="text-sm">Đang thuê</SelectItem>
                <SelectItem value="baoTri" className="text-sm">Bảo trì</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {filteredPhong.length === 0 ? (
          <Card className="p-6 text-center">
            <Home className="h-10 w-10 mx-auto text-gray-400 mb-3" />
            <h3 className="text-base font-medium text-gray-900 mb-1">Không tìm thấy phòng nào</h3>
            <p className="text-sm text-gray-600">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredPhong.map((phong) => {
              const getTrangThaiColor = (trangThai: string) => {
                switch (trangThai) {
                  case 'trong': return 'bg-green-100 text-green-800';
                  case 'daDat': return 'bg-yellow-100 text-yellow-800';
                  case 'dangThue': return 'bg-blue-100 text-blue-800';
                  case 'baoTri': return 'bg-red-100 text-red-800';
                  default: return 'bg-gray-100 text-gray-800';
                }
              };

              const getTrangThaiText = (trangThai: string) => {
                switch (trangThai) {
                  case 'trong': return 'Trống';
                  case 'daDat': return 'Đã đặt';
                  case 'dangThue': return 'Đang thuê';
                  case 'baoTri': return 'Bảo trì';
                  default: return trangThai;
                }
              };

              return (
                <Card key={phong._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">{phong.maPhong}</h3>
                        <p className="text-xs text-gray-600">Tầng {phong.tang} • {phong.dienTich}m²</p>
                      </div>
                      <Badge className={`${getTrangThaiColor(phong.trangThai)} text-xs`}>
                        {getTrangThaiText(phong.trangThai)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1.5 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Giá thuê:</span>
                        <span className="font-semibold text-green-600">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(phong.giaThue)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tiền cọc:</span>
                        <span className="font-medium text-orange-600">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(phong.tienCoc)}
                        </span>
                      </div>
                    </div>

                    {/* Thông tin người thuê */}
                    {(() => {
                      const phongData = phong as any;
                      const hopDong = phongData.hopDongHienTai;
                      
                      if (hopDong && hopDong.khachThueId && hopDong.khachThueId.length > 0) {
                        const nguoiDaiDien = hopDong.nguoiDaiDien;
                        const soLuongKhachThue = hopDong.khachThueId.length;
                        
                        return (
                          <div className="mb-3 p-2 bg-blue-50 rounded-md border border-blue-200">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Users className="h-3.5 w-3.5 text-blue-600" />
                              <span className="text-xs font-medium text-blue-900">Người thuê</span>
                            </div>
                            <div className="text-sm text-gray-900 font-medium">
                              {nguoiDaiDien?.hoTen || 'N/A'}
                            </div>
                            {nguoiDaiDien?.soDienThoai && (
                              <div className="text-xs text-gray-600">
                                {nguoiDaiDien.soDienThoai}
                              </div>
                            )}
                            {soLuongKhachThue > 1 && (
                              <Button
                                variant="link"
                                size="sm"
                                className="text-xs text-blue-600 hover:text-blue-700 h-auto p-0 mt-0.5"
                                onClick={() => handleViewTenants(phong)}
                              >
                                +{soLuongKhachThue - 1} người khác
                              </Button>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {phong.anhPhong && phong.anhPhong.length > 0 && (
                      <div className="mb-3">
                        <img 
                          src={phong.anhPhong[0]} 
                          alt={phong.maPhong}
                          className="w-full h-32 object-cover rounded-md"
                          onClick={() => handleViewImages(phong)}
                        />
                        {phong.anhPhong.length > 1 && (
                          <div className="text-xs text-gray-600 mt-1">
                            +{phong.anhPhong.length - 1} ảnh khác
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        {phong.anhPhong && phong.anhPhong.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewImages(phong)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Xem ảnh phòng"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const publicUrl = `${window.location.origin}/xem-phong`;
                            navigator.clipboard.writeText(publicUrl);
                            toast.success('Đã sao chép link trang xem phòng');
                          }}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Copy link trang xem phòng"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(phong)}
                          className="flex-1 text-xs"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Sửa
                        </Button>
                        <DeleteConfirmPopover
                          onConfirm={() => handleDelete(phong._id!)}
                          title="Xóa phòng"
                          description="Bạn có chắc chắn muốn xóa phòng này?"
                          className="text-black hover:text-red-700 hover:bg-red-50"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Image Viewer Dialog */}
      <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden w-[95vw] md:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
              <Image className="h-4 w-4 md:h-5 md:w-5" />
              Ảnh phòng {viewingPhongName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            {viewingImages.length > 0 && (
              <Carousel className="w-full">
                <CarouselContent>
                  {viewingImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="flex items-center justify-center p-1 md:p-2">
                        <img
                          src={image}
                          alt={`Ảnh ${index + 1} của phòng ${viewingPhongName}`}
                          className="max-h-[50vh] md:max-h-[60vh] w-auto object-contain rounded-lg"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {viewingImages.length > 1 && (
                  <>
                    <CarouselPrevious className="hidden md:flex" />
                    <CarouselNext className="hidden md:flex" />
                  </>
                )}
              </Carousel>
            )}
          </div>
          
          <DialogFooter>
            <div className="text-xs md:text-sm text-gray-600">
              {viewingImages.length} ảnh {viewingImages.length > 1 && '- Vuốt để xem thêm'}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tenants Viewer Dialog */}
      <Dialog open={isTenantsViewerOpen} onOpenChange={setIsTenantsViewerOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto w-[95vw] md:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
              <Users className="h-4 w-4 md:h-5 md:w-5" />
              Danh sách người thuê - Phòng {viewingTenantsPhongName}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Tổng cộng {viewingTenants.length} người đang thuê phòng này
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 md:space-y-4 py-2 md:py-4">
            {viewingTenants.map((tenant, index) => (
              <Card key={tenant._id || index} className="overflow-hidden">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 md:mb-2">
                        <h3 className="text-base md:text-lg font-semibold text-gray-900">
                          {tenant.hoTen}
                        </h3>
                        <Badge variant="outline" className="ml-2 text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-600">SĐT:</span>
                          <span className="text-gray-900">{tenant.soDienThoai}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTenantsViewerOpen(false)} className="text-sm">
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Form component for adding/editing phong
function PhongForm({ 
  phong, 
  toaNhaList,
  onClose, 
  onSuccess 
}: { 
  phong: Phong | null;
  toaNhaList: ToaNha[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  // Helper function để lấy toaNha ID
  const getToaNhaId = (toaNha: string | { _id: string }) => {
    if (typeof toaNha === 'object' && toaNha !== null) {
      return toaNha._id || '';
    } else if (typeof toaNha === 'string') {
      return toaNha;
    }
    return '';
  };

  const [formData, setFormData] = useState({
    maPhong: phong?.maPhong || '',
    toaNha: phong?.toaNha ? getToaNhaId(phong.toaNha) : '',
    tang: phong?.tang || 1,
    dienTich: phong?.dienTich || 0,
    giaThue: phong?.giaThue || 0,
    tienCoc: phong?.tienCoc || 0,
    moTa: phong?.moTa || '',
    anhPhong: [] as string[], // URLs từ server (khi edit)
    tienNghi: phong?.tienNghi || [],
    soNguoiToiDa: phong?.soNguoiToiDa || 1,
    trangThai: phong?.trangThai || 'trong',
  });

  // Separate state for new files to upload
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  // Cập nhật formData khi phong thay đổi
  useEffect(() => {
    if (phong) {
      const toaNhaId = getToaNhaId(phong.toaNha);
      
      console.log('Editing phong:', phong);
      console.log('toaNha object:', phong.toaNha);
      console.log('toaNha ID:', toaNhaId);
      
      setFormData({
        maPhong: phong.maPhong || '',
        toaNha: toaNhaId,
        tang: phong.tang || 1,
        dienTich: phong.dienTich || 0,
        giaThue: phong.giaThue || 0,
        tienCoc: phong.tienCoc || 0,
        moTa: phong.moTa || '',
        anhPhong: phong.anhPhong || [], // Existing URLs
        tienNghi: phong.tienNghi || [],
        soNguoiToiDa: phong.soNguoiToiDa || 1,
        trangThai: phong.trangThai || 'trong',
      });
      setNewImageFiles([]); // Reset new files when editing
    } else {
      setFormData({
        maPhong: '',
        toaNha: '',
        tang: 1,
        dienTich: 0,
        giaThue: 0,
        tienCoc: 0,
        moTa: '',
        anhPhong: [], // No existing URLs for new phong
        tienNghi: [],
        soNguoiToiDa: 1,
        trangThai: 'trong',
      });
    }
  }, [phong]);

  // Function format tiền
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const tienNghiOptions = [
    { value: 'dieuhoa', label: 'Điều hòa' },
    { value: 'nonglanh', label: 'Nóng lạnh' },
    { value: 'tulanh', label: 'Tủ lạnh' },
    { value: 'giuong', label: 'Giường' },
    { value: 'tuquanao', label: 'Tủ quần áo' },
    { value: 'banlamviec', label: 'Bàn làm việc' },
    { value: 'ghe', label: 'Ghế' },
    { value: 'tivi', label: 'TV' },
    { value: 'wifi', label: 'WiFi' },
    { value: 'maygiat', label: 'Máy giặt' },
    { value: 'bep', label: 'Bếp' },
    { value: 'noi', label: 'Nồi' },
    { value: 'chen', label: 'Chén' },
    { value: 'bat', label: 'Bát' },
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Step 1: Upload new image files to Cloudinary
      let uploadedImageUrls: string[] = [];
      
      if (newImageFiles.length > 0) {
        toast.info(`Đang upload ${newImageFiles.length} ảnh...`);
        
        const uploadPromises = newImageFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/upload?type=ROOM', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || 'Lỗi upload ảnh');
          }

          // Handle both single object and array response
          if (Array.isArray(result.data)) {
            return result.data[0]?.secure_url || result.data[0]?.url;
          }
          return result.data?.secure_url || result.data?.url;
        });

        uploadedImageUrls = await Promise.all(uploadPromises);
        toast.success(`Upload ${uploadedImageUrls.length} ảnh thành công!`);
      }

      // Step 2: Merge existing URLs with newly uploaded URLs
      const allImageUrls = [...formData.anhPhong, ...uploadedImageUrls];

      // Step 3: Submit form with all image URLs
      const url = phong ? `/api/phong/${phong._id}` : '/api/phong';
      const method = phong ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        anhPhong: allImageUrls,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

        const result = await response.json();

      if (response.ok && result.success) {
          onSuccess();
        } else {
          toast.error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi gửi form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTienNghiChange = (tienNghi: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      tienNghi: checked 
        ? [...prev.tienNghi, tienNghi]
        : prev.tienNghi.filter(t => t !== tienNghi)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <Tabs defaultValue="thong-tin" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="thong-tin" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Info className="h-3 w-3 md:h-4 md:w-4" />
            Thông tin
          </TabsTrigger>
          <TabsTrigger value="anh-phong" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Image className="h-3 w-3 md:h-4 md:w-4" />
            Ảnh phòng
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="thong-tin" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
          {/* Thông tin cơ bản */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="maPhong" className="text-sm">Mã phòng</Label>
              <Input
                id="maPhong"
                value={formData.maPhong}
                onChange={(e) => setFormData(prev => ({ ...prev, maPhong: e.target.value.toUpperCase() }))}
                required
                className="text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="toaNha" className="text-sm">Tòa nhà</Label>
              <Select value={formData.toaNha} onValueChange={(value) => setFormData(prev => ({ ...prev, toaNha: value }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Chọn tòa nhà" />
                </SelectTrigger>
                <SelectContent>
                  {toaNhaList.map((toaNha) => (
                    <SelectItem key={toaNha._id} value={toaNha._id!} className="text-sm">
                      {toaNha.tenToaNha}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trangThai" className="text-sm">Trạng thái</Label>
              <Select value={formData.trangThai} onValueChange={(value) => setFormData(prev => ({ ...prev, trangThai: value as 'trong' | 'daDat' | 'dangThue' | 'baoTri' }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trong" className="text-sm">Trống</SelectItem>
                  <SelectItem value="daDat" className="text-sm">Đã đặt</SelectItem>
                  <SelectItem value="dangThue" className="text-sm">Đang thuê</SelectItem>
                  <SelectItem value="baoTri" className="text-sm">Bảo trì</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Thông tin phòng */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="tang" className="text-sm">Tầng</Label>
              <Input
                id="tang"
                type="number"
                min="0"
                value={formData.tang}
                onChange={(e) => setFormData(prev => ({ ...prev, tang: parseInt(e.target.value) || 0 }))}
                required
                className="text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dienTich" className="text-sm">Diện tích (m²)</Label>
              <Input
                id="dienTich"
                type="number"
                min="1"
                value={formData.dienTich}
                onChange={(e) => setFormData(prev => ({ ...prev, dienTich: parseInt(e.target.value) || 0 }))}
                required
                className="text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="soNguoiToiDa" className="text-sm">Số người tối đa</Label>
              <Input
                id="soNguoiToiDa"
                type="number"
                min="1"
                max="10"
                value={formData.soNguoiToiDa}
                onChange={(e) => setFormData(prev => ({ ...prev, soNguoiToiDa: parseInt(e.target.value) || 1 }))}
                required
                className="text-sm"
              />
            </div>

            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label className="text-sm">Preview</Label>
              <div className="h-10 bg-gray-50 border rounded-md flex items-center justify-center text-xs md:text-sm text-gray-500">
                Phòng {formData.maPhong || 'XXX'} - Tầng {formData.tang}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="giaThue" className="text-sm">Giá thuê (VNĐ)</Label>
              <Input
                id="giaThue"
                type="number"
                min="0"
                value={formData.giaThue}
                onChange={(e) => setFormData(prev => ({ ...prev, giaThue: parseInt(e.target.value) || 0 }))}
                required
                className="text-sm"
              />
              <span className="text-xs md:text-sm text-gray-500 font-medium">
                {formatCurrency(formData.giaThue)}
              </span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tienCoc" className="text-sm">Tiền cọc (VNĐ)</Label>
              <Input
                id="tienCoc"
                type="number"
                min="0"
                value={formData.tienCoc}
                onChange={(e) => setFormData(prev => ({ ...prev, tienCoc: parseInt(e.target.value) || 0 }))}
                required
                className="text-sm"
              />
              <span className="text-xs md:text-sm text-gray-500 font-medium">
                {formatCurrency(formData.tienCoc)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="moTa" className="text-sm">Mô tả</Label>
            <Textarea
              id="moTa"
              value={formData.moTa}
              onChange={(e) => setFormData(prev => ({ ...prev, moTa: e.target.value }))}
              rows={3}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Tiện nghi</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
              {tienNghiOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={option.value}
                    checked={formData.tienNghi.includes(option.value)}
                    onChange={(e) => handleTienNghiChange(option.value, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={option.value} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="anh-phong" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
          <div className="space-y-3 md:space-y-4">
            <div>
              <h3 className="text-base md:text-lg font-medium mb-1 md:mb-2">Quản lý ảnh phòng</h3>
              <p className="text-xs md:text-sm text-gray-600">
                Tải lên tối đa 10 ảnh để khách hàng có thể xem chi tiết phòng
              </p>
            </div>
            
            <PhongImageUpload
              images={newImageFiles}
              onImagesChange={setNewImageFiles}
              maxImages={10}
              className="w-full"
            />
            {/* Show existing images when editing */}
            {phong && formData.anhPhong.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Ảnh hiện có:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {formData.anhPhong.map((imageUrl, index) => (
                    <Card key={index} className="relative">
                      <CardContent className="p-2">
                        <div className="relative aspect-square rounded-md overflow-hidden bg-gray-100">
                          <img
                            src={imageUrl}
                            alt={`Ảnh ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter className="gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose} 
          disabled={isSubmitting}
          className="text-sm"
        >
          Hủy
        </Button>
        <Button 
          type="submit" 
          loading={isSubmitting}
          disabled={isSubmitting}
          className="text-sm"
        >
          {phong ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </DialogFooter>
    </form>
  );
}