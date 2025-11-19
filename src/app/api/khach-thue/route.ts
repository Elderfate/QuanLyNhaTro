import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { KhachThueGS, HopDongGS, PhongGS } from '@/lib/googlesheets-models';
import { updateKhachThueStatus } from '@/lib/status-utils';
import { z } from 'zod';

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

export async function POST(request: NextRequest) {
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
    
    // Check if phone or CCCD already exists
    const allKhachThue = await KhachThueGS.find();
    const existingKhachThue = allKhachThue.find((kt: any) => {
      const normalizedStoredPhone = normalizePhone(kt.soDienThoai);
      return normalizedStoredPhone === normalizedInputPhone || 
             kt.cccd === validatedData.cccd;
    });

    if (existingKhachThue) {
      return NextResponse.json(
        { message: 'Số điện thoại hoặc CCCD đã được sử dụng' },
        { status: 400 }
      );
    }

    const newKhachThue = await KhachThueGS.create({
      ...validatedData,
      ngaySinh: new Date(validatedData.ngaySinh).toISOString(),
      anhCCCD: validatedData.anhCCCD || { matTruoc: '', matSau: '' },
      trangThai: 'chuaThue', // Mặc định là chưa thuê
    });

    // TODO: Implement updateKhachThueStatus for Google Sheets if needed
    // await updateKhachThueStatus(newKhachThue._id.toString());

    return NextResponse.json({
      success: true,
      data: newKhachThue,
      message: 'Khách thuê đã được tạo thành công',
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Error creating khach thue:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
