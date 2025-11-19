import { NextRequest, NextResponse } from 'next/server';
import { ToaNhaGS, PhongGS } from '@/lib/googlesheets-models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';

    // Get all toa nha from Google Sheets
    let toaNhaList = await ToaNhaGS.find();
    
    // Client-side filtering
    if (search) {
      const searchLower = search.toLowerCase();
      toaNhaList = toaNhaList.filter((toa: any) => 
        (toa.tenToaNha && toa.tenToaNha.toLowerCase().includes(searchLower)) ||
        (typeof toa.diaChi === 'string' && toa.diaChi.toLowerCase().includes(searchLower)) ||
        (typeof toa.diaChi === 'object' && (
          (toa.diaChi.duong && toa.diaChi.duong.toLowerCase().includes(searchLower)) ||
          (toa.diaChi.phuong && toa.diaChi.phuong.toLowerCase().includes(searchLower))
        ))
      );
    }

    // Sort by tenToaNha
    toaNhaList.sort((a: any, b: any) => {
      if (a.tenToaNha && b.tenToaNha) {
        return a.tenToaNha.localeCompare(b.tenToaNha);
      }
      return 0;
    });

    // Apply pagination
    const total = toaNhaList.length;
    const startIndex = (page - 1) * limit;
    const paginatedList = toaNhaList.slice(startIndex, startIndex + limit);

    // Select only needed fields
    const filteredData = paginatedList.map((toa: any) => ({
      _id: toa._id,
      tenToaNha: toa.tenToaNha,
      diaChi: toa.diaChi,
      moTa: toa.moTa,
      tienNghiChung: toa.tienNghiChung
    }));

    return NextResponse.json({
      success: true,
      data: filteredData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching public toa nha:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
