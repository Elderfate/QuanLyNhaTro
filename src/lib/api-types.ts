/**
 * Type definitions for Google Sheets models
 * Helps reduce 'any' types in API routes
 */

import type {
  ToaNha,
  Phong,
  KhachThue,
  HopDong,
  HoaDon,
  ThanhToan,
  SuCo,
  ThongBao,
  ChiSoDienNuoc,
  NguoiDung,
} from '@/types';

/**
 * Google Sheets document type (from Google Sheets DB)
 */
export interface GoogleSheetsDocument {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/**
 * ToaNha from Google Sheets
 */
export interface ToaNhaDocument extends GoogleSheetsDocument {
  tenToaNha: string;
  diaChi: ToaNha['diaChi'] | string;
  moTa?: string;
  anhToaNha: string[];
  chuSoHuu: string;
  tongSoPhong?: number;
  tienNghiChung: string[] | string;
  ngayTao?: string;
  ngayCapNhat?: string;
}

/**
 * Phong from Google Sheets
 */
export interface PhongDocument extends GoogleSheetsDocument {
  maPhong: string;
  toaNha: string | { _id: string; tenToaNha: string; diaChi: unknown };
  tang: number;
  dienTich: number;
  giaThue: number;
  tienCoc: number;
  moTa?: string;
  anhPhong: string[];
  tienNghi: string[] | string;
  trangThai: Phong['trangThai'];
  soNguoiToiDa: number;
  nguoiThue?: string;
  ngayTao?: string;
  ngayCapNhat?: string;
}

/**
 * KhachThue from Google Sheets
 */
export interface KhachThueDocument extends GoogleSheetsDocument {
  hoTen?: string;
  ten?: string; // Alternative field name
  soDienThoai: string;
  email?: string;
  cccd?: string;
  soCCCD?: string; // Alternative field name
  ngaySinh?: string;
  gioiTinh?: KhachThue['gioiTinh'];
  queQuan?: string;
  diaChiHienTai?: string;
  ngheNghiep?: string;
  anhCCCD: KhachThue['anhCCCD'] | string;
  trangThai: KhachThue['trangThai'];
  phongDangThue?: string;
  ghiChu?: string;
  ngayTao?: string;
  ngayCapNhat?: string;
}

/**
 * HopDong from Google Sheets
 */
export interface HopDongDocument extends GoogleSheetsDocument {
  maHopDong: string;
  soHopDong?: string; // Alternative field name
  phong: string | { _id: string; maPhong: string };
  khachThueId: string[] | string;
  nguoiDaiDien: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  giaThue: number;
  tienCoc: number;
  chuKyThanhToan: HopDong['chuKyThanhToan'];
  ngayThanhToan: number;
  dieuKhoan?: string;
  giaDien: number;
  giaNuoc: number;
  chiSoDienBanDau: number;
  chiSoNuocBanDau: number;
  phiDichVu: HopDong['phiDichVu'] | string;
  trangThai: HopDong['trangThai'];
  fileHopDong?: string;
  ngayTao?: string;
  ngayCapNhat?: string;
}

/**
 * HoaDon from Google Sheets
 */
export interface HoaDonDocument extends GoogleSheetsDocument {
  maHoaDon: string;
  soHoaDon?: string; // Alternative field name
  hopDong: string | { _id: string; maHopDong: string };
  phong: string | { _id: string; maPhong: string };
  khachThue: string | { _id: string; hoTen: string };
  thang: number;
  nam: number;
  tienPhong: number;
  tienDien: number;
  soDien?: number;
  chiSoDienBanDau?: number;
  chiSoDienCuoiKy?: number;
  chiSoDienMoi?: number; // Alternative field name
  tienNuoc: number;
  soNuoc?: number;
  chiSoNuocBanDau?: number;
  chiSoNuocCuoiKy?: number;
  chiSoNuocMoi?: number; // Alternative field name
  phiDichVu: HoaDon['phiDichVu'] | string;
  tongTien: number;
  daThanhToan?: number;
  conLai?: number;
  trangThai: HoaDon['trangThai'];
  hanThanhToan: string;
  ghiChu?: string;
  ngayTao?: string;
  ngayCapNhat?: string;
}

/**
 * Helper to safely get document ID
 */
export function getDocumentId(doc: GoogleSheetsDocument | string | null | undefined): string | null {
  if (!doc) return null;
  if (typeof doc === 'string') return doc;
  return doc._id || null;
}

/**
 * Helper to safely get document field
 */
export function getDocumentField<T>(
  doc: GoogleSheetsDocument | null | undefined,
  field: string,
  defaultValue?: T
): T | undefined {
  if (!doc) return defaultValue;
  const value = doc[field];
  return (value !== undefined && value !== null) ? (value as T) : defaultValue;
}

