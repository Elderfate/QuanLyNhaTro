import { useMemo } from 'react';
import { useAppDataQuery, type AppData } from './use-api';
import type { ToaNha, Phong, KhachThue, HopDong, HoaDon, ThanhToan, SuCo, ThongBao } from '@/types';

/**
 * Main hook to access all app data
 * Returns data from useAppDataQuery with helper functions
 */
export function useData() {
  const { data, isLoading, error, refetch } = useAppDataQuery();

  // Helper functions to get filtered data
  const helpers = useMemo(() => {
    if (!data) {
      return {
        getPhongByToaNha: () => [],
        getHopDongByPhong: () => [],
        getHoaDonByHopDong: () => [],
        getThanhToanByHoaDon: () => [],
        getSuCoByPhong: () => [],
        getSuCoByKhachThue: () => [],
        getThongBaoByPhong: () => [],
        getThongBaoByKhachThue: () => [],
        getHopDongByKhachThue: () => [],
        getPhongByTrangThai: () => [],
        getHopDongByTrangThai: () => [],
        getHoaDonByTrangThai: () => [],
        getSuCoByTrangThai: () => [],
      };
    }

    return {
      // Get phong by toaNha ID
      getPhongByToaNha: (toaNhaId: string): Phong[] => {
        return data.phong.filter((p: Phong) => {
          if (typeof p.toaNha === 'string') {
            return p.toaNha === toaNhaId;
          }
          if (p.toaNha && typeof p.toaNha === 'object') {
            return p.toaNha._id === toaNhaId;
          }
          return false;
        });
      },

      // Get hopDong by phong ID
      getHopDongByPhong: (phongId: string): HopDong[] => {
        return data.hopDong.filter((hd: HopDong) => {
          if (typeof hd.phong === 'string') {
            return hd.phong === phongId;
          }
          if (hd.phong && typeof hd.phong === 'object') {
            return hd.phong._id === phongId;
          }
          return false;
        });
      },

      // Get hoaDon by hopDong ID
      getHoaDonByHopDong: (hopDongId: string): HoaDon[] => {
        return data.hoaDon.filter((hd: HoaDon) => {
          if (typeof hd.hopDong === 'string') {
            return hd.hopDong === hopDongId;
          }
          if (hd.hopDong && typeof hd.hopDong === 'object') {
            return hd.hopDong._id === hopDongId;
          }
          return false;
        });
      },

      // Get thanhToan by hoaDon ID
      getThanhToanByHoaDon: (hoaDonId: string): ThanhToan[] => {
        return data.thanhToan.filter((tt: ThanhToan) => {
          if (typeof tt.hoaDon === 'string') {
            return tt.hoaDon === hoaDonId;
          }
          if (tt.hoaDon && typeof tt.hoaDon === 'object') {
            return tt.hoaDon._id === hoaDonId;
          }
          return false;
        });
      },

      // Get suCo by phong ID
      getSuCoByPhong: (phongId: string): SuCo[] => {
        return data.suCo.filter((sc: SuCo) => {
          if (typeof sc.phong === 'string') {
            return sc.phong === phongId;
          }
          if (sc.phong && typeof sc.phong === 'object') {
            return sc.phong._id === phongId;
          }
          return false;
        });
      },

      // Get suCo by khachThue ID
      getSuCoByKhachThue: (khachThueId: string): SuCo[] => {
        return data.suCo.filter((sc: SuCo) => {
          if (typeof sc.khachThue === 'string') {
            return sc.khachThue === khachThueId;
          }
          if (sc.khachThue && typeof sc.khachThue === 'object') {
            return sc.khachThue._id === khachThueId;
          }
          return false;
        });
      },

      // Get thongBao by phong ID (phong can be array)
      getThongBaoByPhong: (phongId: string): ThongBao[] => {
        return data.thongBao.filter((tb: ThongBao) => {
          if (Array.isArray(tb.phong)) {
            return tb.phong.some((p: any) => {
              if (typeof p === 'string') return p === phongId;
              if (p && typeof p === 'object') return p._id === phongId;
              return false;
            });
          }
          if (typeof tb.phong === 'string') {
            return tb.phong === phongId;
          }
          return false;
        });
      },

      // Get thongBao by khachThue ID (nguoiNhan can be array)
      getThongBaoByKhachThue: (khachThueId: string): ThongBao[] => {
        return data.thongBao.filter((tb: ThongBao) => {
          if (Array.isArray(tb.nguoiNhan)) {
            return tb.nguoiNhan.some((kt: any) => {
              if (typeof kt === 'string') return kt === khachThueId;
              if (kt && typeof kt === 'object') return kt._id === khachThueId;
              return false;
            });
          }
          if (typeof tb.nguoiNhan === 'string') {
            return tb.nguoiNhan === khachThueId;
          }
          return false;
        });
      },

      // Get hopDong by khachThue ID
      getHopDongByKhachThue: (khachThueId: string): HopDong[] => {
        return data.hopDong.filter((hd: HopDong) => {
          if (typeof hd.khachThue === 'string') {
            return hd.khachThue === khachThueId;
          }
          if (hd.khachThue && typeof hd.khachThue === 'object') {
            return hd.khachThue._id === khachThueId;
          }
          // Handle khachThueId array
          if (Array.isArray(hd.khachThueId)) {
            return hd.khachThueId.includes(khachThueId);
          }
          return false;
        });
      },

      // Get phong by trangThai
      getPhongByTrangThai: (trangThai: string): Phong[] => {
        return data.phong.filter((p: Phong) => p.trangThai === trangThai);
      },

      // Get hopDong by trangThai
      getHopDongByTrangThai: (trangThai: string): HopDong[] => {
        return data.hopDong.filter((hd: HopDong) => hd.trangThai === trangThai);
      },

      // Get hoaDon by trangThai
      getHoaDonByTrangThai: (trangThai: string): HoaDon[] => {
        return data.hoaDon.filter((hd: HoaDon) => hd.trangThai === trangThai);
      },

      // Get suCo by trangThai
      getSuCoByTrangThai: (trangThai: string): SuCo[] => {
        return data.suCo.filter((sc: SuCo) => sc.trangThai === trangThai);
      },
    };
  }, [data]);

  return {
    // Raw data
    toaNha: data?.toaNha || [],
    phong: data?.phong || [],
    khachThue: data?.khachThue || [],
    hopDong: data?.hopDong || [],
    hoaDon: data?.hoaDon || [],
    thanhToan: data?.thanhToan || [],
    suCo: data?.suCo || [],
    thongBao: data?.thongBao || [],
    users: data?.users || [],
    stats: data?.stats || null,

    // Loading and error states
    loading: isLoading,
    error,
    refetch,

    // Helper functions
    ...helpers,
  };
}

/**
 * Client-side filtering utilities
 */
export function filterData<T>(
  data: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
): T[] {
  if (!searchTerm.trim()) return data;

  const searchLower = searchTerm.toLowerCase();
  return data.filter((item) =>
    searchFields.some((field) => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(searchLower);
    })
  );
}

/**
 * Client-side pagination
 */
export function paginateData<T>(data: T[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    data: data.slice(startIndex, endIndex),
    total: data.length,
    page,
    limit,
    totalPages: Math.ceil(data.length / limit),
  };
}

