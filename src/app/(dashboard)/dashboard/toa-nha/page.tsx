'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useDeleteToaNhaMutation } from '@/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';
import { useData } from '@/hooks/use-data';
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
  Building2, 
  MapPin,
  Users,
  Eye,
  RefreshCw,
  Copy
} from 'lucide-react';
import { ToaNha } from '@/types';
import { DeleteConfirmPopover } from '@/components/ui/delete-confirm-popover';
import { toast } from 'sonner';
import { ToaNhaDataTable } from './table';

export default function ToaNhaPage() {
  const queryClient = useQueryClient();
  const { toaNha: toaNhaList, loading, refetch } = useData();
  const deleteToaNhaMutation = useDeleteToaNhaMutation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingToaNha, setEditingToaNha] = useState<ToaNha | null>(null);

  useEffect(() => {
    document.title = 'Quản lý Tòa nhà';
  }, []);

  const handleRefresh = async () => {
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['app-data'] });
    toast.success('Đã tải dữ liệu mới nhất');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tòa nhà này?')) {
      try {
        await deleteToaNhaMutation.mutateAsync(id);
        toast.success('Xóa tòa nhà thành công!');
      } catch (error) {
        console.error('Error deleting toa nha:', error);
        toast.error('Có lỗi xảy ra khi xóa tòa nhà');
      }
    }
  };

  const filteredToaNha = toaNhaList.filter(toaNha => {
    const searchLower = searchTerm.toLowerCase();
    return (
      toaNha.tenToaNha.toLowerCase().includes(searchLower) ||
      (typeof toaNha.diaChi === 'object' && toaNha.diaChi?.duong?.toLowerCase().includes(searchLower)) ||
      (typeof toaNha.diaChi === 'object' && toaNha.diaChi?.phuong?.toLowerCase().includes(searchLower))
    );
  });

  const handleEdit = (toaNha: ToaNha) => {
    setEditingToaNha(toaNha);
    setIsDialogOpen(true);
  };

  const formatAddress = (diaChi: ToaNha['diaChi']) => {
    if (typeof diaChi === 'object' && diaChi !== null) {
      return `${diaChi.soNha || ''} ${diaChi.duong || ''}, ${diaChi.phuong || ''}, ${diaChi.quan || ''}, ${diaChi.thanhPho || ''}`;
    }
    return String(diaChi || '');
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
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Quản lý tòa nhà</h1>
          <p className="text-xs md:text-sm text-gray-600">Danh sách tất cả tòa nhà trong hệ thống</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline ml-2">{loading ? 'Đang tải...' : 'Tải mới'}</span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditingToaNha(null)} className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Thêm tòa nhà</span>
                <span className="sm:hidden">Thêm</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] md:w-full">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">
                {editingToaNha ? 'Chỉnh sửa tòa nhà' : 'Thêm tòa nhà mới'}
              </DialogTitle>
              <DialogDescription className="text-xs md:text-sm">
                {editingToaNha ? 'Cập nhật thông tin tòa nhà' : 'Nhập thông tin tòa nhà mới'}
              </DialogDescription>
            </DialogHeader>
            
            <ToaNhaForm 
              toaNha={editingToaNha}
              onClose={() => setIsDialogOpen(false)}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['toa-nha'] });
                setIsDialogOpen(false);
                toast.success(editingToaNha ? 'Cập nhật tòa nhà thành công!' : 'Thêm tòa nhà thành công!');
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
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Tổng tòa nhà</p>
              <p className="text-base md:text-2xl font-bold">{toaNhaList.length}</p>
            </div>
            <Building2 className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Phòng trống</p>
              <p className="text-base md:text-2xl font-bold text-green-600">
                {toaNhaList.reduce((sum, toaNha) => sum + ((toaNha as any).phongTrong || 0), 0)}
              </p>
            </div>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Đang thuê</p>
              <p className="text-base md:text-2xl font-bold text-blue-600">
                {toaNhaList.reduce((sum, toaNha) => sum + ((toaNha as any).phongDangThue || 0), 0)}
              </p>
            </div>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Tìm thấy</p>
              <p className="text-base md:text-2xl font-bold">{filteredToaNha.length}</p>
            </div>
            <Search className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
          </div>
        </Card>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Danh sách tòa nhà</CardTitle>
          <CardDescription>
            {filteredToaNha.length} tòa nhà được tìm thấy
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ToaNhaDataTable
            data={filteredToaNha}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-semibold">Danh sách tòa nhà</h2>
          <span className="text-xs text-gray-600">{filteredToaNha.length} tòa nhà</span>
        </div>

        {/* Mobile Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm tòa nhà..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </div>
        
        {filteredToaNha.length === 0 ? (
          <Card className="p-6 text-center">
            <Building2 className="h-10 w-10 mx-auto text-gray-400 mb-3" />
            <h3 className="text-base font-medium text-gray-900 mb-1">Không tìm thấy tòa nhà nào</h3>
            <p className="text-sm text-gray-600">Thử thay đổi tìm kiếm</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredToaNha.map((toaNha) => {
              const phongTrong = (toaNha as any).phongTrong || 0;
              const phongDangThue = (toaNha as any).phongDangThue || 0;
              const tongPhong = toaNha.tongSoPhong;
              
              return (
                <Card key={toaNha._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="h-4 w-4 text-blue-600" />
                          <h3 className="font-semibold text-base">{toaNha.tenToaNha}</h3>
                        </div>
                        <div className="flex items-start gap-1.5 text-xs text-gray-600">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{formatAddress(toaNha.diaChi)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-3 p-2 bg-gray-50 rounded-md">
                      <div className="text-center">
                        <div className="text-xs text-gray-600">Tổng</div>
                        <div className="text-sm font-semibold">{tongPhong}</div>
                      </div>
                      <div className="text-center border-x border-gray-200">
                        <div className="text-xs text-gray-600">Trống</div>
                        <div className="text-sm font-semibold text-green-600">{phongTrong}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-600">Thuê</div>
                        <div className="text-sm font-semibold text-blue-600">{phongDangThue}</div>
                      </div>
                    </div>

                    {Array.isArray(toaNha.tienNghiChung) && toaNha.tienNghiChung.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-gray-600 mb-1">Tiện nghi:</div>
                        <div className="flex flex-wrap gap-1">
                          {toaNha.tienNghiChung.slice(0, 3).map((tienNghi: string) => (
                            <Badge key={tienNghi} variant="secondary" className="text-xs">
                              {tienNghi}
                            </Badge>
                          ))}
                          {toaNha.tienNghiChung.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{toaNha.tienNghiChung.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex gap-2">
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
                          onClick={() => handleEdit(toaNha)}
                          className="flex-1 text-xs"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Sửa
                        </Button>
                        <DeleteConfirmPopover
                          onConfirm={() => handleDelete(toaNha._id!)}
                          title="Xóa tòa nhà"
                          description="Bạn có chắc chắn muốn xóa tòa nhà này?"
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
    </div>
  );
}

// Form component for adding/editing toa nha
function ToaNhaForm({ 
  toaNha, 
  onClose, 
  onSuccess 
}: { 
  toaNha: ToaNha | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    tenToaNha: toaNha?.tenToaNha || '',
    soNha: toaNha?.diaChi.soNha || '',
    duong: toaNha?.diaChi.duong || '',
    phuong: toaNha?.diaChi.phuong || '',
    quan: toaNha?.diaChi.quan || '',
    thanhPho: toaNha?.diaChi.thanhPho || '',
    moTa: toaNha?.moTa || '',
    tienNghiChung: toaNha?.tienNghiChung || [],
  });

  const tienNghiOptions = [
    { value: 'wifi', label: 'WiFi' },
    { value: 'camera', label: 'Camera an ninh' },
    { value: 'baoVe', label: 'Bảo vệ 24/7' },
    { value: 'giuXe', label: 'Giữ xe' },
    { value: 'thangMay', label: 'Thang máy' },
    { value: 'sanPhoi', label: 'Sân phơi' },
    { value: 'nhaVeSinhChung', label: 'Nhà vệ sinh chung' },
    { value: 'khuBepChung', label: 'Khu bếp chung' },
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const submitData = {
        tenToaNha: formData.tenToaNha,
        diaChi: {
          soNha: formData.soNha,
          duong: formData.duong,
          phuong: formData.phuong,
          quan: formData.quan,
          thanhPho: formData.thanhPho,
        },
        moTa: formData.moTa,
        tienNghiChung: formData.tienNghiChung,
      };

      const url = toaNha ? `/api/toa-nha/${toaNha._id}` : '/api/toa-nha';
      const method = toaNha ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          onSuccess();
        } else {
          toast.error(result.message || 'Có lỗi xảy ra');
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Có lỗi xảy ra khi gửi form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTienNghiChange = (tienNghi: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      tienNghiChung: checked 
        ? [...prev.tienNghiChung, tienNghi]
        : prev.tienNghiChung.filter(t => t !== tienNghi)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tenToaNha" className="text-sm">Tên tòa nhà</Label>
        <Input
          id="tenToaNha"
          value={formData.tenToaNha}
          onChange={(e) => setFormData(prev => ({ ...prev, tenToaNha: e.target.value }))}
          required
          className="text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div className="space-y-2">
          <Label htmlFor="soNha" className="text-sm">Số nhà</Label>
          <Input
            id="soNha"
            value={formData.soNha}
            onChange={(e) => setFormData(prev => ({ ...prev, soNha: e.target.value }))}
            required
            className="text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="duong" className="text-sm">Tên đường</Label>
          <Input
            id="duong"
            value={formData.duong}
            onChange={(e) => setFormData(prev => ({ ...prev, duong: e.target.value }))}
            required
            className="text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div className="space-y-2">
          <Label htmlFor="phuong" className="text-sm">Phường/Xã</Label>
          <Input
            id="phuong"
            value={formData.phuong}
            onChange={(e) => setFormData(prev => ({ ...prev, phuong: e.target.value }))}
            required
            className="text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="quan" className="text-sm">Quận/Huyện</Label>
          <Input
            id="quan"
            value={formData.quan}
            onChange={(e) => setFormData(prev => ({ ...prev, quan: e.target.value }))}
            required
            className="text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="thanhPho" className="text-sm">Thành phố</Label>
        <Input
          id="thanhPho"
          value={formData.thanhPho}
          onChange={(e) => setFormData(prev => ({ ...prev, thanhPho: e.target.value }))}
          required
          className="text-sm"
        />
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
        <Label className="text-sm">Tiện nghi chung</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {tienNghiOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={option.value}
                checked={formData.tienNghiChung.includes(option.value)}
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
          {toaNha ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </DialogFooter>
    </form>
  );
}
