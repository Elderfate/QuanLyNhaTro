'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertCircle, Plus, Calendar, MapPin, User } from 'lucide-react';
import { toast } from 'sonner';

interface SuCo {
  _id: string;
  tieuDe?: string;
  moTa?: string;
  phong?: any;
  khachThue?: any;
  loaiSuCo?: string;
  mucDoUuTien?: string;
  trangThai?: string;
  ngayBaoCao?: string;
}

export default function SuCoPage() {
  const [suCoList, setSuCoList] = useState<SuCo[]>([]);
  const [loading, setLoading] = useState(true);
  const [khachThue, setKhachThue] = useState<any>(null);
  const [phong, setPhong] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tieuDe: '',
    moTa: '',
    loaiSuCo: 'khac' as 'dienNuoc' | 'noiThat' | 'vesinh' | 'anNinh' | 'khac',
    mucDoUuTien: 'trungBinh' as 'thap' | 'trungBinh' | 'cao' | 'khancap',
  });

  useEffect(() => {
    const khachThueData = localStorage.getItem('khachThueData');
    if (khachThueData) {
      const data = JSON.parse(khachThueData);
      setKhachThue(data);
      fetchPhongAndSuCo(data);
    }
  }, []);

  const fetchPhongAndSuCo = async (khachThueData: any) => {
    try {
      setLoading(true);
      const response = await fetch('/api/data');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Find active contract for this tenant
          const allHopDong = result.data.hopDong || [];
          const activeContract = allHopDong.find((hd: any) => {
            const nguoiDaiDien = typeof hd.nguoiDaiDien === 'object' 
              ? hd.nguoiDaiDien._id 
              : hd.nguoiDaiDien;
            return nguoiDaiDien === khachThueData._id && hd.trangThai === 'hoatDong';
          });

          if (activeContract) {
            const phongId = typeof activeContract.phong === 'object'
              ? activeContract.phong._id
              : activeContract.phong;
            const allPhong = result.data.phong || [];
            const tenantPhong = allPhong.find((p: any) => p._id === phongId);
            setPhong(tenantPhong);

            // Fetch issues for this tenant
            const allSuCo = result.data.suCo || [];
            const tenantSuCo = allSuCo.filter((sc: any) => {
              const ktId = typeof sc.khachThue === 'object' 
                ? sc.khachThue._id 
                : sc.khachThue;
              return ktId === khachThueData._id;
            });
            setSuCoList(tenantSuCo);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phong) {
      toast.error('Không tìm thấy phòng của bạn');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/su-co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          phong: phong._id,
          khachThue: khachThue._id,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        toast.success('Báo cáo sự cố thành công!');
        setIsDialogOpen(false);
        setFormData({
          tieuDe: '',
          moTa: '',
          loaiSuCo: 'khac',
          mucDoUuTien: 'trungBinh',
        });
        // Refresh list
        if (khachThue) {
          fetchPhongAndSuCo(khachThue);
        }
      } else {
        toast.error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error creating su co:', error);
      toast.error('Có lỗi xảy ra khi báo cáo sự cố');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (trangThai?: string) => {
    switch (trangThai) {
      case 'moi':
        return <Badge className="bg-blue-500">Mới</Badge>;
      case 'dangXuLy':
        return <Badge className="bg-yellow-500">Đang xử lý</Badge>;
      case 'daXong':
        return <Badge className="bg-green-500">Đã xong</Badge>;
      case 'daHuy':
        return <Badge variant="destructive">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{trangThai || 'N/A'}</Badge>;
    }
  };

  const getPriorityBadge = (mucDoUuTien?: string) => {
    switch (mucDoUuTien) {
      case 'khancap':
        return <Badge variant="destructive">Khẩn cấp</Badge>;
      case 'cao':
        return <Badge className="bg-orange-500">Cao</Badge>;
      case 'trungBinh':
        return <Badge className="bg-yellow-500">Trung bình</Badge>;
      case 'thap':
        return <Badge className="bg-gray-500">Thấp</Badge>;
      default:
        return <Badge variant="outline">{mucDoUuTien || 'N/A'}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sự cố của tôi</h1>
          <p className="text-sm text-gray-600 mt-1">Báo cáo và theo dõi sự cố</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Báo cáo sự cố
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Báo cáo sự cố mới</DialogTitle>
              <DialogDescription>
                Phòng: {phong?.maPhong || 'N/A'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tieuDe">Tiêu đề *</Label>
                  <Input
                    id="tieuDe"
                    value={formData.tieuDe}
                    onChange={(e) => setFormData(prev => ({ ...prev, tieuDe: e.target.value }))}
                    required
                    placeholder="Ví dụ: Mất nước, hỏng điều hòa..."
                  />
                </div>
                <div>
                  <Label htmlFor="moTa">Mô tả chi tiết *</Label>
                  <Textarea
                    id="moTa"
                    value={formData.moTa}
                    onChange={(e) => setFormData(prev => ({ ...prev, moTa: e.target.value }))}
                    required
                    rows={4}
                    placeholder="Mô tả chi tiết về sự cố..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="loaiSuCo">Loại sự cố *</Label>
                    <Select
                      value={formData.loaiSuCo}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, loaiSuCo: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dienNuoc">Điện nước</SelectItem>
                        <SelectItem value="noiThat">Nội thất</SelectItem>
                        <SelectItem value="vesinh">Vệ sinh</SelectItem>
                        <SelectItem value="anNinh">An ninh</SelectItem>
                        <SelectItem value="khac">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="mucDoUuTien">Mức độ ưu tiên *</Label>
                    <Select
                      value={formData.mucDoUuTien}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, mucDoUuTien: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="thap">Thấp</SelectItem>
                        <SelectItem value="trungBinh">Trung bình</SelectItem>
                        <SelectItem value="cao">Cao</SelectItem>
                        <SelectItem value="khancap">Khẩn cấp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {suCoList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Chưa có sự cố nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {suCoList.map((suCo) => (
            <Card key={suCo._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{suCo.tieuDe || 'Không có tiêu đề'}</CardTitle>
                    <CardDescription className="mt-1">
                      Phòng: {suCo.phong?.maPhong || 'N/A'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(suCo.trangThai)}
                    {getPriorityBadge(suCo.mucDoUuTien)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{suCo.moTa}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(suCo.ngayBaoCao)}
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Loại: {suCo.loaiSuCo || 'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

