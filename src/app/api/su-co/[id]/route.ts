import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SuCoGS, PhongGS, KhachThueGS, NguoiDungGS } from '@/lib/googlesheets-models';
import { z } from 'zod';

const updateSuCoSchema = z.object({
  tieuDe: z.string().min(1, 'Tiêu đề là bắt buộc').optional(),
  moTa: z.string().min(1, 'Mô tả là bắt buộc').optional(),
  anhSuCo: z.array(z.string()).optional(),
  loaiSuCo: z.enum(['dienNuoc', 'noiThat', 'vesinh', 'anNinh', 'khac']).optional(),
  mucDoUuTien: z.enum(['thap', 'trungBinh', 'cao', 'khancap']).optional(),
  trangThai: z.enum(['moi', 'dangXuLy', 'daXong', 'daHuy']).optional(),
  nguoiXuLy: z.string().optional(),
  ghiChuXuLy: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const suCo = await SuCoGS.findById(params.id);
    if (!suCo) {
      return NextResponse.json(
        { message: 'Sự cố không tồn tại' },
        { status: 404 }
      );
    }

    // Populate relationships
    if (suCo.phong) {
      const phong = await PhongGS.findById(suCo.phong);
      suCo.phong = phong ? {
        _id: phong._id,
        maPhong: phong.maPhong,
        toaNha: phong.toaNha
      } : null;
    }
    
    if (suCo.khachThue) {
      const khachThue = await KhachThueGS.findById(suCo.khachThue);
      suCo.khachThue = khachThue ? {
        _id: khachThue._id,
        hoTen: khachThue.ten || khachThue.hoTen,
        soDienThoai: khachThue.soDienThoai
      } : null;
    }
    
    if (suCo.nguoiXuLy) {
      const nguoiXuLy = await NguoiDungGS.findById(suCo.nguoiXuLy);
      suCo.nguoiXuLy = nguoiXuLy ? {
        _id: nguoiXuLy._id,
        ten: nguoiXuLy.ten,
        email: nguoiXuLy.email
      } : null;
    }

    return NextResponse.json({
      success: true,
      data: suCo,
    });

  } catch (error) {
    console.error('Error fetching su co:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const validatedData = updateSuCoSchema.parse(body);

    const updateData = {
      ...validatedData,
      updatedAt: new Date().toISOString(),
      ngayCapNhat: new Date().toISOString(),
    };

    // Handle anhSuCo field
    if (validatedData.anhSuCo) {
      updateData.hinhAnh = validatedData.anhSuCo;
    }

    const suCo = await SuCoGS.findByIdAndUpdate(params.id, updateData);

    if (!suCo) {
      return NextResponse.json(
        { message: 'Sự cố không tồn tại' },
        { status: 404 }
      );
    }

    // Populate relationships
    if (suCo.phong) {
      const phong = await PhongGS.findById(suCo.phong);
      suCo.phong = phong ? {
        _id: phong._id,
        maPhong: phong.maPhong,
        toaNha: phong.toaNha
      } : null;
    }
    
    if (suCo.khachThue) {
      const khachThue = await KhachThueGS.findById(suCo.khachThue);
      suCo.khachThue = khachThue ? {
        _id: khachThue._id,
        hoTen: khachThue.ten || khachThue.hoTen,
        soDienThoai: khachThue.soDienThoai
      } : null;
    }
    
    if (suCo.nguoiXuLy) {
      const nguoiXuLy = await NguoiDungGS.findById(suCo.nguoiXuLy);
      suCo.nguoiXuLy = nguoiXuLy ? {
        _id: nguoiXuLy._id,
        ten: nguoiXuLy.ten,
        email: nguoiXuLy.email
      } : null;
    }

    return NextResponse.json({
      success: true,
      data: suCo,
      message: 'Sự cố đã được cập nhật thành công',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error updating su co:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const suCo = await SuCoGS.findById(params.id);
    if (!suCo) {
      return NextResponse.json(
        { message: 'Sự cố không tồn tại' },
        { status: 404 }
      );
    }

    await SuCoGS.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Sự cố đã được xóa thành công',
    });

  } catch (error) {
    console.error('Error deleting su co:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
