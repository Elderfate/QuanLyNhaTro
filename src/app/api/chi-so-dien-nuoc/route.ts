import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ChiSoDienNuocGS, PhongGS, NguoiDungGS } from '@/lib/googlesheets-models';
import { z } from 'zod';

const chiSoSchema = z.object({
  phong: z.string().min(1, 'Phòng là bắt buộc'),
  thang: z.number().min(1).max(12, 'Tháng phải từ 1-12'),
  nam: z.number().min(2020, 'Năm phải từ 2020 trở lên'),
  chiSoDienCu: z.number().min(0, 'Chỉ số điện cũ phải lớn hơn hoặc bằng 0'),
  chiSoDienMoi: z.number().min(0, 'Chỉ số điện mới phải lớn hơn hoặc bằng 0'),
  chiSoNuocCu: z.number().min(0, 'Chỉ số nước cũ phải lớn hơn hoặc bằng 0'),
  chiSoNuocMoi: z.number().min(0, 'Chỉ số nước mới phải lớn hơn hoặc bằng 0'),
  anhChiSoDien: z.string().optional(),
  anhChiSoNuoc: z.string().optional(),
  ngayGhi: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const phong = searchParams.get('phong') || '';
    const thang = searchParams.get('thang') || '';
    const nam = searchParams.get('nam') || '';

    // Get all chi so and filter client-side
    let allChiSo = await ChiSoDienNuocGS.find();
    
    if (phong) {
      allChiSo = allChiSo.filter((cs: any) => cs.phong === phong);
    }
    
    if (thang) {
      allChiSo = allChiSo.filter((cs: any) => cs.thang === parseInt(thang));
    }
    
    if (nam) {
      allChiSo = allChiSo.filter((cs: any) => cs.nam === parseInt(nam));
    }

    // Sort by nam, thang
    allChiSo.sort((a: any, b: any) => {
      if (b.nam !== a.nam) return b.nam - a.nam;
      return b.thang - a.thang;
    });

    const total = allChiSo.length;
    const chiSoList = allChiSo.slice((page - 1) * limit, page * limit);

    // Populate relationships
    for (const chiSo of chiSoList) {
      if (chiSo.phong) {
        const phongData = await PhongGS.findById(chiSo.phong);
        chiSo.phong = phongData ? {
          _id: phongData._id,
          maPhong: phongData.maPhong,
          toaNha: phongData.toaNha
        } : null;
      }
      
      if (chiSo.nguoiGhi) {
        const nguoiGhi = await NguoiDungGS.findById(chiSo.nguoiGhi);
        chiSo.nguoiGhi = nguoiGhi ? {
          _id: nguoiGhi._id,
          ten: nguoiGhi.ten,
          email: nguoiGhi.email
        } : null;
      }
    }

    return NextResponse.json({
      success: true,
      data: chiSoList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching chi so dien nuoc:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const validatedData = chiSoSchema.parse(body);

    // Check if phong exists
    const phong = await PhongGS.findById(validatedData.phong);
    if (!phong) {
      return NextResponse.json(
        { message: 'Phòng không tồn tại' },
        { status: 400 }
      );
    }

    // Check if chi so already exists for this phong, thang, nam
    const allChiSo = await ChiSoDienNuocGS.find();
    const existingChiSo = allChiSo.find((cs: any) => 
      cs.phong === validatedData.phong &&
      cs.thang === validatedData.thang &&
      cs.nam === validatedData.nam
    );

    if (existingChiSo) {
      return NextResponse.json(
        { message: 'Chỉ số đã được ghi cho phòng này trong tháng này' },
        { status: 400 }
      );
    }

    // Validate chi so moi >= chi so cu
    if (validatedData.chiSoDienMoi < validatedData.chiSoDienCu) {
      return NextResponse.json(
        { message: 'Chỉ số điện mới phải lớn hơn hoặc bằng chỉ số cũ' },
        { status: 400 }
      );
    }

    if (validatedData.chiSoNuocMoi < validatedData.chiSoNuocCu) {
      return NextResponse.json(
        { message: 'Chỉ số nước mới phải lớn hơn hoặc bằng chỉ số cũ' },
        { status: 400 }
      );
    }

    // Calculate soKwh and soKhoi
    const soKwh = validatedData.chiSoDienMoi - validatedData.chiSoDienCu;
    const soKhoi = validatedData.chiSoNuocMoi - validatedData.chiSoNuocCu;

    const newChiSo = await ChiSoDienNuocGS.create({
      _id: `chiso_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...validatedData,
      nguoiGhi: session.user.id,
      soKwh,
      soKhoi,
      ngayGhi: validatedData.ngayGhi || new Date().toISOString(),
      hinhAnhChiSo: validatedData.anhChiSoDien || validatedData.anhChiSoNuoc || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: newChiSo,
      message: 'Chỉ số điện nước đã được ghi thành công',
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Error creating chi so dien nuoc:', error);
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
        { message: 'ID là bắt buộc' },
        { status: 400 }
      );
    }

    const chiSo = await ChiSoDienNuocGS.findById(id);
    if (!chiSo) {
      return NextResponse.json(
        { message: 'Chỉ số điện nước không tồn tại' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete (only admin or the person who recorded it)
    if (chiSo.nguoiGhi !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Bạn không có quyền xóa chỉ số này' },
        { status: 403 }
      );
    }

    await ChiSoDienNuocGS.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Chỉ số điện nước đã được xóa thành công',
    });

  } catch (error) {
    console.error('Error deleting chi so dien nuoc:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}