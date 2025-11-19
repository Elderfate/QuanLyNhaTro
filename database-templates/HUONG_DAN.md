# 📋 Hướng dẫn Setup Google Sheets Database

## Bước 1: Lấy Config Google Sheets

### 1.1. Tạo Google Cloud Project

1. Truy cập: https://console.cloud.google.com
2. Click **Select a project** → **New Project**
3. Đặt tên project → Click **Create**

### 1.2. Enable Google Sheets API

1. Vào **APIs & Services** → **Library**
2. Tìm "Google Sheets API" → Click **Enable**

### 1.3. Tạo Service Account

1. Vào **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Điền tên → Click **Create and Continue** → **Done**

### 1.4. Tạo Key cho Service Account

1. Click vào Service Account vừa tạo
2. Vào tab **Keys** → **Add Key** → **Create new key**
3. Chọn **JSON** → Click **Create**
4. File JSON sẽ được download về máy

### 1.5. Lấy thông tin từ JSON file

Mở file JSON, copy các giá trị sau:

- **`client_email`** → Đây là `GOOGLE_CLIENT_EMAIL`
- **`private_key`** → Đây là `GOOGLE_PRIVATE_KEY` (giữ nguyên cả `-----BEGIN PRIVATE KEY-----` và `-----END PRIVATE KEY-----`)

### 1.6. Tạo Google Spreadsheet

1. Truy cập: https://sheets.google.com
2. Tạo spreadsheet mới
3. Copy **Spreadsheet ID** từ URL:
   ```
   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   ```
   → Đây là `GOOGLE_SPREADSHEET_ID`

### 1.7. Share Google Sheets với Service Account

1. Trong Google Sheets, click **Share** (góc trên bên phải)
2. Paste **Service Account Email** (từ `client_email` trong JSON)
3. Chọn quyền: **Editor**
4. **Bỏ chọn** "Notify people"
5. Click **Share**

### 1.8. Cấu hình .env.local

Mở file `.env.local` và thêm:

```env
# Database - Google Sheets
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id-here
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

**Lưu ý quan trọng:**
- `GOOGLE_PRIVATE_KEY` phải có dấu ngoặc kép `"..."` ở đầu và cuối
- Giữ nguyên `\n` trong private key (không xóa)
- Nếu private key có nhiều dòng, giữ nguyên format

**Ví dụ đúng:**
```env
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

---

## Bước 2: Upload CSV Files lên Google Sheets

### 2.1. Import từng CSV file

Với mỗi file CSV trong thư mục `database-templates/`, làm theo các bước sau:

1. Mở Google Sheets của bạn
2. Click **File** → **Import**
3. Chọn tab **Upload**
4. Kéo thả file CSV vào (hoặc click **Select a file from your device**)
5. Chọn import settings:
   - **Import location**: "Insert new sheet(s)"
   - **Separator type**: "Comma"
   - **Convert text to numbers, dates, and formulas**: **BỎ CHỌN** (quan trọng!)
6. Click **Import data**

### 2.2. Đổi tên Sheet

**QUAN TRỌNG**: Tên sheet phải đúng chính xác (case-sensitive):

| File CSV | Tên Sheet |
|----------|-----------|
| `NguoiDung.csv` | `NguoiDung` |
| `ToaNha.csv` | `ToaNha` |
| `Phong.csv` | `Phong` |
| `KhachThue.csv` | `KhachThue` |
| `HopDong.csv` | `HopDong` |
| `HoaDon.csv` | `HoaDon` |
| `ThanhToan.csv` | `ThanhToan` |
| `ChiSoDienNuoc.csv` | `ChiSoDienNuoc` |
| `SuCo.csv` | `SuCo` |
| `ThongBao.csv` | `ThongBao` |

**Cách đổi tên sheet:**
- Click chuột phải vào tab sheet → **Rename**

### 2.3. Kiểm tra Format

Sau khi import, đảm bảo:
- ✅ Row đầu tiên là header (tên columns)
- ✅ Arrays là JSON string: `["item1","item2"]` hoặc `[]`
- ✅ Objects là JSON string: `{"key":"value"}`
- ✅ Dates là ISO format: `2024-01-01T00:00:00.000Z`

---

## Bước 3: Test

1. Restart server: `npm run dev`
2. Kiểm tra console log, bạn sẽ thấy:
   ```
   Connected to Google Sheets: [Tên của spreadsheet]
   ```
3. Đăng nhập: `http://localhost:3000/dang-nhap`
   - Email: `admin@example.com`
   - Password: `admin123`

---

## ⚠️ Troubleshooting

### Lỗi: "The caller does not have permission"
- **Nguyên nhân**: Service Account chưa được share với Google Sheets
- **Giải pháp**: Share Google Sheets với Service Account email (Editor permission)

### Lỗi: "API has not been used"
- **Nguyên nhân**: Google Sheets API chưa được enable
- **Giải pháp**: Enable Google Sheets API trong Google Cloud Console

### Lỗi: "Invalid credentials"
- **Nguyên nhân**: `GOOGLE_PRIVATE_KEY` format sai
- **Giải pháp**: Đảm bảo có dấu ngoặc kép và `\n` trong private key

### Lỗi: "Spreadsheet not found"
- **Nguyên nhân**: `GOOGLE_SPREADSHEET_ID` sai
- **Giải pháp**: Kiểm tra lại Spreadsheet ID trong URL

### Lỗi: "Sheet not found"
- **Nguyên nhân**: Tên sheet không đúng
- **Giải pháp**: Kiểm tra tên sheet có đúng case-sensitive không

---

## ✅ Checklist

- [ ] Đã tạo Google Cloud Project
- [ ] Đã enable Google Sheets API
- [ ] Đã tạo Service Account và download JSON key
- [ ] Đã copy `client_email` và `private_key` vào `.env.local`
- [ ] Đã tạo Google Spreadsheet
- [ ] Đã share Google Sheets với Service Account email (Editor)
- [ ] Đã import 10 CSV files
- [ ] Đã đổi tên sheet đúng (case-sensitive)
- [ ] Đã cập nhật `GOOGLE_SPREADSHEET_ID` trong `.env.local`
- [ ] Đã restart server
- [ ] Đã test đăng nhập thành công

---

**Sau khi hoàn thành, bạn có thể sử dụng ứng dụng với Google Sheets làm database!** 🎉

