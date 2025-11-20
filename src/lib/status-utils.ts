import { HopDongGS, PhongGS, KhachThueGS } from '@/lib/googlesheets-models';

/**
 * Tính trạng thái phòng dựa trên hợp đồng
 * @param phongId - ID của phòng
 * @returns Trạng thái phòng: 'trong' | 'daDat' | 'dangThue' | 'baoTri'
 */
export async function calculatePhongStatus(phongId: string): Promise<'trong' | 'daDat' | 'dangThue' | 'baoTri'> {
  try {
    // Normalize phongId to string
    const normalizedPhongId = String(phongId);
    
    // Fetch fresh data from Google Sheets
    const allHopDong = await HopDongGS.find();
    const now = new Date();
    
    console.log(`🔍 Calculating status for phong ${normalizedPhongId}, found ${allHopDong.length} contracts`);

    // Tìm hợp đồng đang hoạt động của phòng
    const hopDongHoatDong = allHopDong.find((hd: any) => {
      if (!hd || hd.trangThai !== 'hoatDong') return false;
      
      // Normalize phong ID - handle both string and object
      let phongIdFromHd = hd.phong;
      if (typeof phongIdFromHd === 'object' && phongIdFromHd !== null) {
        phongIdFromHd = phongIdFromHd._id || phongIdFromHd.id || phongIdFromHd;
      }
      const normalizedPhongIdFromHd = String(phongIdFromHd);
      
      if (normalizedPhongIdFromHd !== normalizedPhongId) return false;
      
      // Check date range
      const ngayBatDau = hd.ngayBatDau ? new Date(hd.ngayBatDau) : null;
      const ngayKetThuc = hd.ngayKetThuc ? new Date(hd.ngayKetThuc) : null;
      
      if (!ngayBatDau || !ngayKetThuc) return false;
      
      // Check if contract is currently active
      const isActive = ngayBatDau <= now && ngayKetThuc >= now;
      
      if (isActive) {
        console.log(`✅ Found active contract for phong ${normalizedPhongId}: ${hd.maHopDong || hd._id}`);
      }
      
      return isActive;
    });

    if (hopDongHoatDong) {
      console.log(`📊 Phong ${normalizedPhongId} status: dangThue`);
      return 'dangThue';
    }

    // Kiểm tra có hợp đồng đã đặt nhưng chưa bắt đầu không
    const hopDongDaDat = allHopDong.find((hd: any) => {
      if (!hd || hd.trangThai !== 'hoatDong') return false;
      
      // Normalize phong ID - handle both string and object
      let phongIdFromHd = hd.phong;
      if (typeof phongIdFromHd === 'object' && phongIdFromHd !== null) {
        phongIdFromHd = phongIdFromHd._id || phongIdFromHd.id || phongIdFromHd;
      }
      const normalizedPhongIdFromHd = String(phongIdFromHd);
      
      if (normalizedPhongIdFromHd !== normalizedPhongId) return false;
      
      const ngayBatDau = hd.ngayBatDau ? new Date(hd.ngayBatDau) : null;
      return ngayBatDau && ngayBatDau > now;
    });

    if (hopDongDaDat) {
      console.log(`📊 Phong ${normalizedPhongId} status: daDat`);
      return 'daDat';
    }

    // Mặc định là trống
    console.log(`📊 Phong ${normalizedPhongId} status: trong`);
    return 'trong';
  } catch (error) {
    console.error('Error calculating phong status:', error);
    return 'trong';
  }
}

/**
 * Tính trạng thái khách thuê dựa trên hợp đồng
 * @param khachThueId - ID của khách thuê
 * @returns Trạng thái khách thuê: 'dangThue' | 'daTraPhong' | 'chuaThue'
 */
export async function calculateKhachThueStatus(khachThueId: string): Promise<'dangThue' | 'daTraPhong' | 'chuaThue'> {
  try {
    const allHopDong = await HopDongGS.find();
    const now = new Date();

    // Tìm hợp đồng đang hoạt động của khách thuê
    const hopDongHoatDong = allHopDong.find((hd: any) => {
      const khachThueIds = Array.isArray(hd.khachThueId) ? hd.khachThueId : [hd.khachThueId];
      const ngayBatDau = hd.ngayBatDau ? new Date(hd.ngayBatDau) : null;
      const ngayKetThuc = hd.ngayKetThuc ? new Date(hd.ngayKetThuc) : null;
      return (khachThueIds.includes(khachThueId) || hd.nguoiDaiDien === khachThueId) &&
             hd.trangThai === 'hoatDong' &&
             ngayBatDau && ngayBatDau <= now &&
             ngayKetThuc && ngayKetThuc >= now;
    });

    if (hopDongHoatDong) {
      return 'dangThue';
    }

    // Kiểm tra xem khách thuê đã từng có hợp đồng nào chưa
    const hopDongDaCo = allHopDong.find((hd: any) => {
      const khachThueIds = Array.isArray(hd.khachThueId) ? hd.khachThueId : [hd.khachThueId];
      return khachThueIds.includes(khachThueId) || hd.nguoiDaiDien === khachThueId;
    });

    if (hopDongDaCo) {
      return 'daTraPhong'; // Đã từng có hợp đồng nhưng hiện tại không hoạt động
    }

    return 'chuaThue'; // Chưa từng có hợp đồng nào
  } catch (error) {
    console.error('Error calculating khach thue status:', error);
    return 'chuaThue';
  }
}

/**
 * Cập nhật trạng thái phòng dựa trên hợp đồng
 * @param phongId - ID của phòng
 */
export async function updatePhongStatus(phongId: string): Promise<void> {
  try {
    const normalizedPhongId = String(phongId);
    console.log(`🔄 Starting status update for phong ${normalizedPhongId}`);
    
    // Calculate new status
    const newStatus = await calculatePhongStatus(normalizedPhongId);
    console.log(`📊 Calculated status for phong ${normalizedPhongId}: ${newStatus}`);
    
    // Update in Google Sheets
    const result = await PhongGS.findByIdAndUpdate(normalizedPhongId, { 
      trangThai: newStatus,
      updatedAt: new Date().toISOString(),
      ngayCapNhat: new Date().toISOString(),
    });
    
    if (result) {
      console.log(`✅ Successfully updated phong ${normalizedPhongId} status to: ${newStatus}`);
      
      // Verify the update by fetching the phong again
      const verifyPhong = await PhongGS.findById(normalizedPhongId);
      if (verifyPhong) {
        console.log(`✅ Verified: phong ${normalizedPhongId} now has status: ${verifyPhong.trangThai}`);
      }
    } else {
      console.warn(`⚠️ Failed to update phong ${normalizedPhongId} - not found`);
    }
  } catch (error) {
    console.error(`❌ Error updating phong ${phongId} status:`, error);
    throw error; // Re-throw to allow caller to handle
  }
}

/**
 * Cập nhật trạng thái khách thuê dựa trên hợp đồng
 * @param khachThueId - ID của khách thuê
 */
export async function updateKhachThueStatus(khachThueId: string): Promise<void> {
  try {
    const newStatus = await calculateKhachThueStatus(khachThueId);
    await KhachThueGS.findByIdAndUpdate(khachThueId, { 
      trangThai: newStatus,
      updatedAt: new Date().toISOString(),
      ngayCapNhat: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating khach thue status:', error);
  }
}

/**
 * Cập nhật trạng thái tất cả phòng khi có thay đổi hợp đồng
 * @param phongId - ID của phòng (optional)
 */
export async function updateAllPhongStatus(phongId?: string): Promise<void> {
  try {
    if (phongId) {
      // Cập nhật trạng thái cho phòng cụ thể
      await updatePhongStatus(phongId);
    } else {
      // Cập nhật trạng thái cho tất cả phòng
      const allPhong = await PhongGS.find();
      await Promise.all(
        allPhong.map((phong: any) => updatePhongStatus(phong._id))
      );
    }
  } catch (error) {
    console.error('Error updating all phong status:', error);
  }
}

/**
 * Cập nhật trạng thái tất cả khách thuê khi có thay đổi hợp đồng
 * @param khachThueIds - Danh sách ID khách thuê (optional)
 */
export async function updateAllKhachThueStatus(khachThueIds?: string[]): Promise<void> {
  try {
    if (khachThueIds && khachThueIds.length > 0) {
      // Cập nhật trạng thái cho khách thuê cụ thể
      await Promise.all(
        khachThueIds.map(id => updateKhachThueStatus(id))
      );
    } else {
      // Cập nhật trạng thái cho tất cả khách thuê
      const allKhachThue = await KhachThueGS.find();
      await Promise.all(
        allKhachThue.map((khach: any) => updateKhachThueStatus(khach._id))
      );
    }
  } catch (error) {
    console.error('Error updating all khach thue status:', error);
  }
}
