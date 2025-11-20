'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Home,
  Calendar,
} from 'lucide-react';
import { HopDong, Phong } from '@/types';
import { toast } from 'sonner';
import { useData } from '@/hooks/use-data';
import { useQueryClient } from '@tanstack/react-query';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export default function TaoHangLoatHoaDonPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hopDong: allHopDong, phong: allPhong, hoaDon: allHoaDon, loading: dataLoading } = useData();

  const [thang, setThang] = useState(new Date().getMonth() + 1);
  const [nam, setNam] = useState(new Date().getFullYear());
  const [selectedPhongIds, setSelectedPhongIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{
    created: number;
    total: number;
    results: Array<{ phongId: string; maPhong: string; maHoaDon: string; tongTien: number }>;
    errors: string[];
  } | null>(null);

  // Get active contracts
  const activeContracts = useMemo(() => {
    if (!allHopDong || allHopDong.length === 0) return [];
    const now = new Date();
    return allHopDong.filter((hd: HopDong) => {
      const ngayBatDau = hd.ngayBatDau ? new Date(hd.ngayBatDau) : null;
      const ngayKetThuc = hd.ngayKetThuc ? new Date(hd.ngayKetThuc) : null;
      return hd.trangThai === 'hoatDong' &&
             ngayBatDau && ngayBatDau <= now &&
             ngayKetThuc && ngayKetThuc >= now;
    });
  }, [allHopDong]);

  // Get rooms with active contracts
  const availableRooms = useMemo(() => {
    if (!Array.isArray(allPhong) || !Array.isArray(activeContracts) || !Array.isArray(allHoaDon)) {
      return [];
    }
    
    const roomMap = new Map<string, { phong: Phong; hopDong: HopDong; hasInvoice: boolean }>();
    
    activeContracts.forEach((hd: HopDong) => {
      if (!hd) return;
      const phongId = typeof hd.phong === 'object' && hd.phong ? hd.phong._id : hd.phong;
      if (!phongId) return;
      
      const phong = allPhong.find((p: Phong) => p && String(p._id) === String(phongId));
      if (!phong) return;

      // Check if invoice already exists
      const hasInvoice = allHoaDon.some((hdInvoice: any) => {
        if (!hdInvoice) return false;
        const hopDongId = typeof hdInvoice.hopDong === 'object' && hdInvoice.hopDong ? hdInvoice.hopDong._id : hdInvoice.hopDong;
        return String(hopDongId) === String(hd._id) &&
               hdInvoice.thang === thang &&
               hdInvoice.nam === nam;
      });

      if (!roomMap.has(String(phongId))) {
        roomMap.set(String(phongId), { phong, hopDong: hd, hasInvoice });
      }
    });

    return Array.from(roomMap.values());
  }, [allPhong, activeContracts, allHoaDon, thang, nam]);

  const togglePhong = (phongId: string) => {
    setSelectedPhongIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phongId)) {
        newSet.delete(phongId);
      } else {
        newSet.add(phongId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const availableIds = availableRooms
      .filter(r => !r.hasInvoice)
      .map(r => String(r.phong._id));
    setSelectedPhongIds(new Set(availableIds));
  };

  const deselectAll = () => {
    setSelectedPhongIds(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedPhongIds.size === 0) {
      toast.error('Vui lòng chọn ít nhất một phòng');
      return;
    }

    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    setResults(null);

    try {
      const response = await fetch('/api/hoa-don/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thang,
          nam,
          phongIds: Array.from(selectedPhongIds),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setResults(result.data);
        toast.success(result.message || `Đã tạo ${result.data.created} hóa đơn thành công`);
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['app-data'] });
        queryClient.invalidateQueries({ queryKey: ['hoa-don'] });
        
        // Clear selections
        setSelectedPhongIds(new Set());
      } else {
        toast.error(result.message || 'Có lỗi xảy ra');
        if (result.data) {
          setResults(result.data);
        }
      }
    } catch (error) {
      console.error('Error creating batch invoices:', error);
      toast.error('Có lỗi xảy ra khi tạo hóa đơn hàng loạt');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const selectedCount = selectedPhongIds.size;
  const availableCount = availableRooms.filter(r => !r.hasInvoice).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-3xl font-bold">Tạo hóa đơn hàng loạt</h1>
          <p className="text-muted-foreground mt-1">
            Tạo hóa đơn cho nhiều phòng cùng lúc
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Month/Year Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Chọn tháng/năm
            </CardTitle>
            <CardDescription>
              Chọn tháng và năm để tạo hóa đơn
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="thang">Tháng</Label>
              <Select value={String(thang)} onValueChange={(v) => setThang(parseInt(v))}>
                <SelectTrigger id="thang">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      Tháng {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nam">Năm</Label>
              <Input
                id="nam"
                type="number"
                value={nam}
                onChange={(e) => setNam(parseInt(e.target.value) || new Date().getFullYear())}
                min={2020}
                max={2100}
              />
            </div>
          </CardContent>
        </Card>

        {/* Room Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Chọn phòng
                </CardTitle>
                <CardDescription>
                  Chọn các phòng cần tạo hóa đơn (đã chọn {selectedCount}/{availableCount} phòng)
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAll}>
                  Chọn tất cả
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={deselectAll}>
                  Bỏ chọn tất cả
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {availableRooms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Không có phòng nào có hợp đồng đang hoạt động
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {availableRooms.map(({ phong, hopDong, hasInvoice }) => {
                  const phongId = String(phong._id);
                  const isSelected = selectedPhongIds.has(phongId);
                  const isDisabled = hasInvoice;

                  return (
                    <div
                      key={phongId}
                      className={`flex items-center space-x-3 p-3 rounded-lg border ${
                        isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white'
                      } ${isDisabled ? 'opacity-50' : 'cursor-pointer hover:bg-gray-50'}`}
                      onClick={() => !isDisabled && togglePhong(phongId)}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={() => !isDisabled && togglePhong(phongId)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{phong.maPhong}</span>
                          {hasInvoice && (
                            <Badge variant="secondary" className="text-xs">
                              Đã có hóa đơn
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Hợp đồng: {hopDong.maHopDong} • Giá thuê: {formatCurrency(hopDong.giaThue || 0)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.created === results.total ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-yellow-600" />
                )}
                Kết quả
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <strong>Đã tạo:</strong> {results.created}/{results.total} hóa đơn
              </div>
              
              {results.results.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Hóa đơn đã tạo:</h4>
                  <div className="space-y-1">
                    {results.results.map((r, idx) => (
                      <div key={idx} className="text-sm text-green-600">
                        ✓ {r.maPhong}: {r.maHoaDon} - {formatCurrency(r.tongTien)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Lỗi:</h4>
                  <div className="space-y-1">
                    {results.errors.map((error, idx) => (
                      <div key={idx} className="text-sm text-red-600">
                        ✗ {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || selectedCount === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Tạo {selectedCount} hóa đơn
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

