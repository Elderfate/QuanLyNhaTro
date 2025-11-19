import { NextResponse } from 'next/server';
import { GoogleSheetsDB } from '@/lib/googlesheets';

const sheetsConfig = {
  NguoiDung: [
    '_id', 'ten', 'email', 'matKhau', 'soDienThoai', 'vaiTro', 
    'trangThai', 'anhDaiDien', 'diaChi', 'ngaySinh', 'gioiTinh',
    'createdAt', 'updatedAt'
  ],
  
  ToaNha: [
    '_id', 'tenToaNha', 'diaChi', 'moTa', 'anhToaNha', 'chuSoHuu', 
    'tongSoPhong', 'tienNghiChung', 'ngayTao', 'ngayCapNhat',
    'createdAt', 'updatedAt'
  ],
  
  Phong: [
    '_id', 'maPhong', 'toaNha', 'tang', 'dienTich', 'giaThue', 'tienCoc',
    'moTa', 'anhPhong', 'tienNghi', 'trangThai', 'soNguoiToiDa',
    'ngayTao', 'ngayCapNhat', 'createdAt', 'updatedAt'
  ],
  
  KhachThue: [
    '_id', 'ten', 'soDienThoai', 'email', 'soCCCD', 'ngaySinh',
    'gioiTinh', 'queQuan', 'diaChiHienTai', 'ngheNghiep', 
    'anhCCCD', 'trangThai', 'ghiChu', 'createdAt', 'updatedAt'
  ],
  
  HopDong: [
    '_id', 'soHopDong', 'phong', 'khachThue', 'chuNha', 'ngayBatDau',
    'ngayKetThuc', 'giaThue', 'tienCoc', 'tienDien', 'tienNuoc',
    'tienDichVu', 'quyDinh', 'trangThai', 'fileHopDong', 
    'ghiChu', 'createdAt', 'updatedAt'
  ],
  
  ChiSoDienNuoc: [
    '_id', 'phong', 'thang', 'nam', 'chiSoDienCu', 'chiSoDienMoi',
    'chiSoNuocCu', 'chiSoNuocMoi', 'soKwh', 'soKhoi', 'ngayGhi',
    'nguoiGhi', 'hinhAnhChiSo', 'ghiChu', 'createdAt', 'updatedAt'
  ],
  
  HoaDon: [
    '_id', 'soHoaDon', 'phong', 'khachThue', 'thang', 'nam',
    'tienPhong', 'tienDien', 'tienNuoc', 'tienDichVu', 'tienPhat',
    'giamGia', 'tongTien', 'trangThai', 'hanThanhToan', 'ngayTao',
    'ngayThanhToan', 'phuongThucThanhToan', 'ghiChu', 'createdAt', 'updatedAt'
  ],
  
  ThanhToan: [
    '_id', 'hoaDon', 'soTien', 'phuongThuc', 'ngayThanhToan',
    'nguoiThu', 'ghiChu', 'hinhAnhBienLai', 'trangThai',
    'maGiaoDich', 'createdAt', 'updatedAt'
  ],
  
  SuCo: [
    '_id', 'tieuDe', 'moTa', 'phong', 'nguoiBao', 'loaiSuCo',
    'mucDoUuTien', 'trangThai', 'ngayBao', 'ngayXuLy', 'nguoiXuLy',
    'chiPhiSuaChua', 'hinhAnh', 'ghiChu', 'createdAt', 'updatedAt'
  ],
  
  ThongBao: [
    '_id', 'tieuDe', 'noiDung', 'loai', 'nguoiGui', 'nguoiNhan',
    'trangThai', 'ngayGui', 'ngayDoc', 'uu_tien', 'url_lienKet',
    'createdAt', 'updatedAt'
  ]
};

export async function GET() {
  try {
    const db = new GoogleSheetsDB({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID!,
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL!,
      privateKey: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    });

    await db.connect();
    
    const results = [];
    
    // Tạo tất cả sheets với headers
    for (const [sheetName, headers] of Object.entries(sheetsConfig)) {
      try {
        // Kiểm tra sheet đã tồn tại chưa
        let sheet = (db as any).doc.sheetsByTitle[sheetName];
        
        if (!sheet) {
          // Tạo sheet mới với headers
          sheet = await (db as any).doc.addSheet({ 
            title: sheetName,
            headerValues: headers
          });
          results.push({
            sheet: sheetName,
            status: 'created',
            headers: headers.length,
            columns: headers
          });
        } else {
          // Sheet đã tồn tại, load headers để kiểm tra
          await sheet.loadHeaderRow();
          
          // Kiểm tra có đủ headers không
          const currentHeaders = sheet.headerValues || [];
          const missingHeaders = headers.filter(h => !currentHeaders.includes(h));
          
          if (missingHeaders.length > 0) {
            // Cập nhật headers nếu thiếu
            await sheet.setHeaderRow(headers);
            results.push({
              sheet: sheetName,
              status: 'updated',
              headers: headers.length,
              addedColumns: missingHeaders,
              columns: headers
            });
          } else {
            results.push({
              sheet: sheetName,
              status: 'exists',
              headers: currentHeaders.length,
              columns: currentHeaders
            });
          }
        }
      } catch (error) {
        results.push({
          sheet: sheetName,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialization completed',
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      totalSheets: Object.keys(sheetsConfig).length,
      results
    });

  } catch (error) {
    console.error('Init database error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to initialize database',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST method để force recreate sheets
export async function POST() {
  try {
    const db = new GoogleSheetsDB({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID!,
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL!,
      privateKey: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    });

    await db.connect();
    
    const results = [];
    
    // Force tạo lại tất cả sheets (trừ sheet đầu tiên)
    for (const [sheetName, headers] of Object.entries(sheetsConfig)) {
      try {
        // Xóa sheet cũ nếu tồn tại (nhưng không xóa sheet đầu tiên)
        const existingSheet = (db as any).doc.sheetsByTitle[sheetName];
        if (existingSheet && existingSheet.index !== 0) {
          await existingSheet.delete();
        }
        
        // Tạo sheet mới nếu không tồn tại hoặc đã xóa
        if (!existingSheet || existingSheet.index !== 0) {
          const newSheet = await (db as any).doc.addSheet({ 
            title: sheetName,
            headerValues: headers
          });
          
          results.push({
            sheet: sheetName,
            status: 'recreated',
            headers: headers.length,
            columns: headers
          });
        } else {
          // Sheet đầu tiên, chỉ update headers
          await existingSheet.setHeaderRow(headers);
          results.push({
            sheet: sheetName,
            status: 'updated_first_sheet',
            headers: headers.length,
            columns: headers
          });
        }
        
      } catch (error) {
        results.push({
          sheet: sheetName,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database recreated successfully',
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      totalSheets: Object.keys(sheetsConfig).length,
      results
    });

  } catch (error) {
    console.error('Recreate database error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to recreate database',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}