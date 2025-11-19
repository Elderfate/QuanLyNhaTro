'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Image as ImageIcon, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface CCCDUploadProps {
  anhCCCD: {
    matTruoc: File | string | null; // File (new) or string (URL from server)
    matSau: File | string | null;
  };
  onCCCDChange: (anhCCCD: { matTruoc: File | string | null; matSau: File | string | null }) => void;
  className?: string;
}

export function CCCDUpload({ 
  anhCCCD, 
  onCCCDChange, 
  className = '' 
}: CCCDUploadProps) {
  const [previewUrls, setPreviewUrls] = useState<{ matTruoc: string | null; matSau: string | null }>({
    matTruoc: null,
    matSau: null
  });
  const matTruocInputRef = useRef<HTMLInputElement>(null);
  const matSauInputRef = useRef<HTMLInputElement>(null);
  const prevUrlsRef = useRef<{ matTruoc: string | null; matSau: string | null }>({
    matTruoc: null,
    matSau: null
  });

  // Create preview URLs from File objects or use existing URLs
  useEffect(() => {
    const urls: { matTruoc: string | null; matSau: string | null } = {
      matTruoc: null,
      matSau: null
    };

    if (anhCCCD.matTruoc) {
      if (anhCCCD.matTruoc instanceof File) {
        urls.matTruoc = URL.createObjectURL(anhCCCD.matTruoc);
      } else if (typeof anhCCCD.matTruoc === 'string' && anhCCCD.matTruoc.trim() !== '') {
        urls.matTruoc = anhCCCD.matTruoc;
      }
    }

    if (anhCCCD.matSau) {
      if (anhCCCD.matSau instanceof File) {
        urls.matSau = URL.createObjectURL(anhCCCD.matSau);
      } else if (typeof anhCCCD.matSau === 'string' && anhCCCD.matSau.trim() !== '') {
        urls.matSau = anhCCCD.matSau;
      }
    }

    // Store previous URLs for cleanup
    const prevUrls = { ...prevUrlsRef.current };
    prevUrlsRef.current = urls;
    setPreviewUrls(urls);

    // Cleanup: revoke object URLs when component unmounts or images change
    return () => {
      if (prevUrls.matTruoc && typeof prevUrls.matTruoc === 'string' && prevUrls.matTruoc.startsWith('blob:')) {
        URL.revokeObjectURL(prevUrls.matTruoc);
      }
      if (prevUrls.matSau && typeof prevUrls.matSau === 'string' && prevUrls.matSau.startsWith('blob:')) {
        URL.revokeObjectURL(prevUrls.matSau);
      }
    };
  }, [anhCCCD.matTruoc, anhCCCD.matSau]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'matTruoc' | 'matSau') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    // Kiểm tra kích thước file (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 10MB');
      return;
    }

    // Lưu File object (chưa upload)
    onCCCDChange({
      ...anhCCCD,
      [type]: file
    });
    
    toast.success(`Đã chọn ảnh CCCD ${type === 'matTruoc' ? 'mặt trước' : 'mặt sau'} (sẽ upload khi lưu form)`);

    // Reset input
    if (type === 'matTruoc' && matTruocInputRef.current) {
      matTruocInputRef.current.value = '';
    }
    if (type === 'matSau' && matSauInputRef.current) {
      matSauInputRef.current.value = '';
    }
  };

  const removeImage = (type: 'matTruoc' | 'matSau') => {
    // Revoke preview URL if it's a File
    if (previewUrls[type] && anhCCCD[type] instanceof File) {
      URL.revokeObjectURL(previewUrls[type]!);
    }
    
    onCCCDChange({
      ...anhCCCD,
      [type]: null
    });
    toast.success(`Đã xóa ảnh CCCD ${type === 'matTruoc' ? 'mặt trước' : 'mặt sau'}`);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-medium">Ảnh CCCD</h3>
      </div>

      {/* Grid layout giống PhongImageUpload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mặt trước */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Mặt trước CCCD
            </label>
            <input
              ref={matTruocInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, 'matTruoc')}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => matTruocInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {previewUrls.matTruoc ? 'Thay đổi' : 'Chọn ảnh'}
            </Button>
          </div>

          {previewUrls.matTruoc ? (
            <Card className="relative group">
              <CardContent className="p-2">
                <div className="relative aspect-[3/2] rounded-md overflow-hidden bg-gray-100">
                  <img
                    src={previewUrls.matTruoc}
                    alt="CCCD mặt trước"
                    className="w-full h-full object-cover"
                  />
                  {anhCCCD.matTruoc instanceof File && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                      {(anhCCCD.matTruoc.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  )}
                  {typeof anhCCCD.matTruoc === 'string' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                      Ảnh hiện có
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage('matTruoc')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-500 text-sm text-center">
                  Chưa có ảnh CCCD mặt trước
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Mặt sau */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Mặt sau CCCD
            </label>
            <input
              ref={matSauInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, 'matSau')}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => matSauInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {previewUrls.matSau ? 'Thay đổi' : 'Chọn ảnh'}
            </Button>
          </div>

          {previewUrls.matSau ? (
            <Card className="relative group">
              <CardContent className="p-2">
                <div className="relative aspect-[3/2] rounded-md overflow-hidden bg-gray-100">
                  <img
                    src={previewUrls.matSau}
                    alt="CCCD mặt sau"
                    className="w-full h-full object-cover"
                  />
                  {anhCCCD.matSau instanceof File && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                      {(anhCCCD.matSau.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  )}
                  {typeof anhCCCD.matSau === 'string' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                      Ảnh hiện có
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage('matSau')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-500 text-sm text-center">
                  Chưa có ảnh CCCD mặt sau
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div className="flex justify-center">
        <Badge variant="secondary" className="text-xs">
          {anhCCCD.matTruoc && anhCCCD.matSau 
            ? 'Đã chọn đầy đủ ảnh CCCD (sẽ upload khi lưu)' 
            : `Còn thiếu ${!anhCCCD.matTruoc && !anhCCCD.matSau ? '2' : '1'} ảnh CCCD`
          }
        </Badge>
      </div>
    </div>
  );
}
