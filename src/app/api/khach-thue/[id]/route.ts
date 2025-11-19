import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { KhachThueGS } from '@/lib/googlesheets-models';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const khachThueSchema = z.object({
  hoTen: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  soDienThoai: z.string().regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ').optional(),
  cccd: z.string().regex(/^[0-9]{12}$/, 'CCCD phải có 12 chữ số'),
  ngaySinh: z.string().min(1, 'Ngày sinh là bắt buộc'),
  gioiTinh: z.enum(['nam', 'nu', 'khac']),
  queQuan: z.string().min(1, 'Quê quán là bắt buộc'),
  anhCCCD: z.object({
    matTruoc: z.string().optional(),
    matSau: z.string().optional(),
  }).optional(),
  ngheNghiep: z.string().optional(),
  matKhau: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const khachThue = await KhachThueGS.findById(id);

    if (!khachThue) {
      return NextResponse.json(
        { message: 'Khách thuê không tồn tại' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: khachThue,
    });

  } catch (error) {
    console.error('Error fetching khach thue:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = khachThueSchema.parse(body);

    const { id } = await params;

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

    // Check if phone or CCCD already exists (excluding current record)
    const allKhachThue = await KhachThueGS.find();
    const existingKhachThue = allKhachThue.find((kt: any) => {
      if (kt._id === id) return false;
      const normalizedStoredPhone = normalizePhone(kt.soDienThoai);
      return normalizedStoredPhone === normalizedInputPhone || 
             (kt.soCCCD || kt.cccd) === validatedData.cccd;
    });

    if (existingKhachThue) {
      return NextResponse.json(
        { message: 'Số điện thoại hoặc CCCD đã được sử dụng' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      ten: validatedData.hoTen,
      hoTen: validatedData.hoTen,
      ngaySinh: validatedData.ngaySinh,
      anhCCCD: validatedData.anhCCCD || { matTruoc: '', matSau: '' },
      soCCCD: validatedData.cccd,
      cccd: validatedData.cccd,
      updatedAt: new Date().toISOString(),
      ngayCapNhat: new Date().toISOString(),
    };

    // Nếu có mật khẩu mới, hash password
    if (validatedData.matKhau) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(validatedData.matKhau, salt);
      updateData.matKhau = hashedPassword;
      updateData.password = hashedPassword;
    } else {
      delete updateData.matKhau;
      delete updateData.password;
    }

    const khachThue = await KhachThueGS.findByIdAndUpdate(id, updateData);

    if (!khachThue) {
      return NextResponse.json(
        { message: 'Khách thuê không tồn tại' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: khachThue,
      message: 'Khách thuê đã được cập nhật thành công',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Error updating khach thue:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const khachThue = await KhachThueGS.findById(id);
    if (!khachThue) {
      return NextResponse.json(
        { message: 'Khách thuê không tồn tại' },
        { status: 404 }
      );
    }

    await KhachThueGS.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Khách thuê đã được xóa thành công',
    });

  } catch (error) {
    console.error('Error deleting khach thue:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
