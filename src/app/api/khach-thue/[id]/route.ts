import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { KhachThueGS } from '@/lib/googlesheets-models';
import { deleteCloudinaryImages } from '@/lib/cloudinary-utils';
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
  badRequestResponse,
} from '@/lib/api-response';
import { compareIds } from '@/lib/id-utils';
import { withRetry } from '@/lib/retry-utils';
import type { KhachThueDocument } from '@/lib/api-types';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const khachThueSchema = z.object({
  hoTen: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  soDienThoai: z.string().regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ').optional(),
  cccd: z.string().regex(/^[0-9]{12}$/, 'CCCD phải có 12 chữ số'),
  ngaySinh: z.string().min(1, 'Ngày sinh là bắt buộc'),
  gioiTinh: z.enum(['nam', 'nu', 'khac']),
  queQuan: z.string().min(1, 'Quê quán là bắt buộc'),
  anhCCCD: z.object({
    matTruoc: z.string().optional(),
    matSau: z.string().optional(),
  }).optional(),
  ngheNghiep: z.string().optional(),
  matKhau: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    const khachThue = await withRetry(() => KhachThueGS.findById(id)) as KhachThueDocument | null;

    if (!khachThue) {
      return notFoundResponse('Khách thuê không tồn tại');
    }

    return successResponse(khachThue);

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi lấy thông tin khách thuê');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    let validatedData;
    try {
      validatedData = khachThueSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationErrorResponse(error);
      }
      throw error;
    }

    const { id } = await params;

    // Get existing khach thue to check for deleted images
    const existingKhachThue = await withRetry(() => KhachThueGS.findById(id)) as KhachThueDocument | null;
    if (!existingKhachThue) {
      return notFoundResponse('Khách thuê không tồn tại');
    }

    // Normalize phone number for comparison
    const normalizePhone = (phone: string | number | null | undefined): string => {
      if (!phone) return '';
      const phoneStr = String(phone).replace(/\D/g, ''); // Remove non-digits
      // If it's 9-10 digits without leading zero, add it
      if (/^\d{9,10}$/.test(phoneStr) && !phoneStr.startsWith('0')) {
        return '0' + phoneStr;
      }
      return phoneStr;
    };
    
    const normalizedInputPhone = normalizePhone(validatedData.soDienThoai);

    // Check if phone or CCCD already exists (excluding current record)
    const allKhachThue = await withRetry(() => KhachThueGS.find());
    const duplicateKhachThue = allKhachThue.find((kt) => {
      if (compareIds(kt._id, id)) return false;
      const normalizedStoredPhone = normalizePhone(kt.soDienThoai);
      const storedCCCD = (kt as KhachThueDocument).soCCCD || (kt as KhachThueDocument).cccd;
      return normalizedStoredPhone === normalizedInputPhone || 
             storedCCCD === validatedData.cccd;
    });

    if (duplicateKhachThue) {
      return badRequestResponse('Số điện thoại hoặc CCCD đã được sử dụng');
    }

    // Handle image deletion from Cloudinary if CCCD images were removed
    const oldAnhCCCD = existingKhachThue.anhCCCD || { matTruoc: '', matSau: '' };
    const newAnhCCCD = validatedData.anhCCCD || { matTruoc: '', matSau: '' };
    
    console.log('📸 CCCD Image Update:', {
      oldAnhCCCD,
      newAnhCCCD,
      validatedDataAnhCCCD: validatedData.anhCCCD
    });
    
    const deletedImageUrls: string[] = [];
    
    if (oldAnhCCCD.matTruoc && oldAnhCCCD.matTruoc !== newAnhCCCD.matTruoc) {
      deletedImageUrls.push(oldAnhCCCD.matTruoc);
    }
    if (oldAnhCCCD.matSau && oldAnhCCCD.matSau !== newAnhCCCD.matSau) {
      deletedImageUrls.push(oldAnhCCCD.matSau);
    }
    
    if (deletedImageUrls.length > 0) {
      try {
        await deleteCloudinaryImages(deletedImageUrls);
        console.log(`Deleted ${deletedImageUrls.length} CCCD image(s) from Cloudinary for khach thue ${id}`);
      } catch (error) {
        console.error('Error deleting CCCD images from Cloudinary:', error);
        // Continue with update even if Cloudinary deletion fails
      }
    }

    // Prepare update data
    const updateData: Partial<KhachThueDocument> = {
      ...validatedData,
      ten: validatedData.hoTen,
      hoTen: validatedData.hoTen,
      ngaySinh: validatedData.ngaySinh,
      anhCCCD: {
        matTruoc: newAnhCCCD.matTruoc || '',
        matSau: newAnhCCCD.matSau || ''
      },
      soCCCD: validatedData.cccd,
      cccd: validatedData.cccd,
      updatedAt: new Date().toISOString(),
      ngayCapNhat: new Date().toISOString(),
    };

    // Nếu có mật khẩu mới, hash password
    if (validatedData.matKhau) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(validatedData.matKhau, salt);
      updateData.matKhau = hashedPassword;
      (updateData as { password?: string }).password = hashedPassword;
    } else {
      delete updateData.matKhau;
      delete (updateData as { password?: string }).password;
    }

    const khachThue = await withRetry(() => 
      KhachThueGS.findByIdAndUpdate(id, updateData, { new: true })
    ) as KhachThueDocument | null;

    if (!khachThue) {
      return notFoundResponse('Khách thuê không tồn tại');
    }

    // Ensure anhCCCD is included in response - get fresh data after update
    const updatedKhachThue = await withRetry(() => KhachThueGS.findById(id)) as KhachThueDocument | null;
    
    if (!updatedKhachThue) {
      return notFoundResponse('Khách thuê không tồn tại');
    }
    
    // Ensure anhCCCD is properly structured
    let anhCCCD = updatedKhachThue.anhCCCD;
    if (!anhCCCD || typeof anhCCCD !== 'object' || Array.isArray(anhCCCD)) {
      anhCCCD = { matTruoc: '', matSau: '' };
    } else {
      anhCCCD = {
        matTruoc: (anhCCCD as { matTruoc?: string }).matTruoc || '',
        matSau: (anhCCCD as { matSau?: string }).matSau || ''
      };
    }
    
    const responseData = {
      ...updatedKhachThue,
      anhCCCD
    };

    return successResponse(responseData, 'Khách thuê đã được cập nhật thành công');

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi cập nhật khách thuê');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    const khachThue = await withRetry(() => KhachThueGS.findById(id)) as KhachThueDocument | null;
    if (!khachThue) {
      return notFoundResponse('Khách thuê không tồn tại');
    }

    // Delete CCCD images from Cloudinary before deleting the record
    const anhCCCD = khachThue.anhCCCD || { matTruoc: '', matSau: '' };
    const imageUrls: string[] = [];
    if (typeof anhCCCD === 'object' && !Array.isArray(anhCCCD)) {
      if (anhCCCD.matTruoc) imageUrls.push(anhCCCD.matTruoc);
      if (anhCCCD.matSau) imageUrls.push(anhCCCD.matSau);
    }
    
    if (imageUrls.length > 0) {
      try {
        await deleteCloudinaryImages(imageUrls);
        console.log(`Deleted ${imageUrls.length} CCCD image(s) from Cloudinary for khach thue ${id}`);
      } catch (error) {
        console.error('Error deleting CCCD images from Cloudinary:', error);
        // Continue with deletion even if Cloudinary deletion fails
      }
    }

    await withRetry(() => KhachThueGS.findByIdAndDelete(id));

    return successResponse(null, 'Khách thuê đã được xóa thành công');

  } catch (error) {
    return serverErrorResponse(error, 'Lỗi khi xóa khách thuê');
  }
}
