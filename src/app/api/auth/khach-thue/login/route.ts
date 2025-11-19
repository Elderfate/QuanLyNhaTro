import { NextRequest, NextResponse } from 'next/server';
import { KhachThueGS } from '@/lib/googlesheets-models';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const loginSchema = z.object({
  soDienThoai: z.string().regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'),
  matKhau: z.string().min(1, 'Mật khẩu là bắt buộc'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Normalize phone number for comparison
    const normalizePhone = (phone: string | number | null | undefined): string => {
      if (!phone) return '';
      const phoneStr = String(phone).replace(/\D/g, ''); // Remove non-digits
      // If it's 9-10 digits without leading zero, add it
      if (/^\d{9,10}$/.test(phoneStr) && !phoneStr.startsWith('0')) {
        return '0' + phoneStr;
      }
      return phoneStr;
    };
    
    const normalizedInputPhone = normalizePhone(validatedData.soDienThoai);
    
    // Tìm khách thuê theo số điện thoại (normalized)
    const allKhachThue = await KhachThueGS.find();
    const khachThue = allKhachThue.find((kt: any) => {
      const normalizedStoredPhone = normalizePhone(kt.soDienThoai);
      return normalizedStoredPhone === normalizedInputPhone;
    });

    if (!khachThue) {
      return NextResponse.json(
        { success: false, message: 'Số điện thoại hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // Kiểm tra xem khách thuê đã có mật khẩu chưa
    if (!khachThue.matKhau) {
      return NextResponse.json(
        { success: false, message: 'Tài khoản chưa được kích hoạt. Vui lòng liên hệ quản lý để tạo mật khẩu.' },
        { status: 401 }
      );
    }

    // So sánh mật khẩu
    const passwordToCheck = khachThue.password || khachThue.matKhau;
    const isPasswordValid = await bcrypt.compare(validatedData.matKhau, passwordToCheck);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Số điện thoại hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // Tạo JWT token
    const token = jwt.sign(
      { 
        id: khachThue._id,
        soDienThoai: khachThue.soDienThoai,
        hoTen: khachThue.ten || khachThue.hoTen,
        role: 'khachThue'
      },
      process.env.NEXTAUTH_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Trả về thông tin khách thuê (không bao gồm mật khẩu)
    const khachThueData = {
      _id: khachThue._id,
      hoTen: khachThue.ten || khachThue.hoTen,
      soDienThoai: khachThue.soDienThoai,
      email: khachThue.email,
      cccd: khachThue.soCCCD || khachThue.cccd,
      trangThai: khachThue.trangThai,
    };

    return NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        khachThue: khachThueData,
        token
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Error logging in:', error);
    return NextResponse.json(
      { success: false, message: 'Có lỗi xảy ra khi đăng nhập' },
      { status: 500 }
    );
  }
}

