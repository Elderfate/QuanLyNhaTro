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
  EyeIcon,
  Users, 
  Phone,
  Mail,
  Calendar,
  MapPin,
  Info,
  CreditCard,
  RefreshCw,
  Copy
} from 'lucide-react';
import { KhachThue } from '@/types';
import { KhachThueDataTable } from './table';
import { CCCDUpload } from '@/components/ui/cccd-upload';
import { DeleteConfirmPopover } from '@/components/ui/delete-confirm-popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useDeleteKhachThueMutation } from '@/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';
import { useData } from '@/hooks/use-data';
import { Skeleton } from '@/components/ui/skeleton';

export default function KhachThuePage() {
  const queryClient = useQueryClient();
  
  // Use single data load
  const { khachThue: khachThueList, loading, refetch } = useData();
  const deleteKhachThueMutation = useDeleteKhachThueMutation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrangThai, setSelectedTrangThai] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKhachThue, setEditingKhachThue] = useState<KhachThue | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewingCCCD, setViewingCCCD] = useState<KhachThue | null>(null);
  const [isCCCDDialogOpen, setIsCCCDDialogOpen] = useState(false);

  useEffect(() => {
    document.title = 'Quản lý Khách thuê';
    
    // Lắng nghe event xem CCCD
    const handleViewCCCD = (event: Event) => {
      const customEvent = event as CustomEvent<KhachThue>;
      setViewingCCCD(customEvent.detail);
      setIsCCCDDialogOpen(true);
    };
    
    window.addEventListener('view-cccd', handleViewCCCD);
    return () => {
      window.removeEventListener('view-cccd', handleViewCCCD);
    };
  }, []);

  const handleRefresh = async () => {
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['app-data'] });
    toast.success('Đã tải dữ liệu mới nhất');
  };

  const filteredKhachThue = khachThueList.filter(khachThue =>
    khachThue.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
    khachThue.soDienThoai.includes(searchTerm) ||
    khachThue.cccd.includes(searchTerm) ||
    khachThue.queQuan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (khachThue: KhachThue) => {
    setEditingKhachThue(khachThue);
    setIsDialogOpen(true);
  };

  const handleViewCCCD = (khachThue: KhachThue) => {
    setViewingCCCD(khachThue);
    setIsCCCDDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa khách thuê này?')) {
      setActionLoading(`delete-${id}`);
      try {
        await deleteKhachThueMutation.mutateAsync(id);
            toast.success('Xóa khách thuê thành công!');
      } catch (error) {
        console.error('Error deleting khach thue:', error);
        toast.error('Có lỗi xảy ra khi xóa khách thuê');
      } finally {
        setActionLoading(null);
      }
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
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Quản lý khách thuê</h1>
          <p className="text-xs md:text-sm text-gray-600">Danh sách tất cả khách thuê trong hệ thống</p>
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
              <Button size="sm" onClick={() => setEditingKhachThue(null)} className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Thêm khách thuê</span>
                <span className="sm:hidden">Thêm</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="w-[95vw] md:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingKhachThue ? 'Chỉnh sửa khách thuê' : 'Thêm khách thuê mới'}
              </DialogTitle>
              <DialogDescription>
                {editingKhachThue ? 'Cập nhật thông tin khách thuê' : 'Nhập thông tin khách thuê mới'}
              </DialogDescription>
            </DialogHeader>
            
            <KhachThueForm 
              khachThue={editingKhachThue}
              onClose={() => setIsDialogOpen(false)}
              onSuccess={(newKhachThue) => {
                // Invalidate both specific and app-data queries to ensure fresh data
                queryClient.invalidateQueries({ queryKey: ['khach-thue'] });
                queryClient.invalidateQueries({ queryKey: ['app-data'] });
                // Refetch immediately to get updated data
                refetch();
                setIsDialogOpen(false);
                toast.success(editingKhachThue ? 'Cập nhật khách thuê thành công!' : 'Thêm khách thuê thành công!');
              }}
              isSubmitting={isFormSubmitting}
              setIsSubmitting={setIsFormSubmitting}
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
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Tổng khách thuê</p>
              <p className="text-base md:text-2xl font-bold">{khachThueList.length}</p>
            </div>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Đang thuê</p>
              <p className="text-base md:text-2xl font-bold text-blue-600">
                {khachThueList.filter(k => k.trangThai === 'dangThue').length}
              </p>
            </div>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Đã trả phòng</p>
              <p className="text-base md:text-2xl font-bold text-gray-600">
                {khachThueList.filter(k => k.trangThai === 'daTraPhong').length}
              </p>
            </div>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-gray-600" />
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Chưa thuê</p>
              <p className="text-base md:text-2xl font-bold text-orange-600">
                {khachThueList.filter(k => k.trangThai === 'chuaThue').length}
              </p>
            </div>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Danh sách khách thuê</CardTitle>
          <CardDescription>
            {filteredKhachThue.length} khách thuê được tìm thấy
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <KhachThueDataTable
            data={filteredKhachThue}
            onEdit={handleEdit}
            onDelete={handleDelete}
            actionLoading={actionLoading}
            onViewCCCD={handleViewCCCD}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedTrangThai={selectedTrangThai}
            onTrangThaiChange={setSelectedTrangThai}
          />
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Danh sách khách thuê</h2>
          <span className="text-sm text-gray-500">{filteredKhachThue.length} khách thuê</span>
        </div>
        
        {/* Mobile Filters */}
        <div className="space-y-2 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm khách thuê..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          <Select value={selectedTrangThai} onValueChange={setSelectedTrangThai}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-sm">Tất cả</SelectItem>
              <SelectItem value="dangThue" className="text-sm">Đang thuê</SelectItem>
              <SelectItem value="daTraPhong" className="text-sm">Đã trả phòng</SelectItem>
              <SelectItem value="chuaThue" className="text-sm">Chưa thuê</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mobile Card List */}
        <div className="space-y-3">
          {filteredKhachThue.map((khachThue) => (
            <Card key={khachThue._id} className="p-4">
              <div className="space-y-3">
                {/* Header with name and status */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{khachThue.hoTen}</h3>
                    <p className="text-sm text-gray-500 capitalize">{khachThue.gioiTinh}</p>
                  </div>
                  <div className="flex gap-2">
                    {(() => {
                      switch (khachThue.trangThai) {
                        case 'dangThue':
                          return <Badge variant="default" className="text-xs">Đang thuê</Badge>;
                        case 'daTraPhong':
                          return <Badge variant="secondary" className="text-xs">Đã trả phòng</Badge>;
                        case 'chuaThue':
                          return <Badge variant="outline" className="text-xs">Chưa thuê</Badge>;
                        default:
                          return <Badge variant="outline" className="text-xs">{khachThue.trangThai}</Badge>;
                      }
                    })()}
                  </div>
                </div>

                {/* Contact info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3 text-gray-400" />
                    <span>{khachThue.soDienThoai}</span>
                  </div>
                  {khachThue.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{khachThue.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CreditCard className="h-3 w-3" />
                    <span className="font-mono">{khachThue.cccd}</span>
                  </div>
                </div>

                {/* Additional info */}
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>Ngày sinh: {new Date(khachThue.ngaySinh).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{khachThue.queQuan}</span>
                  </div>
                  {khachThue.ngheNghiep && (
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      <span>{khachThue.ngheNghiep}</span>
                    </div>
                  )}
                </div>

                {/* Room info if available */}
                {(khachThue as any).hopDongHienTai?.phong && (
                  <div className="border-t pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-3 w-3 text-green-600" />
                      <span className="font-medium">Phòng: {(khachThue as any).hopDongHienTai.phong.maPhong}</span>
                    </div>
                    {(khachThue as any).hopDongHienTai.phong.toaNha && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 ml-5">
                        <span>{(khachThue as any).hopDongHienTai.phong.toaNha.tenToaNha}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const publicUrl = `${window.location.origin}/khach-thue/dang-nhap`;
                        navigator.clipboard.writeText(publicUrl);
                        toast.success('Đã sao chép link đăng nhập khách thuê');
                      }}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      title="Copy link đăng nhập khách thuê"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(khachThue)}
                      disabled={actionLoading === `edit-${khachThue._id}`}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(khachThue._id!)}
                    disabled={actionLoading === `delete-${khachThue._id}`}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredKhachThue.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Không có khách thuê nào</p>
          </div>
        )}
      </div>

      {/* CCCD Viewer Dialog */}
      <Dialog open={isCCCDDialogOpen} onOpenChange={setIsCCCDDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Xem ảnh CCCD - {viewingCCCD?.hoTen}</DialogTitle>
            <DialogDescription>
              CCCD: {viewingCCCD?.cccd}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {viewingCCCD?.anhCCCD?.matTruoc && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Mặt trước</Label>
                <div className="relative aspect-[16/10] rounded-lg overflow-hidden border">
                  <img
                    src={viewingCCCD.anhCCCD.matTruoc}
                    alt="CCCD mặt trước"
                    className="w-full h-full object-contain bg-gray-50"
                  />
                </div>
              </div>
            )}
            {viewingCCCD?.anhCCCD?.matSau && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Mặt sau</Label>
                <div className="relative aspect-[16/10] rounded-lg overflow-hidden border">
                  <img
                    src={viewingCCCD.anhCCCD.matSau}
                    alt="CCCD mặt sau"
                    className="w-full h-full object-contain bg-gray-50"
                  />
                </div>
              </div>
            )}
            {(!viewingCCCD?.anhCCCD?.matTruoc && !viewingCCCD?.anhCCCD?.matSau) && (
              <div className="col-span-2 text-center py-8 text-gray-500">
                Không có ảnh CCCD
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCCCDDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Form component for adding/editing khach thue
function KhachThueForm({ 
  khachThue, 
  onClose, 
  onSuccess,
  isSubmitting,
  setIsSubmitting
}: { 
  khachThue: KhachThue | null;
  onClose: () => void;
  onSuccess: (newKhachThue?: KhachThue) => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    hoTen: khachThue?.hoTen || '',
    soDienThoai: khachThue?.soDienThoai || '',
    email: khachThue?.email || '',
    cccd: khachThue?.cccd || '',
    ngaySinh: khachThue?.ngaySinh ? new Date(khachThue.ngaySinh).toISOString().split('T')[0] : '',
    gioiTinh: khachThue?.gioiTinh || 'nam',
    queQuan: khachThue?.queQuan || '',
    anhCCCD: {
      matTruoc: (khachThue?.anhCCCD?.matTruoc as string) || null,
      matSau: (khachThue?.anhCCCD?.matSau as string) || null,
    },
    ngheNghiep: khachThue?.ngheNghiep || '',
    matKhau: '',
  });
  // Track original CCCD URLs to detect deletions
  const [originalCCCDUrls, setOriginalCCCDUrls] = useState<{ matTruoc: string | null; matSau: string | null }>({
    matTruoc: (khachThue?.anhCCCD?.matTruoc as string) || null,
    matSau: (khachThue?.anhCCCD?.matSau as string) || null
  });

  // Update original URLs when khachThue changes
  useEffect(() => {
    if (khachThue) {
      setOriginalCCCDUrls({
        matTruoc: (khachThue.anhCCCD?.matTruoc as string) || null,
        matSau: (khachThue.anhCCCD?.matSau as string) || null
      });
    } else {
      setOriginalCCCDUrls({ matTruoc: null, matSau: null });
    }
  }, [khachThue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Ngăn submit nhiều lần
    
    setIsSubmitting(true);
    
    try {
      // Step 1: Upload CCCD images if they are File objects
      let matTruocUrl = formData.anhCCCD.matTruoc;
      let matSauUrl = formData.anhCCCD.matSau;

      // Upload matTruoc if it's a File
      if (formData.anhCCCD.matTruoc instanceof File) {
        toast.info('Đang upload ảnh CCCD mặt trước...');
        const formDataUpload = new FormData();
        formDataUpload.append('file', formData.anhCCCD.matTruoc);

        const response = await fetch('/api/upload?type=CCCD', {
          method: 'POST',
          body: formDataUpload,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Lỗi upload ảnh CCCD mặt trước');
        }

        // Handle different response formats
        if (Array.isArray(result.data)) {
          matTruocUrl = result.data[0]?.secure_url || result.data[0]?.url;
        } else {
          matTruocUrl = result.data?.secure_url || result.data?.url || result.secure_url || result.url;
        }
        
        if (!matTruocUrl) {
          console.error('Upload response:', result);
          throw new Error('Không nhận được URL ảnh CCCD mặt trước');
        }
        console.log('✅ Uploaded matTruoc URL:', matTruocUrl);
        toast.success('Upload ảnh CCCD mặt trước thành công!');
      }

      // Upload matSau if it's a File
      if (formData.anhCCCD.matSau instanceof File) {
        toast.info('Đang upload ảnh CCCD mặt sau...');
        const formDataUpload = new FormData();
        formDataUpload.append('file', formData.anhCCCD.matSau);

        const response = await fetch('/api/upload?type=CCCD', {
          method: 'POST',
          body: formDataUpload,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Lỗi upload ảnh CCCD mặt sau');
        }

        // Handle different response formats
        if (Array.isArray(result.data)) {
          matSauUrl = result.data[0]?.secure_url || result.data[0]?.url;
        } else {
          matSauUrl = result.data?.secure_url || result.data?.url || result.secure_url || result.url;
        }
        
        if (!matSauUrl) {
          console.error('Upload response:', result);
          throw new Error('Không nhận được URL ảnh CCCD mặt sau');
        }
        console.log('✅ Uploaded matSau URL:', matSauUrl);
        toast.success('Upload ảnh CCCD mặt sau thành công!');
      }

      // Step 2: Xóa ảnh CCCD đã bị xóa trên Cloudinary
      if (khachThue && (originalCCCDUrls.matTruoc || originalCCCDUrls.matSau)) {
        const deletedUrls: string[] = [];
        
        // Check matTruoc - nếu original có nhưng hiện tại không có hoặc là File mới
        const currentMatTruoc = typeof formData.anhCCCD.matTruoc === 'string' ? formData.anhCCCD.matTruoc : null;
        if (originalCCCDUrls.matTruoc) {
          // Chỉ xóa nếu không phải là File mới (File mới sẽ được upload) và URL đã thay đổi
          if (!(formData.anhCCCD.matTruoc instanceof File)) {
            if (!currentMatTruoc || currentMatTruoc !== originalCCCDUrls.matTruoc) {
              deletedUrls.push(originalCCCDUrls.matTruoc);
            }
          }
        }
        
        // Check matSau
        const currentMatSau = typeof formData.anhCCCD.matSau === 'string' ? formData.anhCCCD.matSau : null;
        if (originalCCCDUrls.matSau) {
          if (!(formData.anhCCCD.matSau instanceof File)) {
            if (!currentMatSau || currentMatSau !== originalCCCDUrls.matSau) {
              deletedUrls.push(originalCCCDUrls.matSau);
            }
          }
        }
        
        if (deletedUrls.length > 0) {
          try {
            toast.info(`Đang xóa ${deletedUrls.length} ảnh CCCD cũ trên Cloudinary...`);
            const deleteResponse = await fetch('/api/upload', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ urls: deletedUrls }),
            });
            
            if (deleteResponse.ok) {
              toast.success(`Đã xóa ${deletedUrls.length} ảnh CCCD cũ trên Cloudinary`);
            } else {
              console.warn('Failed to delete some CCCD images from Cloudinary');
            }
          } catch (deleteError) {
            console.error('Error deleting CCCD images from Cloudinary:', deleteError);
            // Không block flow chính nếu xóa Cloudinary thất bại
          }
        }
      }

      // Step 3: Submit form with uploaded URLs
      const url = khachThue ? `/api/khach-thue/${khachThue._id}` : '/api/khach-thue';
      const method = khachThue ? 'PUT' : 'POST';

      // Ensure URLs are strings (not File objects)
      const finalMatTruocUrl = typeof matTruocUrl === 'string' ? matTruocUrl : (matTruocUrl || '');
      const finalMatSauUrl = typeof matSauUrl === 'string' ? matSauUrl : (matSauUrl || '');
      
      console.log('📤 Submitting with CCCD URLs:', {
        matTruoc: finalMatTruocUrl,
        matSau: finalMatSauUrl,
        originalMatTruoc: formData.anhCCCD.matTruoc,
        originalMatSau: formData.anhCCCD.matSau
      });

      // Chỉ gửi matKhau khi nó được nhập
      const submitData = { 
        ...formData,
        anhCCCD: {
          matTruoc: finalMatTruocUrl,
          matSau: finalMatSauUrl
        }
      };
      if (!submitData.matKhau || submitData.matKhau.trim() === '') {
        delete (submitData as any).matKhau;
      }

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
          onSuccess(result.data);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <Tabs defaultValue="thong-tin" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="thong-tin" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Info className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Thông tin</span>
            <span className="sm:hidden">Thông tin</span>
          </TabsTrigger>
          <TabsTrigger value="anh-cccd" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <CreditCard className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Ảnh CCCD</span>
            <span className="sm:hidden">CCCD</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="thong-tin" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="hoTen" className="text-xs md:text-sm">Họ tên</Label>
              <Input
                id="hoTen"
                value={formData.hoTen}
                onChange={(e) => setFormData(prev => ({ ...prev, hoTen: e.target.value }))}
                required
                className="text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="soDienThoai" className="text-xs md:text-sm">Số điện thoại</Label>
              <Input
                id="soDienThoai"
                value={formData.soDienThoai}
                onChange={(e) => setFormData(prev => ({ ...prev, soDienThoai: e.target.value }))}
                required
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs md:text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cccd" className="text-xs md:text-sm">CCCD</Label>
              <Input
                id="cccd"
                value={formData.cccd}
                onChange={(e) => setFormData(prev => ({ ...prev, cccd: e.target.value }))}
                required
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="ngaySinh" className="text-xs md:text-sm">Ngày sinh</Label>
              <Input
                id="ngaySinh"
                type="date"
                value={formData.ngaySinh}
                onChange={(e) => setFormData(prev => ({ ...prev, ngaySinh: e.target.value }))}
                required
                className="text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gioiTinh" className="text-xs md:text-sm">Giới tính</Label>
              <Select value={formData.gioiTinh} onValueChange={(value) => setFormData(prev => ({ ...prev, gioiTinh: value as 'nam' | 'nu' }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nam" className="text-sm">Nam</SelectItem>
                  <SelectItem value="nu" className="text-sm">Nữ</SelectItem>
                  <SelectItem value="khac" className="text-sm">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="queQuan" className="text-xs md:text-sm">Quê quán</Label>
            <Input
              id="queQuan"
              value={formData.queQuan}
              onChange={(e) => setFormData(prev => ({ ...prev, queQuan: e.target.value }))}
              required
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ngheNghiep" className="text-xs md:text-sm">Nghề nghiệp</Label>
            <Input
              id="ngheNghiep"
              value={formData.ngheNghiep}
              onChange={(e) => setFormData(prev => ({ ...prev, ngheNghiep: e.target.value }))}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="matKhau" className="text-xs md:text-sm">Mật khẩu đăng nhập</Label>
            <Input
              id="matKhau"
              type="password"
              value={formData.matKhau}
              onChange={(e) => setFormData(prev => ({ ...prev, matKhau: e.target.value }))}
              placeholder={khachThue && khachThue.matKhau ? "Để trống nếu không muốn thay đổi" : "Nhập mật khẩu (tối thiểu 6 ký tự)"}
              className="text-sm"
            />
            <p className="text-[10px] md:text-xs text-muted-foreground">
              {khachThue && khachThue.matKhau 
                ? "Khách thuê đã có tài khoản đăng nhập. Để trống nếu không muốn thay đổi mật khẩu."
                : "Tạo mật khẩu để khách thuê có thể đăng nhập vào hệ thống."
              }
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="anh-cccd" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
          <CCCDUpload
            anhCCCD={formData.anhCCCD}
            onCCCDChange={(anhCCCD) => setFormData(prev => ({ ...prev, anhCCCD }))}
            className="w-full"
          />
        </TabsContent>
      </Tabs>

      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
          Hủy
        </Button>
        <Button 
          type="submit" 
          loading={isSubmitting}
          disabled={isSubmitting} 
          className="w-full sm:w-auto"
        >
              <span className="hidden sm:inline">{khachThue ? 'Cập nhật' : 'Thêm mới'}</span>
              <span className="sm:hidden">{khachThue ? 'Cập nhật' : 'Thêm mới'}</span>
        </Button>
      </DialogFooter>
    </form>
  );
}