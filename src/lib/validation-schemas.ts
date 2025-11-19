import { z } from 'zod';
import { 
  validatePhoneNumber, 
  validateCCCD, 
  validateDate, 
  validateEmail,
  validateRoomCode
} from './data-formatter';

// Custom Zod validators
const phoneValidator = z.string()
  .min(10, 'Số điện thoại phải có ít nhất 10 số')
  .max(15, 'Số điện thoại không được quá 15 số')
  .refine(validatePhoneNumber, {
    message: 'Số điện thoại không hợp lệ (định dạng Việt Nam)'
  });

const cccdValidator = z.string()
  .length(12, 'CCCD phải có đúng 12 số')
  .refine(validateCCCD, {
    message: 'Số CCCD không hợp lệ'
  });

const dateValidator = z.string()
  .min(1, 'Ngày không được để trống')
  .refine(validateDate, {
    message: 'Định dạng ngày không hợp lệ (dd/MM/yyyy)'
  });

const emailValidator = z.string()
  .email('Email không hợp lệ')
  .refine(validateEmail, {
    message: 'Định dạng email không chính xác'
  });

const currencyValidator = z.number()
  .min(0, 'Giá tiền không được âm')
  .max(999999999, 'Giá tiền không được quá 999,999,999 VND');

const roomCodeValidator = z.string()
  .min(2, 'Mã phòng phải có ít nhất 2 ký tự')
  .max(10, 'Mã phòng không được quá 10 ký tự')
  .refine(validateRoomCode, {
    message: 'Mã phòng không hợp lệ (ví dụ: A101, B205)'
  });

// ===== TOA NHA SCHEMA =====
export const toaNhaSchema = z.object({
  tenToaNha: z.string()
    .min(2, 'Tên tòa nhà phải có ít nhất 2 ký tự')
    .max(100, 'Tên tòa nhà không được quá 100 ký tự')
    .transform(val => val.trim()),
    
  diaChi: z.string()
    .min(10, 'Địa chỉ phải có ít nhất 10 ký tự')
    .max(200, 'Địa chỉ không được quá 200 ký tự')
    .transform(val => val.trim()),
    
  soTang: z.number()
    .int('Số tầng phải là số nguyên')
    .min(1, 'Tòa nhà phải có ít nhất 1 tầng')
    .max(50, 'Số tầng không được quá 50'),
    
  tongSoPhong: z.number()
    .int('Tổng số phòng phải là số nguyên')
    .min(1, 'Tòa nhà phải có ít nhất 1 phòng')
    .max(1000, 'Số phòng không được quá 1000'),
    
  moTa: z.string()
    .max(500, 'Mô tả không được quá 500 ký tự')
    .optional()
    .transform(val => val?.trim() || ''),
    
  tienNghiChung: z.array(z.string())
    .max(20, 'Không được có quá 20 tiện nghi')
    .optional()
    .default([]),
    
  anhToaNha: z.array(z.string().url('URL ảnh không hợp lệ'))
    .max(10, 'Không được tải quá 10 ảnh')
    .optional()
    .default([]),
    
  chuSoHuu: z.string()
    .min(1, 'Chủ sở hữu là bắt buộc'),
    
  trangThai: z.enum(['hoatDong', 'tamNgung', 'baoTri'])
    .default('hoatDong')
});

// ===== PHONG SCHEMA =====
export const phongSchema = z.object({
  maPhong: roomCodeValidator,
  
  toaNha: z.string()
    .min(1, 'Tòa nhà là bắt buộc'),
    
  tang: z.number()
    .int('Tầng phải là số nguyên')
    .min(0, 'Tầng không được âm')
    .max(50, 'Tầng không được quá 50'),
    
  dienTich: z.number()
    .min(5, 'Diện tích phải ít nhất 5m²')
    .max(1000, 'Diện tích không được quá 1000m²'),
    
  giaThue: currencyValidator,
  
  tienCoc: currencyValidator,
  
  soNguoiToiDa: z.number()
    .int('Số người tối đa phải là số nguyên')
    .min(1, 'Phòng phải chứa ít nhất 1 người')
    .max(10, 'Số người không được quá 10'),
    
  moTa: z.string()
    .max(1000, 'Mô tả không được quá 1000 ký tự')
    .optional()
    .transform(val => val?.trim() || ''),
    
  anhPhong: z.array(z.string().url('URL ảnh không hợp lệ'))
    .max(15, 'Không được tải quá 15 ảnh')
    .optional()
    .default([]),
    
  tienNghi: z.array(z.string())
    .max(30, 'Không được có quá 30 tiện nghi')
    .optional()
    .default([]),
    
  trangThai: z.enum(['trong', 'dangThue', 'daDat', 'baoTri'])
    .default('trong')
});

// ===== KHACH THUE SCHEMA =====
export const khachThueSchema = z.object({
  hoTen: z.string()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(50, 'Họ tên không được quá 50 ký tự')
    .regex(/^[a-zA-ZÀ-ỹ\s]+$/, 'Họ tên chỉ được chứa chữ cái và khoảng trắng')
    .transform(val => val.trim()),
    
  soDienThoai: phoneValidator,
  
  email: emailValidator
    .optional()
    .or(z.literal(''))
    .transform(val => val || undefined),
    
  cccd: cccdValidator,
  
  ngaySinh: dateValidator,
  
  gioiTinh: z.enum(['nam', 'nu', 'khac'], {
    errorMap: () => ({ message: 'Giới tính không hợp lệ' })
  }),
  
  queQuan: z.string()
    .min(5, 'Quê quán phải có ít nhất 5 ký tự')
    .max(100, 'Quê quán không được quá 100 ký tự')
    .transform(val => val.trim()),
    
  anhCCCD: z.object({
    matTruoc: z.string().url('URL ảnh mặt trước CCCD không hợp lệ').optional(),
    matSau: z.string().url('URL ảnh mặt sau CCCD không hợp lệ').optional(),
  }).optional(),
  
  ngheNghiep: z.string()
    .max(50, 'Nghề nghiệp không được quá 50 ký tự')
    .optional()
    .transform(val => val?.trim() || ''),
    
  matKhau: z.string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(50, 'Mật khẩu không được quá 50 ký tự')
    .optional(),
    
  trangThai: z.enum(['chuaThue', 'dangThue', 'daRa'])
    .default('chuaThue')
});

// ===== HOP DONG SCHEMA =====
const phiDichVuSchema = z.object({
  ten: z.string()
    .min(1, 'Tên dịch vụ là bắt buộc')
    .max(50, 'Tên dịch vụ không được quá 50 ký tự'),
  gia: currencyValidator,
});

export const hopDongSchema = z.object({
  maHopDong: z.string()
    .min(5, 'Mã hợp đồng phải có ít nhất 5 ký tự')
    .max(20, 'Mã hợp đồng không được quá 20 ký tự')
    .regex(/^[A-Z0-9]+$/, 'Mã hợp đồng chỉ được chứa chữ cái in hoa và số'),
    
  phong: z.string()
    .min(1, 'Phòng là bắt buộc'),
    
  khachThueId: z.array(z.string())
    .min(1, 'Phải có ít nhất 1 khách thuê')
    .max(10, 'Không được quá 10 khách thuê'),
    
  nguoiDaiDien: z.string()
    .min(1, 'Người đại diện là bắt buộc'),
    
  ngayBatDau: dateValidator,
  
  ngayKetThuc: dateValidator,
  
  giaThue: currencyValidator,
  
  tienCoc: currencyValidator,
  
  chuKyThanhToan: z.enum(['thang', 'quy', 'nam'], {
    errorMap: () => ({ message: 'Chu kỳ thanh toán không hợp lệ' })
  }),
  
  ngayThanhToan: z.number()
    .int('Ngày thanh toán phải là số nguyên')
    .min(1, 'Ngày thanh toán phải từ 1-31')
    .max(31, 'Ngày thanh toán phải từ 1-31'),
    
  dieuKhoan: z.string()
    .min(10, 'Điều khoản phải có ít nhất 10 ký tự')
    .max(2000, 'Điều khoản không được quá 2000 ký tự'),
    
  giaDien: z.number()
    .min(0, 'Giá điện không được âm')
    .max(10000, 'Giá điện không được quá 10,000 VND/kWh'),
    
  giaNuoc: z.number()
    .min(0, 'Giá nước không được âm') 
    .max(100000, 'Giá nước không được quá 100,000 VND/m³'),
    
  chiSoDienBanDau: z.number()
    .min(0, 'Chỉ số điện ban đầu không được âm')
    .max(999999, 'Chỉ số điện ban đầu không hợp lệ'),
    
  chiSoNuocBanDau: z.number()
    .min(0, 'Chỉ số nước ban đầu không được âm')
    .max(999999, 'Chỉ số nước ban đầu không hợp lệ'),
    
  phiDichVu: z.array(phiDichVuSchema)
    .max(20, 'Không được có quá 20 dịch vụ')
    .optional()
    .default([]),
    
  fileHopDong: z.string()
    .url('URL file hợp đồng không hợp lệ')
    .optional(),
    
  trangThai: z.enum(['choKy', 'hoatDong', 'hetHan', 'huy'])
    .default('choKy')
}).refine(
  (data) => new Date(data.ngayKetThuc) > new Date(data.ngayBatDau),
  {
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
    path: ['ngayKetThuc']
  }
).refine(
  (data) => data.khachThueId.includes(data.nguoiDaiDien),
  {
    message: 'Người đại diện phải là một trong các khách thuê',
    path: ['nguoiDaiDien']
  }
);

// ===== USER SCHEMA =====
export const nguoiDungSchema = z.object({
  tenDangNhap: z.string()
    .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .max(20, 'Tên đăng nhập không được quá 20 ký tự')
    .regex(/^[a-zA-Z0-9_]+$/, 'Tên đăng nhập chỉ được chứa chữ, số và dấu gạch dưới'),
    
  matKhau: z.string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(50, 'Mật khẩu không được quá 50 ký tự')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa và 1 số'),
    
  hoTen: z.string()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(50, 'Họ tên không được quá 50 ký tự')
    .transform(val => val.trim()),
    
  email: emailValidator,
  
  soDienThoai: phoneValidator,
  
  vaiTro: z.enum(['admin', 'quanly', 'nhanvien'])
    .default('nhanvien'),
    
  trangThai: z.enum(['hoatDong', 'khoa', 'cho'])
    .default('hoatDong')
});

// ===== EXPORT ALL SCHEMAS =====
export const schemas = {
  toaNha: toaNhaSchema,
  phong: phongSchema,
  khachThue: khachThueSchema,
  hopDong: hopDongSchema,
  nguoiDung: nguoiDungSchema,
} as const;

// Helper function to validate and format data
export const validateAndFormat = <T extends keyof typeof schemas>(
  schemaKey: T,
  data: unknown
): { success: true; data: z.infer<typeof schemas[T]> } | { success: false; errors: z.ZodError } => {
  try {
    const result = schemas[schemaKey].parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};