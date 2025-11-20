import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { HopDongGS, PhongGS, KhachThueGS } from '@/lib/googlesheets-models';
import { updatePhongStatus, updateAllKhachThueStatus } from '@/lib/status-utils';
import { z } from 'zod';

const phiDichVuSchema = z.object({
  ten: z.string().min(1, 'Tên dịch vụ là bắt buộc'),
  gia: z.coerce.number().min(0, 'Giá dịch vụ phải lớn hơn hoặc bằng 0'),
});

const hopDongSchema = z.object({
  maHopDong: z.string().min(1, 'Mã hợp đồng là bắt buộc'),
  phong: z.string().min(1, 'Phòng là bắt buộc'),
  khachThueId: z.array(z.string()).min(1, 'Phải có ít nhất 1 khách thuê'),
  nguoiDaiDien: z.string().min(1, 'Người đại diện là bắt buộc'),
  ngayBatDau: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
  ngayKetThuc: z.string().min(1, 'Ngày kết thúc là bắt buộc'),
  giaThue: z.coerce.number().min(0, 'Giá thuê phải lớn hơn hoặc bằng 0'),
  tienCoc: z.coerce.number().min(0, 'Tiền cọc phải lớn hơn hoặc bằng 0'),
  chuKyThanhToan: z.enum(['thang', 'quy', 'nam']),
  ngayThanhToan: z.coerce.number().min(1).max(31, 'Ngày thanh toán phải từ 1-31'),
  dieuKhoan: z.string().min(1, 'Điều khoản là bắt buộc'),
  giaDien: z.coerce.number().min(0, 'Giá điện phải lớn hơn hoặc bằng 0'),
  giaNuoc: z.coerce.number().min(0, 'Giá nước phải lớn hơn hoặc bằng 0'),
  chiSoDienBanDau: z.coerce.number().min(0, 'Chỉ số điện ban đầu phải lớn hơn hoặc bằng 0'),
  chiSoNuocBanDau: z.coerce.number().min(0, 'Chỉ số nước ban đầu phải lớn hơn hoặc bằng 0'),
  phiDichVu: z.array(phiDichVuSchema).optional(),
  fileHopDong: z.string().optional(),
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
    const validatedData = hopDongSchema.parse(body);

    // Check if phong exists
    const allPhong = await PhongGS.find();
    const phong = allPhong.find((p: any) => p._id === validatedData.phong);
    if (!phong) {
      return NextResponse.json(
        { message: 'Phòng không tồn tại' },
        { status: 400 }
      );
    }

    // Check if all khach thue exist
    const allKhachThue = await KhachThueGS.find();
    const khachThueList = allKhachThue.filter((kt: any) => validatedData.khachThueId.includes(kt._id));
    if (khachThueList.length !== validatedData.khachThueId.length) {
      return NextResponse.json(
        { message: 'Một hoặc nhiều khách thuê không tồn tại' },
        { status: 400 }
      );
    }

    // Check if nguoi dai dien is in khach thue list
    if (!validatedData.khachThueId.includes(validatedData.nguoiDaiDien)) {
      return NextResponse.json(
        { message: 'Người đại diện phải là một trong các khách thuê' },
        { status: 400 }
      );
    }

    // Kiểm tra phòng có hợp đồng đang hoạt động không
    const allHopDong = await HopDongGS.find();
    const existingHopDong = allHopDong.find((hd: any) =>
      hd.phong === validatedData.phong &&
      hd.trangThai === 'hoatDong' && (
        (new Date(hd.ngayBatDau) <= new Date(validatedData.ngayKetThuc) &&
         new Date(hd.ngayKetThuc) >= new Date(validatedData.ngayBatDau))
      )
    );

    if (existingHopDong) {
      return NextResponse.json(
        { message: 'Phòng đã có hợp đồng trong khoảng thời gian này' },
        { status: 400 }
      );
    }

    const newHopDong = await HopDongGS.create({
      ...validatedData,
      ngayBatDau: new Date(validatedData.ngayBatDau).toISOString(),
      ngayKetThuc: new Date(validatedData.ngayKetThuc).toISOString(),
      phiDichVu: validatedData.phiDichVu || [],
      trangThai: 'hoatDong', // Set default status
    });

    console.log(`✅ Created new contract: ${newHopDong._id} for phong: ${validatedData.phong}`);

    // Cập nhật trạng thái phòng và khách thuê SAU KHI hợp đồng đã được tạo
    // Đảm bảo hợp đồng mới đã có trong database trước khi tính toán trạng thái
    // Wait a bit to ensure contract is saved to Google Sheets
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Refresh hopDong data to ensure we have the latest
    console.log(`🔄 Refreshing contract data before status update...`);
    
    // Update phong status - this will fetch fresh contract data
    try {
      await updatePhongStatus(validatedData.phong);
    } catch (error) {
      console.error('Error updating phong status:', error);
      // Continue even if status update fails
    }
    
    // Update khach thue status
    try {
      await updateAllKhachThueStatus(validatedData.khachThueId);
    } catch (error) {
      console.error('Error updating khach thue status:', error);
      // Continue even if status update fails
    }
    
    // Double check - update again after a longer delay to ensure status is correct
    // This handles cases where Google Sheets might have eventual consistency
    setTimeout(async () => {
      try {
        console.log(`🔄 Double-checking phong status after delay...`);
        await updatePhongStatus(validatedData.phong);
      } catch (error) {
        console.error('Error in delayed phong status update:', error);
      }
    }, 1000);

    // Cập nhật phòng với thông tin khách thuê (nguoiDaiDien)
    const nguoiDaiDien = allKhachThue.find((kt: any) => kt._id === validatedData.nguoiDaiDien);
    if (nguoiDaiDien) {
      await PhongGS.findByIdAndUpdate(validatedData.phong, {
        nguoiThue: validatedData.nguoiDaiDien,
        updatedAt: new Date().toISOString(),
        ngayCapNhat: new Date().toISOString(),
      });
    }

    // Cập nhật khách thuê với thông tin phòng đang thuê
    for (const khachThueId of validatedData.khachThueId) {
      await KhachThueGS.findByIdAndUpdate(khachThueId, {
        phongDangThue: validatedData.phong,
        updatedAt: new Date().toISOString(),
        ngayCapNhat: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: newHopDong,
      message: 'Hợp đồng đã được tạo thành công',
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Error creating hop dong:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
