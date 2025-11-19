'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  AlertTriangle, 
  Calendar,
  Users,
  Eye,
  Filter,
  CheckCircle,
  Clock,
  RefreshCw,
  Home,
  Wrench
} from 'lucide-react';
import { toast } from 'sonner';
import { SuCo, Phong, KhachThue, HopDong } from '@/types';
import { SuCoImageUpload } from '@/components/ui/su-co-image-upload';
import { DeleteConfirmPopover } from '@/components/ui/delete-confirm-popover';
import { SuCoDataTable } from './table';
import { 
  useDeleteSuCoMutation,
  useUpdateSuCoMutation
} from '@/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';
import { useData } from '@/hooks/use-data';

export default function SuCoPage() {
  const queryClient = useQueryClient();
  
  // Use single data load
  const { suCo: suCoList, phong: phongList, khachThue: khachThueList, hopDong: hopDongList, loading, refetch } = useData();
  
  const deleteSuCoMutation = useDeleteSuCoMutation();
  const updateSuCoMutation = useUpdateSuCoMutation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSuCo, setEditingSuCo] = useState<SuCo | null>(null);

  useEffect(() => {
    document.title = 'Quản lý Sự cố';
  }, []);

  const handleRefresh = async () => {
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['app-data'] });
    toast.success('Đã tải dữ liệu mới nhất');
  };

  const filteredSuCo = suCoList.filter(suCo => {
    const matchesSearch = suCo.tieuDe.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         suCo.moTa.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || suCo.trangThai === statusFilter;
    const matchesType = typeFilter === 'all' || suCo.loaiSuCo === typeFilter;
    const matchesPriority = priorityFilter === 'all' || suCo.mucDoUuTien === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'moi':
        return <Badge variant="destructive">Mới</Badge>;
      case 'dangXuLy':
        return <Badge variant="secondary">Đang xử lý</Badge>;
      case 'daXong':
        return <Badge variant="default">Đã xong</Badge>;
      case 'daHuy':
        return <Badge variant="outline">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'dienNuoc':
        return <Badge variant="secondary">Điện nước</Badge>;
      case 'noiThat':
        return <Badge variant="outline">Nội thất</Badge>;
      case 'vesinh':
        return <Badge variant="outline">Vệ sinh</Badge>;
      case 'anNinh':
        return <Badge variant="outline">An ninh</Badge>;
      case 'khac':
        return <Badge variant="outline">Khác</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'thap':
        return <Badge variant="outline">Thấp</Badge>;
      case 'trungBinh':
        return <Badge variant="secondary">Trung bình</Badge>;
      case 'cao':
        return <Badge variant="destructive">Cao</Badge>;
      case 'khancap':
        return <Badge variant="destructive">Khẩn cấp</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getPhongName = (phong: string | { maPhong: string }) => {
    if (typeof phong === 'string') {
      const phongObj = phongList.find(p => p._id === phong);
      return phongObj?.maPhong || 'Không xác định';
    }
    return phong?.maPhong || 'Không xác định';
  };

  const getKhachThueName = (khachThue: string | { hoTen: string }) => {
    if (typeof khachThue === 'string') {
      const khachThueObj = khachThueList.find(k => k._id === khachThue);
      return khachThueObj?.hoTen || 'Không xác định';
    }
    return khachThue?.hoTen || 'Không xác định';
  };

  const handleEdit = (suCo: SuCo) => {
    setEditingSuCo(suCo);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSuCoMutation.mutateAsync(id);
      toast.success('Xóa sự cố thành công');
    } catch (error) {
      console.error('Error deleting su co:', error);
      toast.error('Có lỗi xảy ra khi xóa sự cố');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateSuCoMutation.mutateAsync({
        id,
        data: { trangThai: newStatus as any },
      });
      toast.success('Cập nhật trạng thái thành công');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái');
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Quản lý sự cố</h1>
          <p className="text-xs md:text-sm text-gray-600">Theo dõi và xử lý các sự cố từ khách thuê</p>
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditingSuCo(null)} className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Báo cáo sự cố</span>
                <span className="sm:hidden">Báo cáo</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="w-[95vw] md:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSuCo ? 'Chỉnh sửa sự cố' : 'Báo cáo sự cố mới'}
              </DialogTitle>
              <DialogDescription>
                {editingSuCo ? 'Cập nhật thông tin sự cố' : 'Nhập thông tin sự cố mới'}
              </DialogDescription>
            </DialogHeader>
            
            <SuCoForm 
              suCo={editingSuCo}
              phongList={phongList}
              khachThueList={khachThueList}
              hopDongList={hopDongList}
              getKhachThueName={getKhachThueName}
              onClose={() => setIsDialogOpen(false)}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['su-co'] });
                setIsDialogOpen(false);
                toast.success(editingSuCo ? 'Cập nhật sự cố thành công!' : 'Báo cáo sự cố thành công!');
              }}
            />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 md:gap-4 lg:gap-6">
        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Tổng sự cố</p>
              <p className="text-base md:text-2xl font-bold">{suCoList.length}</p>
            </div>
            <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Mới</p>
              <p className="text-base md:text-2xl font-bold text-red-600">
                {suCoList.filter(s => s.trangThai === 'moi').length}
              </p>
            </div>
            <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Đang xử lý</p>
              <p className="text-base md:text-2xl font-bold text-orange-600">
                {suCoList.filter(s => s.trangThai === 'dangXuLy').length}
              </p>
            </div>
            <Clock className="h-3 w-3 md:h-4 md:w-4 text-orange-600" />
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Đã xong</p>
              <p className="text-base md:text-2xl font-bold text-green-600">
                {suCoList.filter(s => s.trangThai === 'daXong').length}
              </p>
            </div>
            <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Danh sách sự cố</CardTitle>
          <CardDescription>
            {filteredSuCo.length} sự cố được tìm thấy
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <SuCoDataTable
            data={filteredSuCo}
            phongList={phongList}
            khachThueList={khachThueList}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            priorityFilter={priorityFilter}
            onPriorityChange={setPriorityFilter}
          />
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Danh sách sự cố</h2>
          <span className="text-sm text-gray-500">{filteredSuCo.length} sự cố</span>
        </div>
        
        {/* Mobile Filters */}
        <div className="space-y-2 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm sự cố..."
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
                <SelectItem value="moi" className="text-sm">Mới</SelectItem>
                <SelectItem value="dangXuLy" className="text-sm">Đang xử lý</SelectItem>
                <SelectItem value="daXong" className="text-sm">Đã xong</SelectItem>
                <SelectItem value="daHuy" className="text-sm">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm">Tất cả</SelectItem>
                <SelectItem value="dienNuoc" className="text-sm">Điện nước</SelectItem>
                <SelectItem value="noiThat" className="text-sm">Nội thất</SelectItem>
                <SelectItem value="vesinh" className="text-sm">Vệ sinh</SelectItem>
                <SelectItem value="anNinh" className="text-sm">An ninh</SelectItem>
                <SelectItem value="khac" className="text-sm">Khác</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Ưu tiên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm">Tất cả</SelectItem>
                <SelectItem value="thap" className="text-sm">Thấp</SelectItem>
                <SelectItem value="trungBinh" className="text-sm">Trung bình</SelectItem>
                <SelectItem value="cao" className="text-sm">Cao</SelectItem>
                <SelectItem value="khancap" className="text-sm">Khẩn cấp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile Card List */}
        <div className="space-y-3">
          {filteredSuCo.map((suCo) => {
            const phongInfo = typeof suCo.phong === 'object' ? suCo.phong : phongList.find(p => p._id === suCo.phong);
            const khachThueInfo = typeof suCo.nguoiBaoCao === 'object' ? suCo.nguoiBaoCao : khachThueList.find(k => k._id === suCo.nguoiBaoCao);
            
            return (
              <Card key={suCo._id} className="p-4">
                <div className="space-y-3">
                  {/* Header with title and status */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{suCo.tieuDe}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Home className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600 truncate">
                          {phongInfo?.maPhong || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {getStatusBadge(suCo.trangThai)}
                      {getPriorityBadge(suCo.mucDoUuTien)}
                    </div>
                  </div>

                  {/* Reporter and type info */}
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600 truncate">
                        {khachThueInfo?.hoTen || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wrench className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">{getTypeBadge(suCo.loaiSuCo)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Báo cáo: {new Date(suCo.ngayBaoCao).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="border-t pt-2">
                    <p className="text-xs text-gray-600 line-clamp-2">{suCo.moTa}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(suCo)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(suCo._id!)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredSuCo.length === 0 && (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Không có sự cố nào</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Form component for adding/editing su co
function SuCoForm({ 
  suCo, 
  phongList,
  khachThueList,
  hopDongList,
  getKhachThueName,
  onClose, 
  onSuccess 
}: { 
  suCo: SuCo | null;
  phongList: Phong[];
  khachThueList: KhachThue[];
  hopDongList: any[];
  getKhachThueName: (khachThue: any) => string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    phong: suCo?.phong || '',
    khachThue: suCo?.khachThue || '',
    tieuDe: suCo?.tieuDe || '',
    moTa: suCo?.moTa || '',
    loaiSuCo: suCo?.loaiSuCo || 'dienNuoc',
    mucDoUuTien: suCo?.mucDoUuTien || 'trungBinh',
    trangThai: suCo?.trangThai || 'moi',
    ghiChuXuLy: suCo?.ghiChuXuLy || '',
    anhSuCo: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhong, setSelectedPhong] = useState<any>(null);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]); // New files to upload
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(suCo?.anhSuCo || []); // Existing URLs when editing
  const [originalImageUrls, setOriginalImageUrls] = useState<string[]>(suCo?.anhSuCo || []); // Track original URLs to detect deletions

  // Update existing URLs when suCo changes
  useEffect(() => {
    if (suCo?.anhSuCo) {
      const urls = suCo.anhSuCo || [];
      setExistingImageUrls(urls);
      setOriginalImageUrls(urls);
      setNewImageFiles([]);
    } else {
      setExistingImageUrls([]);
      setOriginalImageUrls([]);
      setNewImageFiles([]);
    }
  }, [suCo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: phải chọn phòng và có khách thuê
    if (!formData.phong) {
      toast.error('Vui lòng chọn phòng');
      return;
    }
    
    if (!formData.khachThue) {
      toast.error('Không tìm thấy khách thuê cho phòng này. Vui lòng kiểm tra hợp đồng.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Step 1: Upload new image files to Cloudinary
      let uploadedImageUrls: string[] = [];
      
      if (newImageFiles.length > 0) {
        toast.info(`Đang upload ${newImageFiles.length} ảnh...`);
        
        const uploadPromises = newImageFiles.map(async (file) => {
          const formDataUpload = new FormData();
          formDataUpload.append('file', file);

          const response = await fetch('/api/upload?type=MAINTENANCE', {
            method: 'POST',
            body: formDataUpload,
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

      // Step 2: Xóa ảnh đã bị xóa trên Cloudinary
      if (suCo && originalImageUrls.length > 0) {
        const deletedUrls = originalImageUrls.filter(url => !existingImageUrls.includes(url));
        if (deletedUrls.length > 0) {
          try {
            toast.info(`Đang xóa ${deletedUrls.length} ảnh cũ trên Cloudinary...`);
            const deleteResponse = await fetch('/api/upload', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ urls: deletedUrls }),
            });
            
            if (deleteResponse.ok) {
              toast.success(`Đã xóa ${deletedUrls.length} ảnh cũ trên Cloudinary`);
            } else {
              console.warn('Failed to delete some images from Cloudinary');
            }
          } catch (deleteError) {
            console.error('Error deleting images from Cloudinary:', deleteError);
            // Không block flow chính nếu xóa Cloudinary thất bại
          }
        }
      }

      // Step 3: Merge existing URLs with newly uploaded URLs
      const allImageUrls = [...existingImageUrls, ...uploadedImageUrls];

      // Step 3: Prepare data for API
      const submitData = {
        ...formData,
        anhSuCo: allImageUrls,
        ngayBaoCao: suCo ? suCo.ngayBaoCao : new Date().toISOString(),
      };

      const url = suCo ? `/api/su-co/${suCo._id}` : '/api/su-co';
      const method = suCo ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(suCo ? 'Cập nhật sự cố thành công' : 'Báo cáo sự cố thành công');
        onSuccess();
      } else {
        console.error('Error submitting form:', result.message);
        toast.error('Có lỗi xảy ra: ' + result.message);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Có lỗi xảy ra khi gửi form');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handlePhongChange = async (phongId: string) => {
    setFormData(prev => ({ ...prev, phong: phongId }));
    
    // Tìm thông tin phòng được chọn
    const phong = phongList.find(p => p._id === phongId);
    setSelectedPhong(phong);
    
    if (phong) {
      // Tìm hợp đồng đang hoạt động cho phòng này
      const hopDongHoatDong = hopDongList.find(hd => 
        hd.phong._id === phongId && hd.trangThai === 'hoatDong'
      );
      
      if (hopDongHoatDong && hopDongHoatDong.nguoiDaiDien) {
        // Lấy người đại diện làm khách thuê chính
        setFormData(prev => ({ ...prev, khachThue: hopDongHoatDong.nguoiDaiDien._id || hopDongHoatDong.nguoiDaiDien }));
      } else {
        // Nếu không tìm thấy hợp đồng hoạt động, reset khách thuê
        setFormData(prev => ({ ...prev, khachThue: '' }));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div className="space-y-2">
          <Label htmlFor="phong" className="text-xs md:text-sm">Phòng</Label>
          <Select value={formData.phong} onValueChange={handlePhongChange}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Chọn phòng" />
            </SelectTrigger>
            <SelectContent>
              {phongList.map((phong) => (
                <SelectItem key={phong._id} value={phong._id!} className="text-sm">
                  {phong.maPhong}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="khachThue" className="text-xs md:text-sm">Khách thuê</Label>
          {formData.khachThue ? (
            <div className="p-3 bg-gray-50 rounded-md border">
              <div className="text-sm font-medium">
                {getKhachThueName(formData.khachThue)}
              </div>
              <div className="text-xs text-gray-500">
                {selectedPhong && `Phòng ${selectedPhong.maPhong}`}
              </div>
              <div className="text-xs text-green-600 mt-1">
                ✓ Tự động lấy từ hợp đồng đang hoạt động
              </div>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 rounded-md border border-yellow-200">
              <div className="text-sm text-yellow-800">
                Vui lòng chọn phòng để tự động lấy thông tin khách thuê
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tieuDe" className="text-xs md:text-sm">Tiêu đề</Label>
        <Input
          id="tieuDe"
          value={formData.tieuDe}
          onChange={(e) => setFormData(prev => ({ ...prev, tieuDe: e.target.value }))}
          placeholder="Nhập tiêu đề sự cố"
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="moTa" className="text-xs md:text-sm">Mô tả chi tiết</Label>
        <Textarea
          id="moTa"
          value={formData.moTa}
          onChange={(e) => setFormData(prev => ({ ...prev, moTa: e.target.value }))}
          rows={4}
          placeholder="Mô tả chi tiết về sự cố..."
          required
          className="text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div className="space-y-2">
          <Label htmlFor="loaiSuCo" className="text-xs md:text-sm">Loại sự cố</Label>
          <Select value={formData.loaiSuCo} onValueChange={(value) => setFormData(prev => ({ ...prev, loaiSuCo: value as any }))}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Chọn loại sự cố" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dienNuoc" className="text-sm">Điện nước</SelectItem>
              <SelectItem value="noiThat" className="text-sm">Nội thất</SelectItem>
              <SelectItem value="vesinh" className="text-sm">Vệ sinh</SelectItem>
              <SelectItem value="anNinh" className="text-sm">An ninh</SelectItem>
              <SelectItem value="khac" className="text-sm">Khác</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="mucDoUuTien" className="text-xs md:text-sm">Mức độ ưu tiên</Label>
          <Select value={formData.mucDoUuTien} onValueChange={(value) => setFormData(prev => ({ ...prev, mucDoUuTien: value as any }))}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Chọn mức độ ưu tiên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thap" className="text-sm">Thấp</SelectItem>
              <SelectItem value="trungBinh" className="text-sm">Trung bình</SelectItem>
              <SelectItem value="cao" className="text-sm">Cao</SelectItem>
              <SelectItem value="khancap" className="text-sm">Khẩn cấp</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {suCo && (
        <div className="space-y-2">
          <Label htmlFor="trangThai" className="text-xs md:text-sm">Trạng thái</Label>
          <Select value={formData.trangThai} onValueChange={(value) => setFormData(prev => ({ ...prev, trangThai: value as any }))}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="moi" className="text-sm">Mới</SelectItem>
              <SelectItem value="dangXuLy" className="text-sm">Đang xử lý</SelectItem>
              <SelectItem value="daXong" className="text-sm">Đã xong</SelectItem>
              <SelectItem value="daHuy" className="text-sm">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {suCo && (formData.trangThai === 'dangXuLy' || formData.trangThai === 'daXong') && (
        <div className="space-y-2">
          <Label htmlFor="ghiChuXuLy" className="text-xs md:text-sm">Ghi chú xử lý</Label>
          <Textarea
            id="ghiChuXuLy"
            value={formData.ghiChuXuLy}
            onChange={(e) => setFormData(prev => ({ ...prev, ghiChuXuLy: e.target.value }))}
            rows={3}
            placeholder="Ghi chú về quá trình xử lý..."
            className="text-sm"
          />
        </div>
      )}

      <SuCoImageUpload
        images={newImageFiles}
        onImagesChange={setNewImageFiles}
        maxImages={5}
      />
      
      {/* Show existing images when editing */}
      {suCo && existingImageUrls.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Ảnh hiện có:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {existingImageUrls.map((imageUrl, index) => (
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

      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto">
          Hủy
        </Button>
        <Button 
          type="submit" 
          size="sm" 
          loading={isSubmitting}
          disabled={isSubmitting} 
          className="w-full sm:w-auto"
        >
          {suCo ? 'Cập nhật' : 'Báo cáo'}
        </Button>
      </DialogFooter>
    </form>
  );
}
