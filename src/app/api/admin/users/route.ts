import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NguoiDungGS } from '@/lib/googlesheets-models';
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
  badRequestResponse,
} from '@/lib/api-response';
import { withRetry } from '@/lib/retry-utils';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return unauthorizedResponse('Chỉ quản trị viên mới có quyền truy cập');
    }

    const users = await withRetry(() => NguoiDungGS.find());
    
    // Filter out tenants (khachThue) - only return admins, landlords (chuNha), and staff (nhanVien)
    const filteredUsers = users.filter((user) => {
      const vaiTro = ((user as { vaiTro?: string; role?: string }).vaiTro || (user as { role?: string }).role || '').toLowerCase();
      const isTenant = vaiTro === 'khachthue' || vaiTro === 'tenant';
      return !isTenant;
    });
    
    // Remove password fields and sort by createdAt
    const usersWithoutPassword = filteredUsers
      .map((user) => {
        const { password, matKhau, ...userWithoutPassword } = user as { password?: string; matKhau?: string; [key: string]: unknown };
        return userWithoutPassword;
      })
      .sort((a, b) => {
        const dateA = (a as { createdAt?: string }).createdAt ? new Date((a as { createdAt: string }).createdAt).getTime() : 0;
        const dateB = (b as { createdAt?: string }).createdAt ? new Date((b as { createdAt: string }).createdAt).getTime() : 0;
        return dateB - dateA;
      });
    
    return successResponse(usersWithoutPassword);
  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi lấy danh sách người dùng');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return unauthorizedResponse('Chỉ quản trị viên mới có quyền tạo người dùng');
    }

    const body = await request.json();
    const { name, email, password, phone, role } = body;

    // Validation
    if (!name || !email || !password || !role) {
      return badRequestResponse('Thiếu thông tin bắt buộc');
    }

    // Check if user already exists
    const allUsers = await withRetry(() => NguoiDungGS.find());
    const existingUser = allUsers.find((user) => {
      const userEmail = (user as { email?: string }).email;
      return userEmail?.toLowerCase() === email.toLowerCase();
    });
    
    if (existingUser) {
      return badRequestResponse('Email đã được sử dụng');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await withRetry(() => NguoiDungGS.create({
      _id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      // Vietnamese fields
      ten: name,
      email: email.toLowerCase(),
      matKhau: hashedPassword,
      soDienThoai: phone || '',
      vaiTro: role,
      trangThai: 'hoatDong',
      // English fields
      name,
      password: hashedPassword,
      phone: phone || '',
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ngayTao: new Date().toISOString(),
      ngayCapNhat: new Date().toISOString(),
    }));

    // Return user without password
    const { password: _, matKhau: __, ...userWithoutPassword } = newUser as { password?: string; matKhau?: string; [key: string]: unknown };
    return successResponse(userWithoutPassword, 'Người dùng đã được tạo thành công', 201);
  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi tạo người dùng');
  }
}
