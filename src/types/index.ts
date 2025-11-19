// Types cho hệ thống quản lý phòng trọ

export interface DiaChi {
  soNha: string;
  duong: string;
  phuong: string;
  quan: string;
  thanhPho: string;
}

export interface AnhCCCD {
  matTruoc: string;
  matSau: string;
}

export interface ThongTinChuyenKhoan {
  nganHang: string;
  soGiaoDich: string;
}

export interface PhiDichVu {
  ten: string;
  gia: number;
}

export interface NguoiDung {
  _id?: string;
  ten: string;
  email: string;
  matKhau: string;
  soDienThoai: string;
  vaiTro: 'admin' | 'chuNha' | 'nhanVien';
  anhDaiDien?: string;
  trangThai: 'hoatDong' | 'khoa';
  ngayTao: Date;
  ngayCapNhat: Date;
}

export interface ToaNha {
  _id?: string;
  tenToaNha: string;
  diaChi: DiaChi;
  moTa?: string;
  anhToaNha: string[];
  chuSoHuu: string; // ObjectId ref NguoiDung
  tongSoPhong: number;
  tienNghiChung: string[];
  ngayTao: Date;
  ngayCapNhat: Date;
}

export interface Phong {
  _id?: string;
  maPhong: string;
  toaNha: string; // ObjectId ref ToaNha
  tang: number;
  dienTich: number;
  giaThue: number;
  tienCoc: number;
  moTa?: string;
  anhPhong: string[];
  tienNghi: string[];
  trangThai: 'trong' | 'daDat' | 'dangThue' | 'baoTri';
  soNguoiToiDa: number;
  ngayTao: Date;
  ngayCapNhat: Date;
  hopDongHienTai?: {
    _id: string;
    khachThueId: Array<{
      _id: string;
      hoTen: string;
      soDienThoai: string;
    }>;
    nguoiDaiDien: {
      _id: string;
      hoTen: string;
      soDienThoai: string;
    };
  };
}

export interface KhachThue {
  _id?: string;
  hoTen: string;
  soDienThoai: string;
  email?: string;
  cccd: string;
  ngaySinh: Date;
  gioiTinh: 'nam' | 'nu' | 'khac';
  queQuan: string;
  anhCCCD: AnhCCCD;
  ngheNghiep?: string;
  matKhau?: string;
  trangThai: 'dangThue' | 'daTraPhong' | 'chuaThue';
  ngayTao: Date;
  ngayCapNhat: Date;
  hopDongHienTai?: {
    _id: string;
    phong: {
      _id: string;
      maPhong: string;
      toaNha: {
        _id: string;
        tenToaNha: string;
      };
    };
  };
}

export interface HopDong {
  _id?: string;
  maHopDong: string;
  phong: string; // ObjectId ref Phong
  khachThueId: string[]; // ObjectId[] ref KhachThue
  nguoiDaiDien: string; // ObjectId ref KhachThue
  ngayBatDau: Date;
  ngayKetThuc: Date;
  giaThue: number;
  tienCoc: number;
  chuKyThanhToan: 'thang' | 'quy' | 'nam';
  ngayThanhToan: number;
  dieuKhoan: string;
  giaDien: number;
  giaNuoc: number;
  chiSoDienBanDau: number;
  chiSoNuocBanDau: number;
  phiDichVu: PhiDichVu[];
  trangThai: 'hoatDong' | 'hetHan' | 'daHuy';
  fileHopDong?: string;
  ngayTao: Date;
  ngayCapNhat: Date;
}

export interface ChiSoDienNuoc {
  _id?: string;
  phong: string; // ObjectId ref Phong
  thang: number;
  nam: number;
  chiSoDienCu: number;
  chiSoDienMoi: number;
  soDienTieuThu: number;
  chiSoNuocCu: number;
  chiSoNuocMoi: number;
  soNuocTieuThu: number;
  anhChiSoDien?: string;
  anhChiSoNuoc?: string;
  nguoiGhi: string; // ObjectId ref NguoiDung
  ngayGhi: Date;
  ngayTao: Date;
}

export interface HoaDon {
  _id?: string;
  maHoaDon: string;
  hopDong: string; // ObjectId ref HopDong
  phong: string; // ObjectId ref Phong
  khachThue: string; // ObjectId ref KhachThue
  thang: number;
  nam: number;
  tienPhong: number;
  tienDien: number;
  soDien: number;
  chiSoDienBanDau: number;
  chiSoDienCuoiKy: number;
  tienNuoc: number;
  soNuoc: number;
  chiSoNuocBanDau: number;
  chiSoNuocCuoiKy: number;
  phiDichVu: PhiDichVu[];
  tongTien: number;
  daThanhToan: number;
  conLai: number;
  trangThai: 'chuaThanhToan' | 'daThanhToanMotPhan' | 'daThanhToan' | 'quaHan';
  hanThanhToan: Date;
  ghiChu?: string;
  ngayTao: Date;
  ngayCapNhat: Date;
}

export interface ThanhToan {
  _id?: string;
  hoaDon: string; // ObjectId ref HoaDon
  soTien: number;
  phuongThuc: 'tienMat' | 'chuyenKhoan' | 'viDienTu';
  thongTinChuyenKhoan?: ThongTinChuyenKhoan;
  ngayThanhToan: Date;
  nguoiNhan: string; // ObjectId ref NguoiDung
  ghiChu?: string;
  anhBienLai?: string;
  ngayTao: Date;
}

export interface SuCo {
  _id?: string;
  phong: string; // ObjectId ref Phong
  khachThue: string; // ObjectId ref KhachThue
  tieuDe: string;
  moTa: string;
  anhSuCo: string[];
  loaiSuCo: 'dienNuoc' | 'noiThat' | 'vesinh' | 'anNinh' | 'khac';
  mucDoUuTien: 'thap' | 'trungBinh' | 'cao' | 'khancap';
  trangThai: 'moi' | 'dangXuLy' | 'daXong' | 'daHuy';
  nguoiXuLy?: string; // ObjectId ref NguoiDung
  ghiChuXuLy?: string;
  ngayBaoCao: Date;
  ngayXuLy?: Date;
  ngayHoanThanh?: Date;
  ngayTao: Date;
  ngayCapNhat: Date;
}

export interface ThongBao {
  _id?: string;
  tieuDe: string;
  noiDung: string;
  loai: 'chung' | 'hoaDon' | 'suCo' | 'hopDong' | 'khac';
  nguoiGui: string; // ObjectId ref NguoiDung
  nguoiNhan: string[]; // ObjectId[] ref KhachThue hoặc NguoiDung
  phong?: string[]; // ObjectId[] ref Phong
  toaNha?: string; // ObjectId ref ToaNha
  daDoc: string[]; // ObjectId[] danh sách người đã đọc
  ngayGui: Date;
  ngayTao: Date;
}

// Types cho API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Types cho form validation
export interface LoginForm {
  email: string;
  matKhau: string;
}

export interface RegisterForm {
  ten: string;
  email: string;
  matKhau: string;
  soDienThoai: string;
  vaiTro: 'admin' | 'chuNha' | 'nhanVien';
}

// Dashboard stats
export interface DashboardStats {
  tongSoPhong: number;
  phongTrong: number;
  phongDangThue: number;
  phongBaoTri: number;
  doanhThuThang: number;
  doanhThuNam: number;
  hoaDonSapDenHan: number;
  suCoCanXuLy: number;
  hopDongSapHetHan: number;
}
