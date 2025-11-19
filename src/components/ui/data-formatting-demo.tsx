'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Upload, CheckCircle, XCircle } from 'lucide-react'
import { 
  formatPhoneNumber, 
  validatePhoneNumber, 
  formatCCCD, 
  validateCCCD, 
  formatCurrency, 
  formatDate, 
  formatRoomCode,
  validateRoomCode,
  parseCurrency 
} from '@/lib/data-formatter'

export function DataFormattingDemo() {
  const [formData, setFormData] = useState({
    phoneNumber: '',
    cccd: '',
    roomCode: '',
    price: '',
    date: '',
  })

  const [validationResults, setValidationResults] = useState({
    phoneNumber: null as boolean | null,
    cccd: null as boolean | null,
    roomCode: null as boolean | null,
  })

  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value
    let validation: boolean | null = null

    switch (field) {
      case 'phoneNumber':
        formattedValue = formatPhoneNumber(value)
        validation = validatePhoneNumber(value)
        break
      case 'cccd':
        formattedValue = formatCCCD(value)
        validation = validateCCCD(value)
        break
      case 'roomCode':
        formattedValue = formatRoomCode(value)
        validation = validateRoomCode(value)
        break
      case 'price':
        const numValue = parseCurrency(value)
        formattedValue = formatCurrency(numValue)
        break
      case 'date':
        formattedValue = formatDate(value)
        break
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }))
    
    if (validation !== null) {
      setValidationResults(prev => ({ ...prev, [field]: validation }))
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadStatus('uploading')
    
    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('images', file)
      })

      const response = await fetch('/api/upload?type=ROOM', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      setUploadedImages(prev => [...prev, ...result.data.map((img: any) => img.secure_url)])
      setUploadStatus('success')
    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus('error')
    }
  }

  const ValidationIcon = ({ isValid }: { isValid: boolean | null }) => {
    if (isValid === null) return null
    return isValid ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Data Formatting & Validation Demo</h1>
        <p className="text-muted-foreground">
          Kiểm tra tính năng format dữ liệu tự động và validation chặt chẽ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Formatting Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📝 Data Formatting & Validation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="phone"
                  placeholder="Nhập: 0901234567"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                />
                <ValidationIcon isValid={validationResults.phoneNumber} />
              </div>
              <p className="text-xs text-muted-foreground">
                Tự động format thành định dạng quốc tế: +84 901 234 567
              </p>
            </div>

            {/* CCCD */}
            <div className="space-y-2">
              <Label htmlFor="cccd">Số CCCD</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="cccd"
                  placeholder="Nhập: 001234567890"
                  value={formData.cccd}
                  onChange={(e) => handleInputChange('cccd', e.target.value)}
                />
                <ValidationIcon isValid={validationResults.cccd} />
              </div>
              <p className="text-xs text-muted-foreground">
                Tự động format: 001 234 567890 (12 số)
              </p>
            </div>

            {/* Room Code */}
            <div className="space-y-2">
              <Label htmlFor="room">Mã phòng</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="room"
                  placeholder="Nhập: a101 hoặc B25"
                  value={formData.roomCode}
                  onChange={(e) => handleInputChange('roomCode', e.target.value)}
                />
                <ValidationIcon isValid={validationResults.roomCode} />
              </div>
              <p className="text-xs text-muted-foreground">
                Tự động format: A101, B025 (chữ hoa + số)
              </p>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Giá tiền</Label>
              <Input
                id="price"
                placeholder="Nhập: 5000000"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Tự động format: 5,000,000 ₫
              </p>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Ngày</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Tự động format: dd/MM/yyyy
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Kết quả validation:</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={validationResults.phoneNumber ? "default" : "destructive"}>
                    SĐT: {validationResults.phoneNumber ? "Hợp lệ" : "Không hợp lệ"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={validationResults.cccd ? "default" : "destructive"}>
                    CCCD: {validationResults.cccd ? "Hợp lệ" : "Không hợp lệ"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={validationResults.roomCode ? "default" : "destructive"}>
                    Mã phòng: {validationResults.roomCode ? "Hợp lệ" : "Không hợp lệ"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🖼️ Cloudinary Image Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <Label htmlFor="image-upload" className="cursor-pointer">
                <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Chọn ảnh để upload
                </span>
                <Input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </Label>
              <p className="text-xs text-gray-500 mt-2">
                PNG, JPG, WebP up to 10MB each
              </p>
            </div>

            {uploadStatus === 'uploading' && (
              <div className="text-center">
                <Badge variant="outline">Đang upload...</Badge>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="text-center">
                <Badge className="bg-green-500">
                  Upload thành công!
                </Badge>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="text-center">
                <Badge variant="destructive">
                  Lỗi upload. Vui lòng thử lại.
                </Badge>
              </div>
            )}

            {uploadedImages.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Ảnh đã upload:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {uploadedImages.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p>✅ Tự động resize và optimize ảnh</p>
              <p>✅ CDN toàn cầu với Cloudinary</p>
              <p>✅ Validation file type và size</p>
              <p>✅ Responsive image URLs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🎯 Tính năng hoàn thiện</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✅ Data Formatting</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Auto format số điện thoại VN</li>
                <li>• Auto format CCCD (12 số)</li>
                <li>• Auto format mã phòng</li>
                <li>• Auto format tiền tệ VND</li>
                <li>• Auto format ngày tháng</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✅ Validation Chặt Chẽ</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Validate số điện thoại theo chuẩn VN</li>
                <li>• Validate CCCD 12 số</li>
                <li>• Validate email format</li>
                <li>• Validate ngày tháng</li>
                <li>• Real-time validation feedback</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✅ Cloudinary Integration</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Auto resize & optimize ảnh</li>
                <li>• CDN toàn cầu</li>
                <li>• Multiple image upload</li>
                <li>• Responsive image URLs</li>
                <li>• Secure file validation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}