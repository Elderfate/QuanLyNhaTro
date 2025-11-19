import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SuCoGS, PhongGS, KhachThueGS, NguoiDungGS } from '@/lib/googlesheets-models';
import { z } from 'zod';

const suCoSchema = z.object({
  phong: z.string().min(1, 'Phòng là bắt buộc'),
  khachThue: z.string().min(1, 'Khách thuê là bắt buộc'),
  tieuDe: z.string().min(1, 'Tiêu đề là bắt buộc'),
  moTa: z.string().min(1, 'Mô tả là bắt buộc'),
  anhSuCo: z.array(z.string()).optional(),
  loaiSuCo: z.enum(['dienNuoc', 'noiThat', 'vesinh', 'anNinh', 'khac']),
  mucDoUuTien: z.enum(['thap', 'trungBinh', 'cao', 'khancap']).optional(),
  trangThai: z.enum(['moi', 'dangXuLy', 'daXong', 'daHuy']).optional(),
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
    const validatedData = suCoSchema.parse(body);

    // Check if phong exists
    const phong = await PhongGS.findById(validatedData.phong);
    if (!phong) {
      return NextResponse.json(
        { message: 'Phòng không tồn tại' },
        { status: 400 }
      );
    }

    // Check if khach thue exists
    const khachThue = await KhachThueGS.findById(validatedData.khachThue);
    if (!khachThue) {
      return NextResponse.json(
        { message: 'Khách thuê không tồn tại' },
        { status: 400 }
      );
    }

    const newSuCo = await SuCoGS.create({
      _id: `suco_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...validatedData,
      anhSuCo: validatedData.anhSuCo || [],
      hinhAnh: validatedData.anhSuCo || [],
      mucDoUuTien: validatedData.mucDoUuTien || 'trungBinh',
      trangThai: validatedData.trangThai || 'moi',
      ngayBaoCao: new Date().toISOString(),
      ngayBao: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: newSuCo,
      message: 'Sự cố đã được báo cáo thành công',
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error creating su co:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
