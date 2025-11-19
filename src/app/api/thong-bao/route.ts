import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ThongBaoGS, NguoiDungGS, PhongGS, ToaNhaGS } from '@/lib/googlesheets-models';
import { z } from 'zod';

const thongBaoSchema = z.object({
  tieuDe: z.string().min(1, 'Tiêu đề là bắt buộc'),
  noiDung: z.string().min(1, 'Nội dung là bắt buộc'),
  loai: z.enum(['chung', 'hoaDon', 'suCo', 'hopDong', 'khac']).optional(),
  nguoiNhan: z.array(z.string()).min(1, 'Phải có ít nhất 1 người nhận'),
  phong: z.array(z.string()).optional(),
  toaNha: z.string().optional(),
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
    const validatedData = thongBaoSchema.parse(body);

    const newThongBao = await ThongBaoGS.create({
      _id: `thongbao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...validatedData,
      nguoiGui: session.user.id,
      loai: validatedData.loai || 'chung',
      phong: validatedData.phong || [],
      toaNha: validatedData.toaNha || '',
      daDoc: [],
      ngayGui: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: newThongBao,
      message: 'Thông báo đã được gửi thành công',
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Error creating thong bao:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'ID thông báo là bắt buộc' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = thongBaoSchema.parse(body);

    const updatedThongBao = await ThongBaoGS.findByIdAndUpdate(id, {
      ...validatedData,
      loai: validatedData.loai || 'chung',
      phong: validatedData.phong || [],
      toaNha: validatedData.toaNha || '',
      updatedAt: new Date().toISOString(),
    });

    if (!updatedThongBao) {
      return NextResponse.json(
        { message: 'Không tìm thấy thông báo' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedThongBao,
      message: 'Cập nhật thông báo thành công',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Error updating thong bao:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'ID thông báo là bắt buộc' },
        { status: 400 }
      );
    }

    const deletedThongBao = await ThongBaoGS.findByIdAndDelete(id);

    if (!deletedThongBao) {
      return NextResponse.json(
        { message: 'Không tìm thấy thông báo' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Xóa thông báo thành công',
    });

  } catch (error) {
    console.error('Error deleting thong bao:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}