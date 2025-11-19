'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useUsersQuery } from '@/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
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
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  Mail, 
  Phone,
  Calendar,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { UserDataTable } from './table';

interface User {
  _id: string;
  name?: string;
  ten?: string;
  email: string;
  phone?: string;
  soDienThoai?: string;
  role?: string;
  vaiTro?: string;
  avatar?: string;
  anhDaiDien?: string;
  createdAt: string;
  lastLogin?: string;
  isActive?: boolean;
  trangThai?: string;
}

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
}

export default function AccountManagementPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { data: usersData = [], isLoading: loading, refetch } = useUsersQuery();
  const users = usersData as User[];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [createUserData, setCreateUserData] = useState<CreateUserData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'nhanVien'
  });
  const [editUserData, setEditUserData] = useState({
    name: '',
    phone: '',
    role: '',
    isActive: true
  });

  useEffect(() => {
    document.title = 'Quản lý Tài khoản';
  }, []);

  const handleRefresh = async () => {
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['users'] });
    toast.success('Đã tải dữ liệu mới nhất');
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createUserData),
      });

      if (response.ok) {
        toast.success('Tạo tài khoản thành công');
        setIsCreateDialogOpen(false);
        setCreateUserData({
          name: '',
          email: '',
          password: '',
          phone: '',
          role: 'nhanVien'
        });
        queryClient.invalidateQueries({ queryKey: ['users'] });
        await refetch();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Tạo tài khoản thất bại');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Có lỗi xảy ra khi tạo tài khoản');
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editUserData),
      });

      if (response.ok) {
        toast.success('Cập nhật tài khoản thành công');
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        queryClient.invalidateQueries({ queryKey: ['users'] });
        await refetch();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Cập nhật tài khoản thất bại');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Có lỗi xảy ra khi cập nhật tài khoản');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['users'] });
        toast.success('Xóa tài khoản thành công');
        await refetch();
      } else{
        const error = await response.json();
        toast.error(error.message || 'Xóa tài khoản thất bại');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Có lỗi xảy ra khi xóa tài khoản');
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditUserData({
      name: getUserName(user),
      phone: getUserPhone(user),
      role: getUserRole(user),
      isActive: getUserIsActive(user)
    });
    setIsEditDialogOpen(true);
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

  // Helper functions to safely get user data
  const getUserName = (user: User) => user.name || user.ten || 'Không có tên';
  const getUserPhone = (user: User) => user.phone || user.soDienThoai || '';
  const getUserRole = (user: User) => user.role || user.vaiTro || 'nhanVien';
  const getUserAvatar = (user: User) => user.avatar || user.anhDaiDien || '';
  const getUserIsActive = (user: User) => user.isActive !== undefined ? user.isActive : (user.trangThai === 'hoatDong');

  const filteredUsers = users.filter(user =>
    (user.name || user.ten || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (session?.user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Bạn cần quyền quản trị viên để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách người dùng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Quản lý tài khoản</h1>
          <p className="text-xs md:text-sm text-gray-600">Quản lý người dùng và phân quyền hệ thống</p>
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
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Tạo tài khoản</span>
            <span className="sm:hidden">Tạo</span>
          </Button>
        </div>
      </div>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">Tạo tài khoản mới</DialogTitle>
              <DialogDescription className="text-xs md:text-sm">
                Tạo tài khoản người dùng mới cho hệ thống
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 md:gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs md:text-sm">Họ và tên</Label>
                <Input
                  id="name"
                  value={createUserData.name}
                  onChange={(e) => setCreateUserData({ ...createUserData, name: e.target.value })}
                  placeholder="Nhập họ và tên"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs md:text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={createUserData.email}
                  onChange={(e) => setCreateUserData({ ...createUserData, email: e.target.value })}
                  placeholder="Nhập email"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs md:text-sm">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  value={createUserData.password}
                  onChange={(e) => setCreateUserData({ ...createUserData, password: e.target.value })}
                  placeholder="Nhập mật khẩu"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs md:text-sm">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={createUserData.phone}
                  onChange={(e) => setCreateUserData({ ...createUserData, phone: e.target.value })}
                  placeholder="Nhập số điện thoại"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-xs md:text-sm">Vai trò</Label>
                <Select value={createUserData.role} onValueChange={(value) => setCreateUserData({ ...createUserData, role: value })}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nhanVien" className="text-sm">Nhân viên</SelectItem>
                    <SelectItem value="chuNha" className="text-sm">Chủ nhà</SelectItem>
                    <SelectItem value="admin" className="text-sm">Quản trị viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto">
                Hủy
              </Button>
              <Button size="sm" onClick={handleCreateUser} className="w-full sm:w-auto">
                Tạo tài khoản
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

     

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 md:gap-4 lg:gap-6">
        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Tổng người dùng</p>
              <p className="text-base md:text-2xl font-bold">{users.length}</p>
            </div>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Quản trị viên</p>
              <p className="text-base md:text-2xl font-bold text-red-600">
                {users.filter(u => getUserRole(u) === 'admin').length}
              </p>
            </div>
            <Shield className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Chủ nhà</p>
              <p className="text-base md:text-2xl font-bold text-blue-600">
                {users.filter(u => getUserRole(u) === 'chuNha').length}
              </p>
            </div>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-medium text-gray-600">Nhân viên</p>
              <p className="text-base md:text-2xl font-bold text-green-600">
                {users.filter(u => getUserRole(u) === 'nhanVien').length}
              </p>
            </div>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Danh sách người dùng
          </CardTitle>
          <CardDescription>
            Quản lý tất cả tài khoản trong hệ thống ({filteredUsers.length} người dùng)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <UserDataTable
            data={filteredUsers}
            onEdit={openEditDialog}
            onDelete={handleDeleteUser}
            currentUserId={session?.user?.id}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Danh sách người dùng</h2>
          <span className="text-sm text-gray-500">{filteredUsers.length} người dùng</span>
        </div>

        {/* Mobile Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </div>

        {/* Mobile Card List */}
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const isCurrentUser = session?.user?.id === user._id;
            
            return (
              <Card key={user._id} className="p-4">
                <div className="space-y-3">
                  {/* Header with avatar and info */}
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={getUserAvatar(user)} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getInitials(getUserName(user))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{getUserName(user)}</h3>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        </div>
                        {getRoleBadge(getUserRole(user))}
                      </div>
                      {isCurrentUser && (
                        <Badge variant="outline" className="mt-1 text-xs">Bạn</Badge>
                      )}
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-1 text-sm border-t pt-2">
                    {getUserPhone(user) && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-3 w-3" />
                        <span>{getUserPhone(user)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <Calendar className="h-3 w-3" />
                      <span>Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="border-t pt-2">
                    <Badge variant={getUserIsActive(user) ? "default" : "secondary"} className="text-xs">
                      {getUserIsActive(user) ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </Badge>
                  </div>

                  {/* Action buttons */}
                  {!isCurrentUser && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                        className="flex-1"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Sửa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user._id)}
                        className="flex-1 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Xóa
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Không có người dùng nào</p>
          </div>
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Chỉnh sửa tài khoản</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Cập nhật thông tin tài khoản người dùng
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 md:gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-xs md:text-sm">Họ và tên</Label>
              <Input
                id="edit-name"
                value={editUserData.name}
                onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                placeholder="Nhập họ và tên"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone" className="text-xs md:text-sm">Số điện thoại</Label>
              <Input
                id="edit-phone"
                value={editUserData.phone}
                onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                placeholder="Nhập số điện thoại"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role" className="text-xs md:text-sm">Vai trò</Label>
              <Select value={editUserData.role} onValueChange={(value) => setEditUserData({ ...editUserData, role: value })}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nhanVien" className="text-sm">Nhân viên</SelectItem>
                  <SelectItem value="chuNha" className="text-sm">Chủ nhà</SelectItem>
                  <SelectItem value="admin" className="text-sm">Quản trị viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto">
              Hủy
            </Button>
            <Button size="sm" onClick={handleEditUser} className="w-full sm:w-auto">
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
