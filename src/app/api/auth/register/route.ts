import { NextRequest, NextResponse } from 'next/server';
import { NguoiDungGS } from '@/lib/googlesheets-models';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const registerSchema = z.object({
  ten: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  matKhau: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  soDienThoai: z.string().regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'),
  vaiTro: z.enum(['chuNha', 'nhanVien']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    
    // Check if user already exists
    const allUsers = await NguoiDungGS.find();
    const existingUser = allUsers.find((user: any) => 
      user.email?.toLowerCase() === validatedData.email.toLowerCase() ||
      user.soDienThoai === validatedData.soDienThoai
    );
    
    if (existingUser) {
      return NextResponse.json(
        { message: 'Email hoặc số điện thoại đã được sử dụng' },
        { status: 400 }
      );
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(validatedData.matKhau, salt);
    
    // Create new user
    const newUser = await NguoiDungGS.create({
      _id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ten: validatedData.ten,
      name: validatedData.ten,
      email: validatedData.email.toLowerCase(),
      matKhau: hashedPassword,
      password: hashedPassword,
      soDienThoai: validatedData.soDienThoai,
      phone: validatedData.soDienThoai,
      vaiTro: validatedData.vaiTro,
      role: validatedData.vaiTro,
      trangThai: 'hoatDong',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ngayTao: new Date().toISOString(),
      ngayCapNhat: new Date().toISOString(),
    });
    
    return NextResponse.json(
      { message: 'Đăng ký thành công' },
      { status: 201 }
    );
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Register error:', error);
    return NextResponse.json(
      { message: 'Đã xảy ra lỗi, vui lòng thử lại' },
      { status: 500 }
    );
  }
}
