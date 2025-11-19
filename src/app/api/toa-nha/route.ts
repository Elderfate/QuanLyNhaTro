import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ToaNhaGS, PhongGS, HopDongGS } from '@/lib/googlesheets-models';
import { z } from 'zod';

const toaNghiEnum = z.enum(['wifi', 'camera', 'baoVe', 'giuXe', 'thangMay', 'sanPhoi', 'nhaVeSinhChung', 'khuBepChung']);

const toaNhaSchema = z.object({
  tenToaNha: z.string().min(1, 'Tên tòa nhà là bắt buộc'),
  diaChi: z.object({
    soNha: z.string().min(1, 'Số nhà là bắt buộc'),
    duong: z.string().min(1, 'Tên đường là bắt buộc'),
    phuong: z.string().min(1, 'Phường/xã là bắt buộc'),
    quan: z.string().min(1, 'Quận/huyện là bắt buộc'),
    thanhPho: z.string().min(1, 'Thành phố là bắt buộc'),
  }),
  moTa: z.string().optional(),
  tienNghiChung: z.array(toaNghiEnum).optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.log('=== POST /api/toa-nha started ===');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'Found' : 'Not found');
    
    if (!session) {
      console.log('No session found, returning 401');
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Session user ID:', session.user.id);
    console.log('Session user role:', session.user.role);

    const body = await request.json();
    console.log('Request body:', body);
    
    const validatedData = toaNhaSchema.parse(body);
    console.log('Validated data:', validatedData);

    const newToaNha = await ToaNhaGS.create({
      _id: `toanha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...validatedData,
      chuSoHuu: session.user.id,
      tienNghiChung: validatedData.tienNghiChung || [],
      tongSoPhong: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ngayTao: new Date().toISOString(),
      ngayCapNhat: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: newToaNha,
      message: 'Tòa nhà đã được tạo thành công',
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json(
        { 
          message: 'Validation error',
          details: error.issues,
          error: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    console.error('Error creating toa nha:', error);
    
    // Hiển thị chi tiết lỗi trong development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error instanceof Error ? error.message : String(error)
      : 'Internal server error';
    
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? {
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined,
          fullError: error
        }
      : undefined;

    return NextResponse.json(
      { 
        message: errorMessage,
        details: errorDetails,
        error: 'SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}
