import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PhongGS, ToaNhaGS, HopDongGS } from '@/lib/googlesheets-models';
import { updatePhongStatus } from '@/lib/status-utils';
import { z } from 'zod';

const phongSchema = z.object({
  maPhong: z.string().min(1, 'Mã phòng là bắt buộc'),
  toaNha: z.string().min(1, 'Tòa nhà là bắt buộc'),
  tang: z.number().min(0, 'Tầng phải lớn hơn hoặc bằng 0'),
  dienTich: z.number().min(1, 'Diện tích phải lớn hơn 0'),
  giaThue: z.number().min(0, 'Giá thuê phải lớn hơn hoặc bằng 0'),
  tienCoc: z.number().min(0, 'Tiền cọc phải lớn hơn hoặc bằng 0'),
  moTa: z.string().optional(),
  anhPhong: z.array(z.string()).optional(),
  tienNghi: z.array(z.string()).optional(),
  soNguoiToiDa: z.number().min(1, 'Số người tối đa phải lớn hơn 0').max(10, 'Số người tối đa không được quá 10'),
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

    // Cập nhật trạng thái phòng trước khi trả về
    await updatePhongStatus(id);

    const phong = await PhongGS.findById(id);
    if (!phong) {
      return NextResponse.json(
        { message: 'Phòng không tồn tại' },
        { status: 404 }
      );
    }

    // Populate toaNha
    if (phong.toaNha) {
      const toaNha = await ToaNhaGS.findById(phong.toaNha);
      phong.toaNha = toaNha ? {
        _id: toaNha._id,
        tenToaNha: toaNha.tenToaNha,
        diaChi: toaNha.diaChi
      } : null;
    }

    return NextResponse.json({
      success: true,
      data: phong,
    });

  } catch (error) {
    console.error('Error fetching phong:', error);
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
    const validatedData = phongSchema.parse(body);

    const { id } = await params;

    // Check if toa nha exists
    const toaNha = await ToaNhaGS.findById(validatedData.toaNha);
    if (!toaNha) {
      return NextResponse.json(
        { message: 'Tòa nhà không tồn tại' },
        { status: 400 }
      );
    }

    const phong = await PhongGS.findByIdAndUpdate(id, {
      ...validatedData,
      anhPhong: validatedData.anhPhong || [],
      tienNghi: validatedData.tienNghi || [],
      updatedAt: new Date().toISOString(),
      ngayCapNhat: new Date().toISOString(),
    });

    if (!phong) {
      return NextResponse.json(
        { message: 'Phòng không tồn tại' },
        { status: 404 }
      );
    }

    // Cập nhật trạng thái dựa trên hợp đồng sau khi cập nhật phòng
    await updatePhongStatus(id);

    // Lấy lại dữ liệu với trạng thái đã cập nhật
    const updatedPhong = await PhongGS.findById(id);
    
    // Populate toaNha
    if (updatedPhong && updatedPhong.toaNha) {
      const toaNhaData = await ToaNhaGS.findById(updatedPhong.toaNha);
      updatedPhong.toaNha = toaNhaData ? {
        _id: toaNhaData._id,
        tenToaNha: toaNhaData.tenToaNha,
        diaChi: toaNhaData.diaChi
      } : null;
    }

    return NextResponse.json({
      success: true,
      data: updatedPhong,
      message: 'Phòng đã được cập nhật thành công',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Error updating phong:', error);
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

    const phong = await PhongGS.findById(id);
    if (!phong) {
      return NextResponse.json(
        { message: 'Phòng không tồn tại' },
        { status: 404 }
      );
    }

    await PhongGS.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Phòng đã được xóa thành công',
    });

  } catch (error) {
    console.error('Error deleting phong:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
