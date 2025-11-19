import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { HopDongGS, PhongGS, KhachThueGS } from '@/lib/googlesheets-models';

export async function GET(request: NextRequest) {
  try {
    console.log('Form data API called');
    
    // Temporarily disable authentication for debugging
    // const session = await getServerSession(authOptions);
    // console.log('Session:', session);
    
    // if (!session) {
    //   console.log('No session found');
    //   return NextResponse.json(
    //     { message: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    // Get all rooms for reference
    const allPhong = await PhongGS.find();
    const phongList = allPhong
      .map((p: any) => ({
        _id: p._id,
        maPhong: p.maPhong,
        toaNha: p.toaNha,
        tang: p.tang,
        dienTich: p.dienTich,
        giaThue: p.giaThue,
        trangThai: p.trangThai
      }))
      .sort((a: any, b: any) => (a.maPhong || '').localeCompare(b.maPhong || ''));

    // Get all tenants for reference
    const allKhachThue = await KhachThueGS.find();
    const khachThueList = allKhachThue
      .map((kt: any) => ({
        _id: kt._id,
        hoTen: kt.ten || kt.hoTen,
        soDienThoai: kt.soDienThoai,
        email: kt.email,
        trangThai: kt.trangThai
      }))
      .sort((a: any, b: any) => (a.hoTen || '').localeCompare(b.hoTen || ''));

    // Get active contracts
    const allHopDong = await HopDongGS.find();
    const hopDongList = allHopDong
      .filter((hd: any) => hd.trangThai === 'hoatDong')
      .map((hd: any) => ({
        _id: hd._id,
        maHopDong: hd.maHopDong || hd.soHopDong,
        phong: hd.phong,
        nguoiDaiDien: hd.nguoiDaiDien,
        giaThue: hd.giaThue,
        giaDien: hd.giaDien,
        giaNuoc: hd.giaNuoc,
        phiDichVu: hd.phiDichVu || [],
        ngayThanhToan: hd.ngayThanhToan,
        trangThai: hd.trangThai,
        chiSoDienBanDau: hd.chiSoDienBanDau || 0,
        chiSoNuocBanDau: hd.chiSoNuocBanDau || 0,
        ngayBatDau: hd.ngayBatDau,
        ngayKetThuc: hd.ngayKetThuc
      }))
      .sort((a: any, b: any) => (a.maHopDong || '').localeCompare(b.maHopDong || ''));

    return NextResponse.json({
      success: true,
      data: {
        hopDongList,
        phongList,
        khachThueList,
      },
    });

  } catch (error) {
    console.error('Error fetching form data:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
