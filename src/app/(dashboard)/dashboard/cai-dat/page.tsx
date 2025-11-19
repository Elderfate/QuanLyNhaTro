'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Settings, 
  Type,
  Save,
  Monitor
} from 'lucide-react';

export default function CaiDatPage() {
  const [fontSettings, setFontSettings] = useState({
    fontFamily: 'Inter',
    fontSize: 'medium',
    lineHeight: 'normal',
    fontWeight: 'normal'
  });

  useEffect(() => {
    document.title = 'Cài đặt';
  }, []);

  // Load settings from localStorage when component mounts
  useEffect(() => {
    const savedFontSettings = localStorage.getItem('fontSettings');
    if (savedFontSettings) {
      const parsedSettings = JSON.parse(savedFontSettings);
      setFontSettings(parsedSettings);
    }

    const savedUiSettings = localStorage.getItem('uiSettings');
    if (savedUiSettings) {
      const parsedUiSettings = JSON.parse(savedUiSettings);
      setUiSettings(parsedUiSettings);
      applyTheme(parsedUiSettings.theme);
      applyDensity(parsedUiSettings.density);
    }
  }, []);

  // Apply settings whenever fontSettings changes
  useEffect(() => {
    applyFontSettings();
  }, [fontSettings]);

  const applyFontSettings = () => {
    // Áp dụng font family cho toàn bộ document
    document.documentElement.style.setProperty('--font-family', fontSettings.fontFamily);
    document.body.style.fontFamily = fontSettings.fontFamily;
    
    // Áp dụng font size
    const fontSizeMap: Record<string, string> = {
      'small': '14px',
      'medium': '16px', 
      'large': '18px',
      'extra-large': '20px'
    };
    document.documentElement.style.setProperty('--font-size-base', fontSizeMap[fontSettings.fontSize]);
    document.body.style.fontSize = fontSizeMap[fontSettings.fontSize];
    
    // Áp dụng line height
    const lineHeightMap: Record<string, string> = {
      'tight': '1.2',
      'normal': '1.5',
      'relaxed': '1.75',
      'loose': '2'
    };
    document.documentElement.style.setProperty('--line-height-base', lineHeightMap[fontSettings.lineHeight]);
    document.body.style.lineHeight = lineHeightMap[fontSettings.lineHeight];
    
    // Áp dụng font weight
    const fontWeightMap: Record<string, string> = {
      'light': '300',
      'normal': '400',
      'medium': '500',
      'semibold': '600',
      'bold': '700'
    };
    document.documentElement.style.setProperty('--font-weight-base', fontWeightMap[fontSettings.fontWeight]);
    
    // Áp dụng cho tất cả các elements
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      const element = el as HTMLElement;
      if (!element.style.fontFamily) {
        element.style.fontFamily = fontSettings.fontFamily;
      }
      if (!element.style.lineHeight) {
        element.style.lineHeight = lineHeightMap[fontSettings.lineHeight];
      }
    });
  };

  const [uiSettings, setUiSettings] = useState({
    theme: 'light',
    density: 'comfortable'
  });

  const applyTheme = (theme: string) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (theme === 'auto') {
      // Auto theme based on system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const applyDensity = (density: string) => {
    // Remove existing density classes
    document.body.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
    // Add new density class
    document.body.classList.add(`density-${density}`);
    
    // Apply density styles
    const densityStyles: Record<string, Record<string, string>> = {
      'compact': {
        '--spacing-base': '0.5rem',
        '--padding-base': '0.75rem',
        '--gap-base': '0.5rem'
      },
      'comfortable': {
        '--spacing-base': '1rem',
        '--padding-base': '1rem',
        '--gap-base': '1rem'
      },
      'spacious': {
        '--spacing-base': '1.5rem',
        '--padding-base': '1.5rem',
        '--gap-base': '1.5rem'
      }
    };
    
    Object.entries(densityStyles[density]).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });
  };

  const handleSaveFontSettings = () => {
    console.log('Saving font settings:', fontSettings);
    localStorage.setItem('fontSettings', JSON.stringify(fontSettings));
    alert('Đã lưu cài đặt font chữ thành công!');
  };

  const handleThemeChange = (theme: string) => {
    const newUiSettings = { ...uiSettings, theme };
    setUiSettings(newUiSettings);
    applyTheme(theme);
    localStorage.setItem('uiSettings', JSON.stringify(newUiSettings));
  };

  const handleDensityChange = (density: string) => {
    const newUiSettings = { ...uiSettings, density };
    setUiSettings(newUiSettings);
    applyDensity(density);
    localStorage.setItem('uiSettings', JSON.stringify(newUiSettings));
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Cài đặt giao diện</h1>
        <p className="text-xs md:text-sm text-gray-600">Tùy chỉnh font chữ và giao diện hiển thị</p>
      </div>

      {/* Font Settings */}
          <Card>
            <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Type className="h-4 w-4 md:h-5 md:w-5" />
            Cài đặt Font chữ
          </CardTitle>
              <CardDescription className="text-xs md:text-sm">
            Tùy chỉnh font chữ và kích thước hiển thị cho giao diện
              </CardDescription>
            </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Font Family */}
                <div className="space-y-2">
              <Label htmlFor="fontFamily" className="text-xs md:text-sm">Font chữ</Label>
              <Select 
                value={fontSettings.fontFamily} 
                onValueChange={(value) => setFontSettings(prev => ({ ...prev, fontFamily: value }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter" className="text-sm">Inter</SelectItem>
                  <SelectItem value="Roboto" className="text-sm">Roboto</SelectItem>
                  <SelectItem value="Open Sans" className="text-sm">Open Sans</SelectItem>
                  <SelectItem value="Lato" className="text-sm">Lato</SelectItem>
                  <SelectItem value="Montserrat" className="text-sm">Montserrat</SelectItem>
                  <SelectItem value="Poppins" className="text-sm">Poppins</SelectItem>
                  <SelectItem value="Source Sans Pro" className="text-sm">Source Sans Pro</SelectItem>
                  <SelectItem value="Nunito" className="text-sm">Nunito</SelectItem>
                </SelectContent>
              </Select>
              </div>

            {/* Font Size */}
                <div className="space-y-2">
              <Label htmlFor="fontSize" className="text-xs md:text-sm">Cỡ chữ</Label>
              <Select 
                value={fontSettings.fontSize} 
                onValueChange={(value) => setFontSettings(prev => ({ ...prev, fontSize: value }))}
              >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                  <SelectItem value="small" className="text-sm">Nhỏ</SelectItem>
                  <SelectItem value="medium" className="text-sm">Trung bình</SelectItem>
                  <SelectItem value="large" className="text-sm">Lớn</SelectItem>
                  <SelectItem value="extra-large" className="text-sm">Rất lớn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Line Height */}
              <div className="space-y-2">
              <Label htmlFor="lineHeight" className="text-xs md:text-sm">Khoảng cách dòng</Label>
              <Select 
                value={fontSettings.lineHeight} 
                onValueChange={(value) => setFontSettings(prev => ({ ...prev, lineHeight: value }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tight" className="text-sm">Chặt</SelectItem>
                  <SelectItem value="normal" className="text-sm">Bình thường</SelectItem>
                  <SelectItem value="relaxed" className="text-sm">Thoải mái</SelectItem>
                  <SelectItem value="loose" className="text-sm">Rộng rãi</SelectItem>
                </SelectContent>
              </Select>
              </div>

            {/* Font Weight */}
              <div className="space-y-2">
              <Label htmlFor="fontWeight" className="text-xs md:text-sm">Độ đậm chữ</Label>
              <Select 
                value={fontSettings.fontWeight} 
                onValueChange={(value) => setFontSettings(prev => ({ ...prev, fontWeight: value }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light" className="text-sm">Nhạt</SelectItem>
                  <SelectItem value="normal" className="text-sm">Bình thường</SelectItem>
                  <SelectItem value="medium" className="text-sm">Vừa</SelectItem>
                  <SelectItem value="semibold" className="text-sm">Đậm vừa</SelectItem>
                  <SelectItem value="bold" className="text-sm">Đậm</SelectItem>
                </SelectContent>
              </Select>
                </div>
              </div>

          {/* Preview */}
              <div className="space-y-2">
            <Label className="text-xs md:text-sm">Xem trước</Label>
            <div className="p-3 md:p-4 border rounded-lg bg-gray-50">
              <p 
                className="text-gray-900 text-xs md:text-sm"
                style={{
                  fontFamily: fontSettings.fontFamily,
                  fontSize: fontSettings.fontSize === 'small' ? '14px' : 
                           fontSettings.fontSize === 'medium' ? '16px' :
                           fontSettings.fontSize === 'large' ? '18px' : '20px',
                  lineHeight: fontSettings.lineHeight === 'tight' ? '1.2' :
                             fontSettings.lineHeight === 'normal' ? '1.5' :
                             fontSettings.lineHeight === 'relaxed' ? '1.75' : '2',
                  fontWeight: fontSettings.fontWeight === 'light' ? '300' :
                             fontSettings.fontWeight === 'normal' ? '400' :
                             fontSettings.fontWeight === 'medium' ? '500' :
                             fontSettings.fontWeight === 'semibold' ? '600' : '700'
                }}
              >
                Đây là văn bản mẫu để bạn có thể xem trước cách hiển thị font chữ và cỡ chữ đã chọn. 
                Hệ thống quản lý phòng trọ của chúng tôi cung cấp giao diện thân thiện và dễ sử dụng.
              </p>
                </div>
              </div>

          <Button onClick={handleSaveFontSettings} size="sm" className="w-full">
                <Save className="h-4 w-4 mr-2" />
            Lưu cài đặt font chữ
              </Button>
            </CardContent>
          </Card>

      {/* UI Settings */}
          <Card>
            <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Monitor className="h-4 w-4 md:h-5 md:w-5" />
            Cài đặt giao diện
          </CardTitle>
              <CardDescription className="text-xs md:text-sm">
            Tùy chỉnh giao diện và kích thước hiển thị
              </CardDescription>
            </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
              <Label htmlFor="theme" className="text-xs md:text-sm">Chủ đề giao diện</Label>
              <Select value={uiSettings.theme} onValueChange={handleThemeChange}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light" className="text-sm">Sáng</SelectItem>
                  <SelectItem value="dark" className="text-sm">Tối</SelectItem>
                  <SelectItem value="auto" className="text-sm">Tự động</SelectItem>
                </SelectContent>
              </Select>
              </div>

              <div className="space-y-2">
              <Label htmlFor="density" className="text-xs md:text-sm">Mật độ hiển thị</Label>
              <Select value={uiSettings.density} onValueChange={handleDensityChange}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact" className="text-sm">Chật</SelectItem>
                  <SelectItem value="comfortable" className="text-sm">Thoải mái</SelectItem>
                  <SelectItem value="spacious" className="text-sm">Rộng rãi</SelectItem>
                </SelectContent>
              </Select>
              </div>
              </div>

          <Button 
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              localStorage.setItem('uiSettings', JSON.stringify(uiSettings));
              alert('Đã lưu cài đặt giao diện thành công!');
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Lưu cài đặt giao diện
              </Button>
            </CardContent>
          </Card>
    </div>
  );
}
