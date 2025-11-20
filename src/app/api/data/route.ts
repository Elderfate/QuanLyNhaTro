import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  ToaNhaGS,
  PhongGS,
  KhachThueGS,
  HopDongGS,
  HoaDonGS,
  ThanhToanGS,
  SuCoGS,
  ThongBaoGS,
  NguoiDungGS,
} from '@/lib/googlesheets-models';

// Calculate dashboard stats
function calculateStats(
  allPhong: any[],
  allHoaDon: any[],
  allSuCo: any[],
  allHopDong: any[],
  allThanhToan: any[]
) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Calculate room stats
  const totalPhong = allPhong.length;
  const phongTrong = allPhong.filter((p: any) => p.trangThai === 'trong').length;
  const phongDangThue = allPhong.filter((p: any) => p.trangThai === 'dangThue').length;
  const phongBaoTri = allPhong.filter((p: any) => p.trangThai === 'baoTri').length;

  // Calculate revenue stats
  const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

  const thanhToanThang = allThanhToan.filter((tt: any) => {
    const ngayThanhToan = new Date(tt.ngayThanhToan);
    return ngayThanhToan >= startOfMonth && ngayThanhToan <= endOfMonth;
  });
  const doanhThuThang = thanhToanThang.reduce((sum: number, tt: any) => sum + (tt.soTien || 0), 0);

  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

  const thanhToanNam = allThanhToan.filter((tt: any) => {
    const ngayThanhToan = new Date(tt.ngayThanhToan);
    return ngayThanhToan >= startOfYear && ngayThanhToan <= endOfYear;
  });
  const doanhThuNam = thanhToanNam.reduce((sum: number, tt: any) => sum + (tt.soTien || 0), 0);

  // Calculate pending invoices (due in next 7 days)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const hoaDonSapDenHan = allHoaDon.filter((hd: any) => {
    const hanThanhToan = new Date(hd.hanThanhToan);
    return (
      hanThanhToan <= nextWeek &&
      ['chuaThanhToan', 'daThanhToanMotPhan'].includes(hd.trangThai)
    );
  }).length;

  // Calculate pending issues
  const suCoCanXuLy = allSuCo.filter((sc: any) => ['moi', 'dangXuLy'].includes(sc.trangThai)).length;

  // Calculate contracts expiring in next 30 days
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);

  const hopDongSapHetHan = allHopDong.filter((hd: any) => {
    const ngayKetThuc = new Date(hd.ngayKetThuc);
    return ngayKetThuc <= nextMonth && hd.trangThai === 'hoatDong';
  }).length;

  return {
    tongSoPhong: totalPhong,
    phongTrong,
    phongDangThue,
    phongBaoTri,
    doanhThuThang,
    doanhThuNam,
    hoaDonSapDenHan,
    suCoCanXuLy,
    hopDongSapHetHan,
  };
}

// Pre-populate relationships
function populateRelationships(
  toaNha: any[],
  phong: any[],
  khachThue: any[],
  hopDong: any[],
  hoaDon: any[],
  thanhToan: any[],
  suCo: any[],
  thongBao: any[]
) {
  // Create Maps for O(1) lookup
  const toaNhaMap = new Map(toaNha.map((t: any) => [t._id, t]));
  const phongMap = new Map(phong.map((p: any) => [p._id, p]));
  const khachThueMap = new Map(khachThue.map((kt: any) => [kt._id, kt]));
  const hopDongMap = new Map(hopDong.map((hd: any) => [hd._id, hd]));

  // Tính thống kê phòng cho mỗi tòa nhà
  const toaNhaStats = new Map<string, { tongSoPhong: number; phongTrong: number; phongDangThue: number; phongBaoTri: number }>();
  
  phong.forEach((p: any) => {
    const toaNhaId = p.toaNha;
    if (!toaNhaId) return;
    
    if (!toaNhaStats.has(toaNhaId)) {
      toaNhaStats.set(toaNhaId, { tongSoPhong: 0, phongTrong: 0, phongDangThue: 0, phongBaoTri: 0 });
    }
    
    const stats = toaNhaStats.get(toaNhaId)!;
    stats.tongSoPhong++;
    
    if (p.trangThai === 'trong') {
      stats.phongTrong++;
    } else if (p.trangThai === 'dangThue') {
      stats.phongDangThue++;
    } else if (p.trangThai === 'baoTri') {
      stats.phongBaoTri++;
    }
  });

  // Populate phong with toaNha and hopDongHienTai
  const now = new Date();
  const phongWithToaNha = phong.map((p: any) => {
    const toaNhaData = p.toaNha ? toaNhaMap.get(p.toaNha) : null;
    
    // Tìm hợp đồng hiện tại cho phòng này
    const hopDongHienTai = hopDong.find((hd: any) => {
      const ngayBatDau = hd.ngayBatDau ? new Date(hd.ngayBatDau) : null;
      const ngayKetThuc = hd.ngayKetThuc ? new Date(hd.ngayKetThuc) : null;
      // Normalize phong ID - handle both string and object
      let phongId = hd.phong;
      if (typeof phongId === 'object' && phongId !== null) {
        phongId = phongId._id || phongId.id || phongId;
      }
      return String(phongId) === String(p._id) &&
             hd.trangThai === 'hoatDong' &&
             ngayBatDau && ngayBatDau <= now &&
             ngayKetThuc && ngayKetThuc >= now;
    });
    
    // Populate hopDongHienTai nếu có
    let hopDongHienTaiPopulated = null;
    if (hopDongHienTai) {
      const khachThueIds = Array.isArray(hopDongHienTai.khachThueId) 
        ? hopDongHienTai.khachThueId 
        : [hopDongHienTai.khachThueId];
      
      const khachThueList = khachThueIds
        .map((id: string) => khachThueMap.get(id))
        .filter(Boolean)
        .map((kt: any) => ({
          _id: kt._id,
          hoTen: kt.hoTen || kt.ten,
          soDienThoai: kt.soDienThoai,
        }));
      
      const nguoiDaiDienData = hopDongHienTai.nguoiDaiDien 
        ? khachThueMap.get(hopDongHienTai.nguoiDaiDien)
        : null;
      
      hopDongHienTaiPopulated = {
        ...hopDongHienTai,
        phong: {
          _id: p._id,
          maPhong: p.maPhong,
          toaNha: toaNhaData ? {
            _id: toaNhaData._id,
            tenToaNha: toaNhaData.tenToaNha,
            diaChi: toaNhaData.diaChi,
          } : null,
        },
        khachThueId: khachThueList,
        nguoiDaiDien: nguoiDaiDienData ? {
          _id: nguoiDaiDienData._id,
          hoTen: nguoiDaiDienData.hoTen || nguoiDaiDienData.ten,
          soDienThoai: nguoiDaiDienData.soDienThoai,
        } : null,
      };
    }
    
    return {
      ...p,
      toaNha: toaNhaData
        ? {
            _id: toaNhaData._id,
            tenToaNha: toaNhaData.tenToaNha,
            diaChi: toaNhaData.diaChi,
          }
        : null,
      hopDongHienTai: hopDongHienTaiPopulated,
    };
  });

  // Populate hopDong with phong and khachThue
  const hopDongWithRelations = hopDong.map((hd: any) => {
    const phongData = hd.phong ? phongMap.get(hd.phong) : null;
    const khachThueData = hd.khachThue ? khachThueMap.get(hd.khachThue) : null;
    return {
      ...hd,
      phong: phongData
        ? {
            _id: phongData._id,
            maPhong: phongData.maPhong,
            toaNha: phongData.toaNha,
          }
        : null,
      khachThue: khachThueData
        ? {
            _id: khachThueData._id,
            hoTen: khachThueData.hoTen || khachThueData.ten,
            soDienThoai: khachThueData.soDienThoai,
          }
        : null,
    };
  });

  // Populate hoaDon with hopDong
  const hoaDonWithHopDong = hoaDon.map((hd: any) => {
    const hopDongData = hd.hopDong ? hopDongMap.get(hd.hopDong) : null;
    return {
      ...hd,
      hopDong: hopDongData
        ? {
            _id: hopDongData._id,
            maHopDong: hopDongData.maHopDong,
            phong: hopDongData.phong,
            khachThue: hopDongData.khachThue,
          }
        : null,
    };
  });

  // Populate thanhToan with hoaDon
  const hoaDonMap = new Map(hoaDon.map((hd: any) => [hd._id, hd]));
  const thanhToanWithHoaDon = thanhToan.map((tt: any) => {
    const hoaDonData = tt.hoaDon ? hoaDonMap.get(tt.hoaDon) : null;
    return {
      ...tt,
      hoaDon: hoaDonData
        ? {
            _id: hoaDonData._id,
            maHoaDon: hoaDonData.maHoaDon,
            hopDong: hoaDonData.hopDong,
          }
        : null,
    };
  });

  // Populate suCo with phong and khachThue
  const suCoWithRelations = suCo.map((sc: any) => {
    const phongData = sc.phong ? phongMap.get(sc.phong) : null;
    const khachThueData = sc.khachThue ? khachThueMap.get(sc.khachThue) : null;
    return {
      ...sc,
      phong: phongData
        ? {
            _id: phongData._id,
            maPhong: phongData.maPhong,
          }
        : null,
      khachThue: khachThueData
        ? {
            _id: khachThueData._id,
            hoTen: khachThueData.hoTen || khachThueData.ten,
          }
        : null,
    };
  });

  // Populate thongBao with phong and khachThue (handle arrays)
  const thongBaoWithRelations = thongBao.map((tb: any) => {
    // Handle nguoiNhan (can be array of khachThue IDs)
    let nguoiNhan = [];
    if (tb.nguoiNhan) {
      if (Array.isArray(tb.nguoiNhan)) {
        nguoiNhan = tb.nguoiNhan.map((id: string) => {
          const kt = khachThueMap.get(id);
          return kt
            ? {
                _id: kt._id,
                hoTen: kt.hoTen || kt.ten,
                soDienThoai: kt.soDienThoai,
              }
            : null;
        }).filter(Boolean);
      } else if (typeof tb.nguoiNhan === 'string') {
        try {
          const parsed = JSON.parse(tb.nguoiNhan);
          if (Array.isArray(parsed)) {
            nguoiNhan = parsed.map((id: string) => {
              const kt = khachThueMap.get(id);
              return kt
                ? {
                    _id: kt._id,
                    hoTen: kt.hoTen || kt.ten,
                    soDienThoai: kt.soDienThoai,
                  }
                : null;
            }).filter(Boolean);
          }
        } catch {
          // If not JSON, treat as single ID
          const kt = khachThueMap.get(tb.nguoiNhan);
          if (kt) {
            nguoiNhan = [
              {
                _id: kt._id,
                hoTen: kt.hoTen || kt.ten,
                soDienThoai: kt.soDienThoai,
              },
            ];
          }
        }
      }
    }

    // Handle phong (can be array of phong IDs)
    let phongList = [];
    if (tb.phong) {
      if (Array.isArray(tb.phong)) {
        phongList = tb.phong.map((id: string) => {
          const p = phongMap.get(id);
          return p
            ? {
                _id: p._id,
                maPhong: p.maPhong,
              }
            : null;
        }).filter(Boolean);
      } else if (typeof tb.phong === 'string') {
        try {
          const parsed = JSON.parse(tb.phong);
          if (Array.isArray(parsed)) {
            phongList = parsed.map((id: string) => {
              const p = phongMap.get(id);
              return p
                ? {
                    _id: p._id,
                    maPhong: p.maPhong,
                  }
                : null;
            }).filter(Boolean);
          }
        } catch {
          // If not JSON, treat as single ID
          const p = phongMap.get(tb.phong);
          if (p) {
            phongList = [
              {
                _id: p._id,
                maPhong: p.maPhong,
              },
            ];
          }
        }
      }
    }

    return {
      ...tb,
      nguoiNhan,
      phong: phongList,
    };
  });

  // Normalize tienNghiChung for toaNha và thêm thống kê phòng
  const toaNhaNormalized = toaNha.map((tn: any) => {
    let tienNghiChung = tn.tienNghiChung;
    if (typeof tienNghiChung === 'string') {
      try {
        tienNghiChung = JSON.parse(tienNghiChung);
      } catch {
        tienNghiChung = [];
      }
    }
    if (!Array.isArray(tienNghiChung)) {
      tienNghiChung = [];
    }
    
    // Lấy thống kê phòng cho tòa nhà này
    const stats = toaNhaStats.get(tn._id) || { tongSoPhong: 0, phongTrong: 0, phongDangThue: 0, phongBaoTri: 0 };
    
    // Đảm bảo diaChi là object, không phải undefined
    let diaChi = tn.diaChi;
    if (!diaChi || typeof diaChi !== 'object') {
      diaChi = {
        soNha: '',
        duong: '',
        phuong: '',
        quan: '',
        thanhPho: ''
      };
    }
    
    return {
      ...tn,
      tienNghiChung,
      tongSoPhong: stats.tongSoPhong,
      phongTrong: stats.phongTrong,
      phongDangThue: stats.phongDangThue,
      phongBaoTri: stats.phongBaoTri,
      diaChi, // Đảm bảo diaChi luôn là object hợp lệ
    };
  });

  // Populate khachThue with hopDongHienTai
  const khachThueWithHopDong = khachThue.map((kt: any) => {
    // Tìm hợp đồng hiện tại cho khách thuê này
    const hopDongHienTai = hopDong.find((hd: any) => {
      const khachThueIds = Array.isArray(hd.khachThueId) ? hd.khachThueId : (hd.khachThueId ? [hd.khachThueId] : []);
      const ngayBatDau = hd.ngayBatDau ? new Date(hd.ngayBatDau) : null;
      const ngayKetThuc = hd.ngayKetThuc ? new Date(hd.ngayKetThuc) : null;
      // Normalize IDs for comparison
      const ktId = String(kt._id);
      const nguoiDaiDienId = hd.nguoiDaiDien ? String(hd.nguoiDaiDien) : null;
      const khachThueIdsNormalized = khachThueIds.map((id: any) => String(id));
      
      return (khachThueIdsNormalized.includes(ktId) || nguoiDaiDienId === ktId) &&
             hd.trangThai === 'hoatDong' &&
             ngayBatDau && ngayBatDau <= now &&
             ngayKetThuc && ngayKetThuc >= now;
    });
    
    // Populate hopDongHienTai nếu có
    let hopDongHienTaiPopulated = null;
    if (hopDongHienTai) {
      const phongData = hopDongHienTai.phong ? phongMap.get(hopDongHienTai.phong) : null;
      const toaNhaData = phongData?.toaNha ? toaNhaMap.get(phongData.toaNha) : null;
      
      const khachThueIds = Array.isArray(hopDongHienTai.khachThueId) 
        ? hopDongHienTai.khachThueId 
        : [hopDongHienTai.khachThueId];
      
      const khachThueList = khachThueIds
        .map((id: string) => khachThueMap.get(id))
        .filter(Boolean)
        .map((ktItem: any) => ({
          _id: ktItem._id,
          hoTen: ktItem.hoTen || ktItem.ten,
          soDienThoai: ktItem.soDienThoai,
        }));
      
      const nguoiDaiDienData = hopDongHienTai.nguoiDaiDien 
        ? khachThueMap.get(hopDongHienTai.nguoiDaiDien)
        : null;
      
      hopDongHienTaiPopulated = {
        ...hopDongHienTai,
        phong: phongData ? {
          _id: phongData._id,
          maPhong: phongData.maPhong,
          toaNha: toaNhaData ? {
            _id: toaNhaData._id,
            tenToaNha: toaNhaData.tenToaNha,
            diaChi: toaNhaData.diaChi,
          } : null,
        } : null,
        khachThueId: khachThueList,
        nguoiDaiDien: nguoiDaiDienData ? {
          _id: nguoiDaiDienData._id,
          hoTen: nguoiDaiDienData.hoTen || nguoiDaiDienData.ten,
          soDienThoai: nguoiDaiDienData.soDienThoai,
        } : null,
      };
    }
    
    return {
      ...kt,
      hopDongHienTai: hopDongHienTaiPopulated,
    };
  });

  return {
    toaNha: toaNhaNormalized,
    phong: phongWithToaNha,
    khachThue: khachThueWithHopDong,
    hopDong: hopDongWithRelations,
    hoaDon: hoaDonWithHopDong,
    thanhToan: thanhToanWithHoaDon,
    suCo: suCoWithRelations,
    thongBao: thongBaoWithRelations,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Load ALL data in parallel
    const [
      allToaNha,
      allPhong,
      allKhachThue,
      allHopDong,
      allHoaDon,
      allThanhToan,
      allSuCo,
      allThongBao,
      allUsers,
    ] = await Promise.all([
      ToaNhaGS.find(),
      PhongGS.find(),
      KhachThueGS.find(),
      HopDongGS.find(),
      HoaDonGS.find(),
      ThanhToanGS.find(),
      SuCoGS.find(),
      ThongBaoGS.find(),
      NguoiDungGS.find(),
    ]);

    // Calculate stats
    const stats = calculateStats(allPhong, allHoaDon, allSuCo, allHopDong, allThanhToan);

    // Populate relationships
    const populatedData = populateRelationships(
      allToaNha,
      allPhong,
      allKhachThue,
      allHopDong,
      allHoaDon,
      allThanhToan,
      allSuCo,
      allThongBao
    );

    return NextResponse.json({
      success: true,
      data: {
        ...populatedData,
        users: allUsers,
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching app data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

