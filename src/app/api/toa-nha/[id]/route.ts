import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ToaNhaGS, PhongGS, NguoiDungGS } from '@/lib/googlesheets-models';
import { deleteCloudinaryImages } from '@/lib/cloudinary-utils';
import { z } from 'zod';

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
  tienNghiChung: z.array(z.string()).optional(),
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

    const toaNha = await ToaNhaGS.findById(id);
    if (!toaNha) {
      return NextResponse.json(
        { message: 'Tòa nhà không tồn tại' },
        { status: 404 }
      );
    }

    // Populate chuSoHuu
    if (toaNha.chuSoHuu) {
      const chuSoHuu = await NguoiDungGS.findById(toaNha.chuSoHuu);
      toaNha.chuSoHuu = chuSoHuu ? { _id: chuSoHuu._id, ten: chuSoHuu.ten, email: chuSoHuu.email } : null;
    }

    // Tính tổng số phòng thực tế
    const allPhong = await PhongGS.find();
    const phongCount = allPhong.filter((p: any) => p.toaNha === id).length;
    const toaNhaWithPhongCount = {
      ...toaNha,
      tongSoPhong: phongCount
    };

    return NextResponse.json({
      success: true,
      data: toaNhaWithPhongCount,
    });

  } catch (error) {
    console.error('Error fetching toa nha:', error);
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
    const validatedData = toaNhaSchema.parse(body);

    const { id } = await params;

    const toaNha = await ToaNhaGS.findById(id);
    if (!toaNha) {
      return NextResponse.json(
        { message: 'Tòa nhà không tồn tại' },
        { status: 404 }
      );
    }

    // Check if user has permission to update this toa nha
    if (toaNha.chuSoHuu !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Bạn không có quyền chỉnh sửa tòa nhà này' },
        { status: 403 }
      );
    }

    // Handle image deletion from Cloudinary if images were removed
    const oldImageUrls = Array.isArray(toaNha.anhToaNha) ? toaNha.anhToaNha : [];
    const newImageUrls = Array.isArray(body.anhToaNha) ? body.anhToaNha : [];
    const deletedImageUrls = oldImageUrls.filter((url: string) => !newImageUrls.includes(url));
    
    if (deletedImageUrls.length > 0) {
      try {
        await deleteCloudinaryImages(deletedImageUrls);
        console.log(`Deleted ${deletedImageUrls.length} image(s) from Cloudinary for toa nha ${id}`);
      } catch (error) {
        console.error('Error deleting images from Cloudinary:', error);
        // Continue with update even if Cloudinary deletion fails
      }
    }

    const updatedToaNha = await ToaNhaGS.findByIdAndUpdate(id, {
      ...validatedData,
      anhToaNha: newImageUrls,
      tienNghiChung: validatedData.tienNghiChung || [],
      updatedAt: new Date().toISOString(),
      ngayCapNhat: new Date().toISOString(),
    });

    // Populate chuSoHuu
    if (updatedToaNha && updatedToaNha.chuSoHuu) {
      const chuSoHuu = await NguoiDungGS.findById(updatedToaNha.chuSoHuu);
      updatedToaNha.chuSoHuu = chuSoHuu ? { _id: chuSoHuu._id, ten: chuSoHuu.ten, email: chuSoHuu.email } : null;
    }

    // Tính tổng số phòng thực tế
    const allPhong = await PhongGS.find();
    const phongCount = allPhong.filter((p: any) => p.toaNha === id).length;
    const toaNhaWithPhongCount = {
      ...updatedToaNha,
      tongSoPhong: phongCount
    };

    return NextResponse.json({
      success: true,
      data: toaNhaWithPhongCount,
      message: 'Tòa nhà đã được cập nhật thành công',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Error updating toa nha:', error);
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

    const toaNha = await ToaNhaGS.findById(id);
    if (!toaNha) {
      return NextResponse.json(
        { message: 'Tòa nhà không tồn tại' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this toa nha
    if (toaNha.chuSoHuu !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Bạn không có quyền xóa tòa nhà này' },
        { status: 403 }
      );
    }

    // Check if toa nha has rooms
    const allPhong = await PhongGS.find();
    const roomCount = allPhong.filter((p: any) => p.toaNha === id).length;

    if (roomCount > 0) {
      return NextResponse.json(
        { message: 'Không thể xóa tòa nhà có phòng. Vui lòng xóa tất cả phòng trước.' },
        { status: 400 }
      );
    }

    // Delete images from Cloudinary before deleting the record
    const imageUrls = Array.isArray(toaNha.anhToaNha) ? toaNha.anhToaNha : [];
    if (imageUrls.length > 0) {
      try {
        await deleteCloudinaryImages(imageUrls);
        console.log(`Deleted ${imageUrls.length} image(s) from Cloudinary for toa nha ${id}`);
      } catch (error) {
        console.error('Error deleting images from Cloudinary:', error);
        // Continue with deletion even if Cloudinary deletion fails
      }
    }

    await ToaNhaGS.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Tòa nhà đã được xóa thành công',
    });

  } catch (error) {
    console.error('Error deleting toa nha:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
