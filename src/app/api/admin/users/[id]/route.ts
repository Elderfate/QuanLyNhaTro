import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NguoiDungGS } from '@/lib/googlesheets-models';
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
  badRequestResponse,
} from '@/lib/api-response';
import { withRetry } from '@/lib/retry-utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return unauthorizedResponse('Chỉ quản trị viên mới có quyền cập nhật người dùng');
    }

    const { id } = params;
    const body = await request.json();
    const { name, phone, role, isActive } = body;

    const user = await withRetry(() => NguoiDungGS.findById(id));
    
    if (!user) {
      return notFoundResponse('Người dùng không tồn tại');
    }

    const updatedUser = await withRetry(() => NguoiDungGS.findByIdAndUpdate(id, {
      // Vietnamese fields
      ten: name,
      soDienThoai: phone || (user as { soDienThoai?: string }).soDienThoai,
      vaiTro: role,
      trangThai: isActive ? 'hoatDong' : 'khoa',
      // English fields
      name,
      phone: phone || (user as { phone?: string }).phone,
      role,
      isActive,
      updatedAt: new Date().toISOString(),
      ngayCapNhat: new Date().toISOString(),
    }));
    
    if (!updatedUser) {
      return notFoundResponse('Người dùng không tồn tại');
    }

    // Return user without password
    const { password, matKhau, ...userWithoutPassword } = updatedUser as { password?: string; matKhau?: string; [key: string]: unknown };
    return successResponse(userWithoutPassword, 'Người dùng đã được cập nhật thành công');
  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi cập nhật người dùng');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return unauthorizedResponse('Chỉ quản trị viên mới có quyền xóa người dùng');
    }

    const { id } = params;

    // Prevent admin from deleting themselves
    if (session.user.id === id) {
      return badRequestResponse('Không thể xóa tài khoản của chính bạn');
    }

    const deletedUser = await withRetry(() => NguoiDungGS.findByIdAndDelete(id));
    
    if (!deletedUser) {
      return notFoundResponse('Người dùng không tồn tại');
    }

    return successResponse(null, 'Người dùng đã được xóa thành công');
  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi xóa người dùng');
  }
}
