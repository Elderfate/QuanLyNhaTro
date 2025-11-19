'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Image as ImageIcon, Home } from 'lucide-react';
import { toast } from 'sonner';

interface PhongImageUploadProps {
  images: File[]; // Changed from string[] to File[]
  onImagesChange: (images: File[]) => void;
  className?: string;
  maxImages?: number;
}

export function PhongImageUpload({ 
  images, 
  onImagesChange, 
  className = '',
  maxImages = 10
}: PhongImageUploadProps) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Create preview URLs from File objects
  useEffect(() => {
    if (images.length === 0) {
      setPreviewUrls([]);
      return;
    }

    const urls = images
      .filter(file => file instanceof File)
      .map(file => URL.createObjectURL(file));
    
    setPreviewUrls(urls);

    // Cleanup: revoke object URLs when component unmounts or images change
    return () => {
      urls.forEach(url => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [images]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    
    // Kiểm tra số lượng ảnh
    if (images.length + newFiles.length > maxImages) {
      toast.error(`Chỉ được upload tối đa ${maxImages} ảnh`);
      return;
    }

    // Kiểm tra định dạng file
    const invalidFiles = newFiles.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast.error('Vui lòng chọn file ảnh hợp lệ');
      return;
    }

    // Kiểm tra kích thước file (max 10MB)
    const oversizedFiles = newFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('Kích thước file không được vượt quá 10MB');
      return;
    }

    // Lưu File objects (chưa upload)
    onImagesChange([...images, ...newFiles]);
    toast.success(`Đã thêm ${newFiles.length} ảnh (sẽ upload khi lưu form)`);

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    // Revoke preview URL
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    toast.success('Đã xóa ảnh');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Home className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-medium">Ảnh phòng</h3>
        <Badge variant="secondary" className="text-xs">
          {images.length}/{maxImages} ảnh
        </Badge>
      </div>

      {/* Upload button */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={images.length >= maxImages}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={images.length >= maxImages}
        >
          <Upload className="h-4 w-4 mr-2" />
          Thêm ảnh
        </Button>
        {images.length >= maxImages && (
          <span className="text-sm text-gray-500">
            Đã đạt giới hạn {maxImages} ảnh
          </span>
        )}
      </div>

      {/* Images grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((file, index) => {
            const previewUrl = previewUrls[index];
            if (!previewUrl) return null;
            
            return (
              <Card key={index} className="relative group">
                <CardContent className="p-2">
                  <div className="relative aspect-square rounded-md overflow-hidden bg-gray-100">
                    <img
                      src={previewUrl}
                      alt={`Phòng ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500 text-sm text-center">
              Chưa có ảnh phòng nào
            </p>
            <p className="text-xs text-gray-400 text-center mt-1">
              Click "Thêm ảnh" để upload ảnh minh họa phòng
            </p>
          </CardContent>
        </Card>
      )}

      {/* Status badge */}
      <div className="flex justify-center">
        <Badge 
          variant={images.length > 0 ? "default" : "secondary"} 
          className="text-xs"
        >
          {images.length > 0 
            ? `Đã chọn ${images.length} ảnh (sẽ upload khi lưu)` 
            : 'Chưa có ảnh phòng'
          }
        </Badge>
      </div>
    </div>
  );
}
