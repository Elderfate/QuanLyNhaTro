import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { 
  ToaNha, 
  Phong, 
  KhachThue, 
  HopDong, 
  HoaDon, 
  ThanhToan, 
  SuCo, 
  ThongBao,
  DashboardStats,
  ChiSoDienNuoc,
  NguoiDung
} from '@/types';

// Default query options for caching
const defaultQueryOptions = {
  staleTime: 30 * 1000, // 30 seconds - data is fresh for 30s
  gcTime: 5 * 60 * 1000, // 5 minutes - cache for 5 minutes after unused
};

// App Data interface
export interface AppData {
  toaNha: ToaNha[];
  phong: Phong[];
  khachThue: KhachThue[];
  hopDong: HopDong[];
  hoaDon: HoaDon[];
  thanhToan: ThanhToan[];
  suCo: SuCo[];
  thongBao: ThongBao[];
  users: NguoiDung[];
  stats: DashboardStats;
}

// Query keys
export const queryKeys = {
  appData: ['app-data'] as const,
  toaNha: ['toa-nha'] as const,
  toaNhaById: (id: string) => ['toa-nha', id] as const,
  phong: ['phong'] as const,
  phongById: (id: string) => ['phong', id] as const,
  khachThue: ['khach-thue'] as const,
  khachThueById: (id: string) => ['khach-thue', id] as const,
  hopDong: ['hop-dong'] as const,
  hopDongById: (id: string) => ['hop-dong', id] as const,
  hoaDon: ['hoa-don'] as const,
  hoaDonById: (id: string) => ['hoa-don', id] as const,
  thanhToan: ['thanh-toan'] as const,
  thanhToanById: (id: string) => ['thanh-toan', id] as const,
  suCo: ['su-co'] as const,
  suCoById: (id: string) => ['su-co', id] as const,
  thongBao: ['thong-bao'] as const,
  thongBaoById: (id: string) => ['thong-bao', id] as const,
  chiSoDienNuoc: ['chi-so-dien-nuoc'] as const,
  chiSoDienNuocById: (id: string) => ['chi-so-dien-nuoc', id] as const,
  dashboard: ['dashboard'] as const,
  users: ['users'] as const,
  userById: (id: string) => ['users', id] as const,
  userProfile: ['user', 'profile'] as const,
};

// ==================== APP DATA (Single Load) ====================
export const useAppDataQuery = () => {
  return useQuery({
    queryKey: queryKeys.appData,
    queryFn: async () => {
      const response = await apiClient.get<AppData>('/api/data');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - cache for 10 minutes after unused
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

// ==================== TÒA NHÀ ====================
export const useToaNhaQuery = (params?: { page?: number; limit?: number; search?: string }) => {
  return useQuery({
    queryKey: [...queryKeys.toaNha, params],
    queryFn: async () => {
      const response = await apiClient.get<ToaNha[]>('/api/toa-nha', params);
      return response.data || [];
    },
    ...defaultQueryOptions,
  });
};

export const useToaNhaByIdQuery = (id: string) => {
  return useQuery({
    queryKey: queryKeys.toaNhaById(id),
    queryFn: async () => {
      const response = await apiClient.get<ToaNha>(`/api/toa-nha/${id}`);
      return response.data;
    },
    enabled: !!id,
    ...defaultQueryOptions,
  });
};

export const useCreateToaNhaMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ToaNha, '_id'>) => 
      apiClient.post<ToaNha>('/api/toa-nha', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
    },
  });
};

export const useUpdateToaNhaMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ToaNha> }) =>
      apiClient.put<ToaNha>(`/api/toa-nha/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
    },
  });
};

export const useDeleteToaNhaMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/toa-nha/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
    },
  });
};

// ==================== PHÒNG ====================
export const usePhongQuery = (params?: { page?: number; limit?: number; search?: string; toaNha?: string; trangThai?: string }) => {
  return useQuery({
    queryKey: [...queryKeys.phong, params],
    queryFn: async () => {
      const response = await apiClient.get<Phong[]>('/api/phong', params);
      return response.data || [];
    },
    ...defaultQueryOptions,
  });
};

export const usePhongByIdQuery = (id: string) => {
  return useQuery({
    queryKey: queryKeys.phongById(id),
    queryFn: async () => {
      const response = await apiClient.get<Phong>(`/api/phong/${id}`);
      return response.data;
    },
    enabled: !!id,
    ...defaultQueryOptions,
  });
};

export const useCreatePhongMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Phong, '_id'>) => 
      apiClient.post<Phong>('/api/phong', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
    },
  });
};

export const useUpdatePhongMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Phong> }) =>
      apiClient.put<Phong>(`/api/phong/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
      queryClient.invalidateQueries({ queryKey: queryKeys.phongById(variables.id) });
    },
  });
};

export const useDeletePhongMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/phong/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
    },
  });
};

// ==================== KHÁCH THUÊ ====================
export const useKhachThueQuery = (params?: { page?: number; limit?: number; search?: string }) => {
  return useQuery({
    queryKey: [...queryKeys.khachThue, params],
    queryFn: async () => {
      const response = await apiClient.get<KhachThue[]>('/api/khach-thue', params);
      return response.data || [];
    },
    ...defaultQueryOptions,
  });
};

export const useKhachThueByIdQuery = (id: string) => {
  return useQuery({
    queryKey: queryKeys.khachThueById(id),
    queryFn: async () => {
      const response = await apiClient.get<KhachThue>(`/api/khach-thue/${id}`);
      return response.data;
    },
    enabled: !!id,
    ...defaultQueryOptions,
  });
};

export const useCreateKhachThueMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<KhachThue, '_id'>) => 
      apiClient.post<KhachThue>('/api/khach-thue', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
    },
  });
};

export const useUpdateKhachThueMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<KhachThue> }) =>
      apiClient.put<KhachThue>(`/api/khach-thue/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
      queryClient.invalidateQueries({ queryKey: queryKeys.khachThueById(variables.id) });
    },
  });
};

export const useDeleteKhachThueMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/khach-thue/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
    },
  });
};

// ==================== HỢP ĐỒNG ====================
export const useHopDongQuery = (params?: { page?: number; limit?: number; search?: string; trangThai?: string }) => {
  return useQuery({
    queryKey: [...queryKeys.hopDong, params],
    queryFn: async () => {
      const response = await apiClient.get<HopDong[]>('/api/hop-dong', params);
      return response.data || [];
    },
    ...defaultQueryOptions,
  });
};

export const useHopDongByIdQuery = (id: string) => {
  return useQuery({
    queryKey: queryKeys.hopDongById(id),
    queryFn: async () => {
      const response = await apiClient.get<HopDong>(`/api/hop-dong/${id}`);
      return response.data;
    },
    enabled: !!id,
    ...defaultQueryOptions,
  });
};

export const useCreateHopDongMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<HopDong, '_id'>) => 
      apiClient.post<HopDong>('/api/hop-dong', data),
    onMutate: async (newHopDong) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.hopDong });
      
      // Snapshot previous value
      const previousHopDong = queryClient.getQueryData(queryKeys.hopDong);
      
      // Optimistically update
      const optimisticHopDong: HopDong = {
        ...newHopDong,
        _id: `temp_${Date.now()}`,
      } as HopDong;
      
      queryClient.setQueryData(queryKeys.hopDong, (old: HopDong[] = []) => [
        optimisticHopDong,
        ...old,
      ]);
      
      return { previousHopDong };
    },
    onError: (err, newHopDong, context) => {
      // Rollback on error
      if (context?.previousHopDong) {
        queryClient.setQueryData(queryKeys.hopDong, context.previousHopDong);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
    },
  });
};

export const useUpdateHopDongMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HopDong> }) =>
      apiClient.put<HopDong>(`/api/hop-dong/${id}`, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.hopDong });
      await queryClient.cancelQueries({ queryKey: queryKeys.hopDongById(id) });
      
      const previousHopDong = queryClient.getQueryData(queryKeys.hopDong);
      const previousHopDongById = queryClient.getQueryData(queryKeys.hopDongById(id));
      
      // Optimistically update
      queryClient.setQueryData(queryKeys.hopDong, (old: HopDong[] = []) =>
        old.map((item) => (item._id === id ? { ...item, ...data } : item))
      );
      
      queryClient.setQueryData(queryKeys.hopDongById(id), (old: HopDong | undefined) =>
        old ? { ...old, ...data } : undefined
      );
      
      return { previousHopDong, previousHopDongById };
    },
    onError: (err, variables, context) => {
      if (context?.previousHopDong) {
        queryClient.setQueryData(queryKeys.hopDong, context.previousHopDong);
      }
      if (context?.previousHopDongById) {
        queryClient.setQueryData(queryKeys.hopDongById(variables.id), context.previousHopDongById);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
      queryClient.invalidateQueries({ queryKey: queryKeys.hopDongById(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
    },
  });
};

export const useDeleteHopDongMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/hop-dong/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.hopDong });
      
      const previousHopDong = queryClient.getQueryData(queryKeys.hopDong);
      
      // Optimistically remove
      queryClient.setQueryData(queryKeys.hopDong, (old: HopDong[] = []) =>
        old.filter((item) => item._id !== id)
      );
      
      return { previousHopDong };
    },
    onError: (err, id, context) => {
      if (context?.previousHopDong) {
        queryClient.setQueryData(queryKeys.hopDong, context.previousHopDong);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
    },
  });
};

// ==================== HÓA ĐƠN ====================
export const useHoaDonQuery = (params?: { page?: number; limit?: number; hopDongId?: string; trangThai?: string }) => {
  return useQuery({
    queryKey: [...queryKeys.hoaDon, params],
    queryFn: async () => {
      const response = await apiClient.get<HoaDon[]>('/api/hoa-don', params);
      return response.data || [];
    },
    ...defaultQueryOptions,
  });
};

export const useHoaDonByIdQuery = (id: string) => {
  return useQuery({
    queryKey: queryKeys.hoaDonById(id),
    queryFn: async () => {
      const response = await apiClient.get<HoaDon>(`/api/hoa-don?id=${id}`);
      return response.data;
    },
    enabled: !!id,
    ...defaultQueryOptions,
  });
};

export const useCreateHoaDonMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<HoaDon, '_id'>) => 
      apiClient.post<HoaDon>('/api/hoa-don', data),
    onMutate: async (newHoaDon) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.hoaDon });
      
      const previousHoaDon = queryClient.getQueryData(queryKeys.hoaDon);
      
      const optimisticHoaDon: HoaDon = {
        ...newHoaDon,
        _id: `temp_${Date.now()}`,
      } as HoaDon;
      
      queryClient.setQueryData(queryKeys.hoaDon, (old: HoaDon[] = []) => [
        optimisticHoaDon,
        ...old,
      ]);
      
      return { previousHoaDon };
    },
    onError: (err, newHoaDon, context) => {
      if (context?.previousHoaDon) {
        queryClient.setQueryData(queryKeys.hoaDon, context.previousHoaDon);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
    },
  });
};

export const useUpdateHoaDonMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HoaDon> }) =>
      apiClient.put<HoaDon>('/api/hoa-don', { id, ...data }),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.hoaDon });
      await queryClient.cancelQueries({ queryKey: queryKeys.hoaDonById(id) });
      
      const previousHoaDon = queryClient.getQueryData(queryKeys.hoaDon);
      const previousHoaDonById = queryClient.getQueryData(queryKeys.hoaDonById(id));
      
      queryClient.setQueryData(queryKeys.hoaDon, (old: HoaDon[] = []) =>
        old.map((item) => (item._id === id ? { ...item, ...data } : item))
      );
      
      queryClient.setQueryData(queryKeys.hoaDonById(id), (old: HoaDon | undefined) =>
        old ? { ...old, ...data } : undefined
      );
      
      return { previousHoaDon, previousHoaDonById };
    },
    onError: (err, variables, context) => {
      if (context?.previousHoaDon) {
        queryClient.setQueryData(queryKeys.hoaDon, context.previousHoaDon);
      }
      if (context?.previousHoaDonById) {
        queryClient.setQueryData(queryKeys.hoaDonById(variables.id), context.previousHoaDonById);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
      queryClient.invalidateQueries({ queryKey: queryKeys.hoaDonById(variables.id) });
    },
  });
};

export const useDeleteHoaDonMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/hoa-don/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.hoaDon });
      
      const previousHoaDon = queryClient.getQueryData(queryKeys.hoaDon);
      
      queryClient.setQueryData(queryKeys.hoaDon, (old: HoaDon[] = []) =>
        old.filter((item) => item._id !== id)
      );
      
      return { previousHoaDon };
    },
    onError: (err, id, context) => {
      if (context?.previousHoaDon) {
        queryClient.setQueryData(queryKeys.hoaDon, context.previousHoaDon);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
    },
  });
};

// ==================== THANH TOÁN ====================
export const useThanhToanQuery = (params?: { page?: number; limit?: number; hopDongId?: string; hoaDonId?: string }) => {
  return useQuery({
    queryKey: [...queryKeys.thanhToan, params],
    queryFn: async () => {
      const response = await apiClient.get<ThanhToan[]>('/api/thanh-toan', params);
      return response.data || [];
    },
    ...defaultQueryOptions,
  });
};

export const useCreateThanhToanMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ThanhToan, '_id'>) => 
      apiClient.post<ThanhToan>('/api/thanh-toan', data),
    onMutate: async (newThanhToan) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.thanhToan });
      await queryClient.cancelQueries({ queryKey: queryKeys.hoaDon });
      
      const previousThanhToan = queryClient.getQueryData(queryKeys.thanhToan);
      
      const optimisticThanhToan: ThanhToan = {
        ...newThanhToan,
        _id: `temp_${Date.now()}`,
      } as ThanhToan;
      
      queryClient.setQueryData(queryKeys.thanhToan, (old: ThanhToan[] = []) => [
        optimisticThanhToan,
        ...old,
      ]);
      
      return { previousThanhToan };
    },
    onError: (err, newThanhToan, context) => {
      if (context?.previousThanhToan) {
        queryClient.setQueryData(queryKeys.thanhToan, context.previousThanhToan);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
    },
  });
};

export const useUpdateThanhToanMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ThanhToan> }) =>
      apiClient.put<ThanhToan>(`/api/thanh-toan/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
    },
  });
};

export const useDeleteThanhToanMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/thanh-toan/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
    },
  });
};

// ==================== SỰ CỐ ====================
export const useSuCoQuery = (params?: { page?: number; limit?: number; search?: string; trangThai?: string }) => {
  return useQuery({
    queryKey: [...queryKeys.suCo, params],
    queryFn: async () => {
      const response = await apiClient.get<SuCo[]>('/api/su-co', params);
      return response.data || [];
    },
    ...defaultQueryOptions,
  });
};

export const useSuCoByIdQuery = (id: string) => {
  return useQuery({
    queryKey: queryKeys.suCoById(id),
    queryFn: async () => {
      const response = await apiClient.get<SuCo>(`/api/su-co/${id}`);
      return response.data;
    },
    enabled: !!id,
    ...defaultQueryOptions,
  });
};

export const useCreateSuCoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<SuCo, '_id'>) => 
      apiClient.post<SuCo>('/api/su-co', data),
    onMutate: async (newSuCo) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.suCo });
      
      const previousSuCo = queryClient.getQueryData(queryKeys.suCo);
      
      const optimisticSuCo: SuCo = {
        ...newSuCo,
        _id: `temp_${Date.now()}`,
      } as SuCo;
      
      queryClient.setQueryData(queryKeys.suCo, (old: SuCo[] = []) => [
        optimisticSuCo,
        ...old,
      ]);
      
      return { previousSuCo };
    },
    onError: (err, newSuCo, context) => {
      if (context?.previousSuCo) {
        queryClient.setQueryData(queryKeys.suCo, context.previousSuCo);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
    },
  });
};

export const useUpdateSuCoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SuCo> }) =>
      apiClient.put<SuCo>(`/api/su-co/${id}`, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.suCo });
      await queryClient.cancelQueries({ queryKey: queryKeys.suCoById(id) });
      
      const previousSuCo = queryClient.getQueryData(queryKeys.suCo);
      const previousSuCoById = queryClient.getQueryData(queryKeys.suCoById(id));
      
      queryClient.setQueryData(queryKeys.suCo, (old: SuCo[] = []) =>
        old.map((item) => (item._id === id ? { ...item, ...data } : item))
      );
      
      queryClient.setQueryData(queryKeys.suCoById(id), (old: SuCo | undefined) =>
        old ? { ...old, ...data } : undefined
      );
      
      return { previousSuCo, previousSuCoById };
    },
    onError: (err, variables, context) => {
      if (context?.previousSuCo) {
        queryClient.setQueryData(queryKeys.suCo, context.previousSuCo);
      }
      if (context?.previousSuCoById) {
        queryClient.setQueryData(queryKeys.suCoById(variables.id), context.previousSuCoById);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
      queryClient.invalidateQueries({ queryKey: queryKeys.suCoById(variables.id) });
    },
  });
};

export const useDeleteSuCoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/su-co/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.suCo });
      
      const previousSuCo = queryClient.getQueryData(queryKeys.suCo);
      
      queryClient.setQueryData(queryKeys.suCo, (old: SuCo[] = []) =>
        old.filter((item) => item._id !== id)
      );
      
      return { previousSuCo };
    },
    onError: (err, id, context) => {
      if (context?.previousSuCo) {
        queryClient.setQueryData(queryKeys.suCo, context.previousSuCo);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
    },
  });
};

// ==================== THÔNG BÁO ====================
export const useThongBaoQuery = (params?: { page?: number; limit?: number; search?: string }) => {
  return useQuery({
    queryKey: [...queryKeys.thongBao, params],
    queryFn: async () => {
      const response = await apiClient.get<ThongBao[]>('/api/thong-bao', params);
      return response.data || [];
    },
    ...defaultQueryOptions,
  });
};

export const useCreateThongBaoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ThongBao, '_id'>) => 
      apiClient.post<ThongBao>('/api/thong-bao', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
    },
  });
};

export const useUpdateThongBaoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ThongBao> }) =>
      apiClient.put<ThongBao>(`/api/thong-bao?id=${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
    },
  });
};

export const useDeleteThongBaoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/thong-bao?id=${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appData });
    },
  });
};

// ==================== CHỈ SỐ ĐIỆN NƯỚC ====================
export const useChiSoDienNuocQuery = (params?: { page?: number; limit?: number; phong?: string }) => {
  return useQuery({
    queryKey: [...queryKeys.chiSoDienNuoc, params],
    queryFn: async () => {
      const response = await apiClient.get<ChiSoDienNuoc[]>('/api/chi-so-dien-nuoc', params);
      return response.data || [];
    },
    ...defaultQueryOptions,
  });
};

export const useCreateChiSoDienNuocMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ChiSoDienNuoc, '_id'>) => 
      apiClient.post<ChiSoDienNuoc>('/api/chi-so-dien-nuoc', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chiSoDienNuoc });
    },
  });
};

export const useUpdateChiSoDienNuocMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ChiSoDienNuoc> }) =>
      apiClient.put<ChiSoDienNuoc>(`/api/chi-so-dien-nuoc/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chiSoDienNuoc });
    },
  });
};

export const useDeleteChiSoDienNuocMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/chi-so-dien-nuoc/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chiSoDienNuoc });
    },
  });
};

// ==================== USERS ====================
export const useUsersQuery = () => {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const response = await apiClient.get<NguoiDung[]>('/api/admin/users');
      return response.data || [];
    },
    ...defaultQueryOptions,
  });
};

export const useUserProfileQuery = () => {
  return useQuery({
    queryKey: queryKeys.userProfile,
    queryFn: async () => {
      const response = await apiClient.get<NguoiDung>('/api/user/profile');
      return response.data;
    },
    ...defaultQueryOptions,
  });
};

export const useUpdateUserProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<NguoiDung>) =>
      apiClient.put<NguoiDung>('/api/user/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile });
    },
  });
};

// Invalidation helpers
export const useInvalidateAll = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries();
  };
};
