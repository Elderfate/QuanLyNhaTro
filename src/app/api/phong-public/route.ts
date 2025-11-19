import { NextRequest, NextResponse } from 'next/server';
import { PhongGS, ToaNhaGS } from '@/lib/googlesheets-models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const toaNha = searchParams.get('toaNha') || '';
    const trangThai = searchParams.get('trangThai') || '';

    // Get all phong and toa nha from Google Sheets
    let phongList = await PhongGS.find();
    const allToaNha = await ToaNhaGS.find();
    
    // Client-side filtering
    if (search) {
      const searchLower = search.toLowerCase();
      phongList = phongList.filter((phong: any) => 
        (phong.maPhong && phong.maPhong.toLowerCase().includes(searchLower)) ||
        (phong.moTa && phong.moTa.toLowerCase().includes(searchLower))
      );
    }
    
    if (toaNha && toaNha !== 'all') {
      phongList = phongList.filter((phong: any) => phong.toaNha === toaNha);
    }
    
    if (trangThai && trangThai !== 'all') {
      phongList = phongList.filter((phong: any) => phong.trangThai === trangThai);
    }

    // Chỉ lấy phòng có ảnh hoặc phòng trống
    phongList = phongList.filter((phong: any) => 
      (phong.anhPhong && Array.isArray(phong.anhPhong) && phong.anhPhong.length > 0) ||
      phong.trangThai === 'trong'
    );

    // Sort by maPhong
    phongList.sort((a: any, b: any) => {
      if (a.maPhong && b.maPhong) {
        return a.maPhong.localeCompare(b.maPhong);
      }
      return 0;
    });

    // Populate toaNha data
    const phongListWithToaNha = phongList.map((phong: any) => {
      const toaNhaData = allToaNha.find((t: any) => t._id === phong.toaNha);
      return {
        ...phong,
        toaNha: toaNhaData ? {
          _id: toaNhaData._id,
          tenToaNha: toaNhaData.tenToaNha,
          diaChi: toaNhaData.diaChi
        } : null
      };
    });

    // Apply pagination
    const total = phongListWithToaNha.length;
    const startIndex = (page - 1) * limit;
    const paginatedList = phongListWithToaNha.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginatedList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching public phong:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
