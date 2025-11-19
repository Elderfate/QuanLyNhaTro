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
  Bell, 
  Calendar,
  Users,
  Eye,
  Filter,
  Send,
  Building2,
  Home,
  RefreshCw
} from 'lucide-react';
import { ThongBao, ToaNha, Phong, KhachThue } from '@/types';
import { toast } from 'sonner';
import { useDeleteThongBaoMutation } from '@/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';
import { useData } from '@/hooks/use-data';

export default function ThongBaoPage() {
  const queryClient = useQueryClient();
  
  // Use single data load
  const { thongBao: thongBaoList, toaNha: toaNhaList, phong: phongList, khachThue: khachThueList, loading, refetch } = useData();
  
  const deleteThongBaoMutation = useDeleteThongBaoMutation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingThongBao, setEditingThongBao] = useState<ThongBao | null>(null);

  useEffect(() => {
    document.title = 'Quản lý Thông báo';
  }, []);

  const handleRefresh = async () => {
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['app-data'] });
    toast.success('Đã tải dữ liệu mới nhất');
  };

  const filteredThongBao = thongBaoList.filter(thongBao => {
    const matchesSearch = thongBao.tieuDe.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         thongBao.noiDung.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || thongBao.loai === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'chung':
        return <Badge variant="default">Chung</Badge>;
      case 'hoaDon':
        return <Badge variant="secondary">Hóa đơn</Badge>;
      case 'suCo':
        return <Badge variant="destructive">Sự cố</Badge>;
      case 'hopDong':
        return <Badge variant="outline">Hợp đồng</Badge>;
      case 'khac':
        return <Badge variant="outline">Khác</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getToaNhaName = (toaNhaId?: string) => {
    if (!toaNhaId) return 'Tất cả tòa nhà';
    const toaNha = toaNhaList.find(tn => tn._id === toaNhaId);
    return toaNha?.tenToaNha || 'Không xác định';
  };

  const getPhongNames = (phongIds: any) => {
    // Normalize phongIds - ensure it's an array
    let ids: string[] = [];
    
    if (!phongIds) {
      return 'Tất cả phòng';
    }
    
    if (Array.isArray(phongIds)) {
      ids = phongIds;
    } else if (typeof phongIds === 'string') {
      // Try to parse JSON string
      if (phongIds.startsWith('[') || phongIds.startsWith('{')) {
        try {
          const parsed = JSON.parse(phongIds);
          ids = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          // If parse fails, treat as single ID
          ids = [phongIds];
        }
      } else {
        // Single ID string
        ids = [phongIds];
      }
    } else {
      // Other types - convert to array
      ids = [String(phongIds)];
    }
    
    if (ids.length === 0) return 'Tất cả phòng';
    
    const phongNames = ids.map(id => {
      const phong = phongList.find(p => p._id === id);
      return phong?.maPhong || 'Không xác định';
    });
    return phongNames.join(', ');
  };

  const getKhachThueNames = (khachThueIds: any) => {
    // Normalize khachThueIds - ensure it's an array
    let ids: string[] = [];
    
    if (!khachThueIds) {
      return 'Tất cả khách thuê';
    }
    
    if (Array.isArray(khachThueIds)) {
      ids = khachThueIds;
    } else if (typeof khachThueIds === 'string') {
      // Try to parse JSON string
      if (khachThueIds.startsWith('[') || khachThueIds.startsWith('{')) {
        try {
          const parsed = JSON.parse(khachThueIds);
          ids = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          // If parse fails, treat as single ID
          ids = [khachThueIds];
        }
      } else {
        // Single ID string
        ids = [khachThueIds];
      }
    } else {
      // Other types - convert to array
      ids = [String(khachThueIds)];
    }
    
    if (ids.length === 0) return 'Tất cả khách thuê';
    
    const khachThueNames = ids.map(id => {
      const khachThue = khachThueList.find(k => k._id === id);
      return khachThue?.hoTen || 'Không xác định';
    });
    return khachThueNames.join(', ');
  };

  const handleEdit = (thongBao: ThongBao) => {
    setEditingThongBao(thongBao);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
      try {
        await deleteThongBaoMutation.mutateAsync(id);
        toast.success('Xóa thông báo thành công');
      } catch (error) {
        console.error('Error deleting thong bao:', error);
        toast.error('Có lỗi xảy ra khi xóa thông báo');
      }
    }
  };

  const handleSend = (thongBao: ThongBao) => {
    // Implement send logic
    console.log('Sending notification:', thongBao._id);
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
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Quản lý thông báo</h1>
          <p className="text-xs md:text-sm text-gray-600">Gửi và quản lý thông báo đến khách thuê</p>
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
              <Button size="sm" onClick={() => setEditingThongBao(null)} className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Tạo thông báo</span>
                <span className="sm:hidden">Tạo</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="w-[95vw] md:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingThongBao ? 'Chỉnh sửa thông báo' : 'Tạo thông báo mới'}
              </DialogTitle>
              <DialogDescription>
                {editingThongBao ? 'Cập nhật thông tin thông báo' : 'Nhập thông tin thông báo mới'}
              </DialogDescription>
            </DialogHeader>
            
            <ThongBaoForm 
              thongBao={editingThongBao}
              toaNhaList={toaNhaList}
              phongList={phongList}
              khachThueList={khachThueList}
              onClose={() => setIsDialogOpen(false)}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['thong-bao'] });
                setIsDialogOpen(false);
                toast.success(editingThongBao ? 'Cập nhật thông báo thành công!' : 'Tạo thông báo thành công!');
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
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Tổng thông báo</p>
              <p className="text-base md:text-2xl font-bold">{thongBaoList.length}</p>
            </div>
            <Bell className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Chung</p>
              <p className="text-base md:text-2xl font-bold text-blue-600">
                {thongBaoList.filter(t => t.loai === 'chung').length}
              </p>
            </div>
            <Bell className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Hóa đơn</p>
              <p className="text-base md:text-2xl font-bold text-green-600">
                {thongBaoList.filter(t => t.loai === 'hoaDon').length}
              </p>
            </div>
            <Bell className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Sự cố</p>
              <p className="text-base md:text-2xl font-bold text-red-600">
                {thongBaoList.filter(t => t.loai === 'suCo').length}
              </p>
            </div>
            <Bell className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Danh sách thông báo</CardTitle>
          <CardDescription>
            {filteredThongBao.length} thông báo được tìm thấy
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Tìm kiếm và Bộ lọc */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
              <div className="flex-1 sm:max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm theo tiêu đề, nội dung..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="chung">Chung</SelectItem>
                  <SelectItem value="hoaDon">Hóa đơn</SelectItem>
                  <SelectItem value="suCo">Sự cố</SelectItem>
                  <SelectItem value="hopDong">Hợp đồng</SelectItem>
                  <SelectItem value="khac">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Người nhận</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead>Tòa nhà</TableHead>
                  <TableHead>Ngày gửi</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredThongBao.map((thongBao) => (
                  <TableRow key={thongBao._id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{thongBao.tieuDe}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {thongBao.noiDung}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(thongBao.loai)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getKhachThueNames(thongBao.nguoiNhan)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getPhongNames(thongBao.phong || [])}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {getToaNhaName(thongBao.toaNha)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {new Date(thongBao.ngayGui).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={thongBao.daDoc.length > 0 ? "default" : "secondary"}>
                        {thongBao.daDoc.length > 0 ? 'Đã đọc' : 'Chưa đọc'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSend(thongBao)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(thongBao)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(thongBao._id!)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Danh sách thông báo</h2>
          <span className="text-sm text-gray-500">{filteredThongBao.length} thông báo</span>
        </div>
        
        {/* Mobile Filters */}
        <div className="space-y-2 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm thông báo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Loại thông báo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-sm">Tất cả</SelectItem>
              <SelectItem value="chung" className="text-sm">Chung</SelectItem>
              <SelectItem value="hoaDon" className="text-sm">Hóa đơn</SelectItem>
              <SelectItem value="suCo" className="text-sm">Sự cố</SelectItem>
              <SelectItem value="hopDong" className="text-sm">Hợp đồng</SelectItem>
              <SelectItem value="khac" className="text-sm">Khác</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mobile Card List */}
        <div className="space-y-3">
          {filteredThongBao.map((thongBao) => {
            return (
              <Card key={thongBao._id} className="p-4">
                <div className="space-y-3">
                  {/* Header with title and type */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{thongBao.tieuDe}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {new Date(thongBao.ngayGui).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    {getTypeBadge(thongBao.loai)}
                  </div>

                  {/* Content */}
                  <div className="border-t pt-2">
                    <p className="text-xs text-gray-600 line-clamp-3">{thongBao.noiDung}</p>
                  </div>

                  {/* Recipients info */}
                  <div className="space-y-1 text-xs border-t pt-2">
                    {thongBao.toaNha && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Building2 className="h-3 w-3" />
                        <span>{getToaNhaName(thongBao.toaNha)}</span>
                      </div>
                    )}
                    {thongBao.phong && thongBao.phong.length > 0 && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Home className="h-3 w-3" />
                        <span className="truncate">{getPhongNames(thongBao.phong)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-500">
                      <Users className="h-3 w-3" />
                      <span className="truncate">{getKhachThueNames(thongBao.nguoiNhan)}</span>
                    </div>
                  </div>

                  {/* Read status */}
                  <div className="border-t pt-2">
                    <Badge variant={thongBao.daDoc.length > 0 ? "default" : "secondary"} className="text-xs">
                      {thongBao.daDoc.length > 0 ? 'Đã đọc' : 'Chưa đọc'}
                    </Badge>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSend(thongBao)}
                      className="flex-1"
                    >
                      <Send className="h-3.5 w-3.5 mr-1" />
                      Gửi
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(thongBao)}
                      className="flex-1"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(thongBao._id!)}
                      className="flex-1 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Xóa
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredThongBao.length === 0 && (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Không có thông báo nào</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Form component for adding/editing thong bao
function ThongBaoForm({ 
  thongBao, 
  toaNhaList,
  phongList,
  khachThueList,
  onClose, 
  onSuccess 
}: { 
  thongBao: ThongBao | null;
  toaNhaList: ToaNha[];
  phongList: Phong[];
  khachThueList: KhachThue[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    tieuDe: thongBao?.tieuDe || '',
    noiDung: thongBao?.noiDung || '',
    loai: thongBao?.loai || 'chung',
    nguoiNhan: thongBao?.nguoiNhan || [],
    phong: thongBao?.phong || [],
    toaNha: thongBao?.toaNha || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const url = thongBao 
        ? `/api/thong-bao?id=${thongBao._id}` 
        : '/api/thong-bao';
      const method = thongBao ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(thongBao ? 'Cập nhật thông báo thành công' : 'Tạo thông báo thành công');
        onSuccess();
      } else {
        toast.error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Có lỗi xảy ra khi gửi form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNguoiNhanChange = (khachThueId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      nguoiNhan: checked 
        ? [...prev.nguoiNhan, khachThueId]
        : prev.nguoiNhan.filter(id => id !== khachThueId)
    }));
  };

  const handlePhongChange = (phongId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      phong: checked 
        ? [...prev.phong, phongId]
        : prev.phong.filter(id => id !== phongId)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tieuDe" className="text-xs md:text-sm">Tiêu đề</Label>
        <Input
          id="tieuDe"
          value={formData.tieuDe}
          onChange={(e) => setFormData(prev => ({ ...prev, tieuDe: e.target.value }))}
          placeholder="Nhập tiêu đề thông báo"
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="noiDung" className="text-xs md:text-sm">Nội dung</Label>
        <Textarea
          id="noiDung"
          value={formData.noiDung}
          onChange={(e) => setFormData(prev => ({ ...prev, noiDung: e.target.value }))}
          rows={6}
          placeholder="Nhập nội dung thông báo..."
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="loai" className="text-xs md:text-sm">Loại thông báo</Label>
        <Select value={formData.loai} onValueChange={(value) => setFormData(prev => ({ ...prev, loai: value as any }))}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Chọn loại thông báo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="chung" className="text-sm">Chung</SelectItem>
            <SelectItem value="hoaDon" className="text-sm">Hóa đơn</SelectItem>
            <SelectItem value="suCo" className="text-sm">Sự cố</SelectItem>
            <SelectItem value="hopDong" className="text-sm">Hợp đồng</SelectItem>
            <SelectItem value="khac" className="text-sm">Khác</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="toaNha" className="text-xs md:text-sm">Tòa nhà</Label>
        <Select value={formData.toaNha} onValueChange={(value) => setFormData(prev => ({ ...prev, toaNha: value }))}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Chọn tòa nhà (tùy chọn)" />
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
      </div>

      <div className="space-y-2">
        <Label className="text-xs md:text-sm">Phòng (tùy chọn)</Label>
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
          {phongList.map((phong) => (
            <div key={phong._id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={phong._id}
                checked={formData.phong.includes(phong._id!)}
                onChange={(e) => handlePhongChange(phong._id!, e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor={phong._id} className="text-xs cursor-pointer">
                {phong.maPhong}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs md:text-sm">Người nhận</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
          {khachThueList.map((khachThue) => (
            <div key={khachThue._id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={khachThue._id}
                checked={formData.nguoiNhan.includes(khachThue._id!)}
                onChange={(e) => handleNguoiNhanChange(khachThue._id!, e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor={khachThue._id} className="text-xs cursor-pointer truncate">
                {khachThue.hoTen}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={onClose} 
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Hủy
        </Button>
        <Button 
          type="submit" 
          size="sm" 
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {thongBao ? 'Cập nhật' : 'Tạo thông báo'}
        </Button>
      </DialogFooter>
    </form>
  );
}
