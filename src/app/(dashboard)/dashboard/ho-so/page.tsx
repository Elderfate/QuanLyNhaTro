'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Edit3, 
  Save, 
  X,
  Camera,
  Key,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    avatar: ''
  });

  useEffect(() => {
    document.title = 'Hồ sơ cá nhân';
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
          avatar: data.avatar || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Không thể tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);
        toast.success('Cập nhật hồ sơ thành công');
        
        // Update session
        await update({
          ...session,
          user: {
            ...session?.user,
            name: formData.name,
            avatar: formData.avatar
          }
        });
      } else {
        toast.error('Cập nhật hồ sơ thất bại');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Có lỗi xảy ra khi cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      avatar: profile?.avatar || ''
    });
    setIsEditing(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Quản trị viên</Badge>;
      case 'chuNha':
        return <Badge variant="default">Chủ nhà</Badge>;
      case 'nhanVien':
        return <Badge variant="secondary">Nhân viên</Badge>;
      default:
        return <Badge variant="outline">Người dùng</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
          <p className="text-xs md:text-sm text-gray-600">Quản lý thông tin tài khoản của bạn</p>
        </div>
        {!isEditing && (
          <Button size="sm" onClick={() => setIsEditing(true)}>
            <Edit3 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Chỉnh sửa</span>
          </Button>
        )}
      </div>

      <Tabs defaultValue="profile" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="text-xs md:text-sm">
            <User className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Thông tin</span>
            <span className="sm:hidden">TT</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs md:text-sm">
            <Key className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Bảo mật</span>
            <span className="sm:hidden">BM</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs md:text-sm">
            <Bell className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Thông báo</span>
            <span className="sm:hidden">TB</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <User className="h-4 w-4 md:h-5 md:w-5" />
                Thông tin cơ bản
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Cập nhật thông tin cá nhân và ảnh đại diện
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
                <Avatar className="h-16 w-16 md:h-20 md:w-20">
                  <AvatarImage src={formData.avatar} alt={formData.name} />
                  <AvatarFallback className="text-base md:text-lg">
                    {getInitials(formData.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2 text-center sm:text-left">
                  <h3 className="text-base md:text-lg font-medium">{formData.name}</h3>
                  {profile?.role && getRoleBadge(profile.role)}
                  {isEditing && (
                    <Button variant="outline" size="sm" className="text-xs md:text-sm">
                      <Camera className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                      Thay đổi ảnh
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs md:text-sm">Họ và tên</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nhập họ và tên"
                      className="text-sm"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 md:p-3 border rounded-md bg-gray-50">
                      <User className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                      <span className="text-sm">{formData.name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs md:text-sm">Email</Label>
                  <div className="flex items-center gap-2 p-2 md:p-3 border rounded-md bg-gray-50">
                    <Mail className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                    <span className="text-sm truncate">{profile?.email}</span>
                  </div>
                  <p className="text-[10px] md:text-xs text-gray-500">Email không thể thay đổi</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs md:text-sm">Số điện thoại</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Nhập số điện thoại"
                      className="text-sm"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 md:p-3 border rounded-md bg-gray-50">
                      <Phone className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                      <span className="text-sm">{formData.phone || 'Chưa cập nhật'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs md:text-sm">Vai trò</Label>
                  <div className="flex items-center gap-2 p-2 md:p-3 border rounded-md bg-gray-50">
                    <Shield className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                    {profile?.role && getRoleBadge(profile.role)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs md:text-sm">Địa chỉ</Label>
                {isEditing ? (
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Nhập địa chỉ"
                    rows={3}
                    className="text-sm"
                  />
                ) : (
                  <div className="flex items-start gap-2 p-2 md:p-3 border rounded-md bg-gray-50">
                    <MapPin className="h-3 w-3 md:h-4 md:w-4 text-gray-500 mt-0.5" />
                    <span className="text-sm">{formData.address || 'Chưa cập nhật'}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-4">
                  <Button size="sm" onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancel} className="w-full sm:w-auto">
                    <X className="h-4 w-4 mr-2" />
                    Hủy
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                Thông tin tài khoản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                  <div>
                    <p className="text-xs md:text-sm font-medium">Ngày tạo tài khoản</p>
                    <p className="text-xs md:text-sm text-gray-600">
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                  <div>
                    <p className="text-xs md:text-sm font-medium">Lần đăng nhập cuối</p>
                    <p className="text-xs md:text-sm text-gray-600">
                      {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleDateString('vi-VN') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Key className="h-4 w-4 md:h-5 md:w-5" />
                Bảo mật tài khoản
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Quản lý mật khẩu và bảo mật tài khoản
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
              <div className="p-3 md:p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                <p className="text-xs md:text-sm text-yellow-800">
                  Tính năng đổi mật khẩu sẽ được cập nhật trong phiên bản tiếp theo.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Bell className="h-4 w-4 md:h-5 md:w-5" />
                Cài đặt thông báo
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Quản lý các thông báo và email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
              <div className="p-3 md:p-4 border rounded-lg bg-blue-50 border-blue-200">
                <p className="text-xs md:text-sm text-blue-800">
                  Tính năng cài đặt thông báo sẽ được cập nhật trong phiên bản tiếp theo.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
