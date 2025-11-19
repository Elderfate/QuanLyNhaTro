import { NextRequest, NextResponse } from 'next/server';
import { KhachThueGS, HopDongGS, HoaDonGS, PhongGS, ToaNhaGS } from '@/lib/googlesheets-models';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Lấy token từ header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'secret');
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Token không hợp lệ' },
        { status: 401 }
      );
    }

    if (decoded.role !== 'khachThue') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Lấy thông tin khách thuê
    const khachThue = await KhachThueGS.findById(decoded.id);
    
    if (!khachThue) {
      return NextResponse.json(
        { success: false, message: 'Khách thuê không tồn tại' },
        { status: 404 }
      );
    }

    // Lấy tất cả hợp đồng và filter
    const allHopDong = await HopDongGS.find();
    const now = new Date();
    const hopDongHienTai = allHopDong.find((hd: any) => {
      const khachThueIds = Array.isArray(hd.khachThueId) ? hd.khachThueId : [hd.khachThueId];
      const ngayBatDau = hd.ngayBatDau ? new Date(hd.ngayBatDau) : null;
      const ngayKetThuc = hd.ngayKetThuc ? new Date(hd.ngayKetThuc) : null;
      
      return khachThueIds.includes(khachThue._id) &&
             hd.trangThai === 'hoatDong' &&
             ngayBatDau && ngayBatDau <= now &&
             ngayKetThuc && ngayKetThuc >= now;
    });

    // Populate phong và toaNha cho hopDongHienTai
    let hopDongWithPopulate = null;
    if (hopDongHienTai) {
      const phong = await PhongGS.findById(hopDongHienTai.phong);
      if (phong) {
        const toaNha = await ToaNhaGS.findById(phong.toaNha);
        hopDongWithPopulate = {
          ...hopDongHienTai,
          phong: {
            ...phong,
            toaNha: toaNha
          }
        };
      }
    }

    // Đếm số hóa đơn chưa thanh toán
    const allHoaDon = await HoaDonGS.find();
    const soHoaDonChuaThanhToan = allHoaDon.filter((hd: any) => 
      hd.khachThue === khachThue._id &&
      ['chuaThanhToan', 'daThanhToanMotPhan', 'quaHan'].includes(hd.trangThai)
    ).length;

    // Lấy hóa đơn gần nhất
    const hoaDonCuaKhach = allHoaDon
      .filter((hd: any) => hd.khachThue === khachThue._id)
      .sort((a: any, b: any) => {
        const dateA = a.ngayTao ? new Date(a.ngayTao).getTime() : 0;
        const dateB = b.ngayTao ? new Date(b.ngayTao).getTime() : 0;
        return dateB - dateA;
      });
    
    const hoaDonGanNhat = hoaDonCuaKhach[0] || null;
    if (hoaDonGanNhat) {
      const phong = await PhongGS.findById(hoaDonGanNhat.phong);
      hoaDonGanNhat.phong = phong;
    }

    return NextResponse.json({
      success: true,
      data: {
        khachThue: {
          _id: khachThue._id,
          hoTen: khachThue.ten || khachThue.hoTen,
          soDienThoai: khachThue.soDienThoai,
          email: khachThue.email,
          cccd: khachThue.soCCCD || khachThue.cccd,
          ngaySinh: khachThue.ngaySinh,
          gioiTinh: khachThue.gioiTinh,
          queQuan: khachThue.queQuan,
          ngheNghiep: khachThue.ngheNghiep,
          trangThai: khachThue.trangThai,
        },
        hopDongHienTai: hopDongWithPopulate,
        soHoaDonChuaThanhToan,
        hoaDonGanNhat
      }
    });

  } catch (error) {
    console.error('Error fetching khach thue info:', error);
    return NextResponse.json(
      { success: false, message: 'Có lỗi xảy ra' },
      { status: 500 }
    );
  }
}

