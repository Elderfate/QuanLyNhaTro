import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { NguoiDungGS, ToaNhaGS, PhongGS } from '@/lib/googlesheets-models';

async function createSeedData() {
  try {
    // Tạo admin user với mật khẩu đã hash
    const hashedPassword = await hash('admin123', 12);
    
    const adminUser = await NguoiDungGS.create({
      ten: 'Administrator',
      email: 'admin@example.com',
      matKhau: hashedPassword,
      soDienThoai: '0123456789',
      vaiTro: 'admin',
      trangThai: 'hoatDong',
      anhDaiDien: '',
    });

    // Tạo tòa nhà mẫu
    const toaNha = await ToaNhaGS.create({
      ten: 'Tòa nhà A1',
      diaChi: '123 Đường ABC, Quận 1, TP.HCM',
      moTa: 'Tòa nhà hiện đại, tiện nghi đầy đủ',
      tienIch: ['Thang máy', 'Bảo vệ 24/7', 'Parking'],
      anhToaNha: [],
      trangThai: 'hoatDong',
      chuSoHuu: adminUser._id,
    });

    // Tạo phòng mẫu
    await PhongGS.create({
      soPhong: '101',
      tang: 1,
      dienTich: 25,
      giaThue: 3500000,
      tienCoc: 7000000,
      trangThai: 'trong',
      moTa: 'Phòng đầy đủ nội thất, view đẹp',
      tienNghi: ['Điều hòa', 'Tủ lạnh', 'Giường', 'Tủ quần áo'],
      anhPhong: [],
      toaNha: toaNha._id,
    });

    await PhongGS.create({
      soPhong: '102',
      tang: 1,
      dienTich: 30,
      giaThue: 4000000,
      tienCoc: 8000000,
      trangThai: 'dathue',
      moTa: 'Phòng rộng rãi, thoáng mát',
      tienNghi: ['Điều hòa', 'Tủ lạnh', 'Giường', 'Bàn làm việc'],
      anhPhong: [],
      toaNha: toaNha._id,
    });

    return NextResponse.json({
      success: true,
      message: 'Seed data created successfully for Google Sheets',
      data: {
        adminUser: { id: adminUser._id, email: adminUser.email },
        toaNha: { id: toaNha._id, ten: toaNha.ten },
        totalRooms: 2
      }
    });

  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create seed data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return createSeedData();
}

export async function GET(request: NextRequest) {
  return createSeedData();
}
