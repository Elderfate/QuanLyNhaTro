/**
 * Centralized query invalidation helpers
 * Ensures consistent cache invalidation across the app
 */

import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/use-api';

/**
 * Invalidate all app data queries
 */
export function invalidateAppData(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.appData });
}

/**
 * Invalidate specific entity queries
 */
export function invalidateEntityQueries(
  queryClient: QueryClient,
  entity: 'toaNha' | 'phong' | 'khachThue' | 'hopDong' | 'hoaDon' | 'thanhToan' | 'suCo' | 'thongBao',
  id?: string
) {
  // Invalidate list query
  queryClient.invalidateQueries({ queryKey: queryKeys[entity] });
  
  // Invalidate specific entity query if ID provided
  if (id) {
    const byIdKey = `${entity}ById` as keyof typeof queryKeys;
    if (typeof queryKeys[byIdKey] === 'function') {
      queryClient.invalidateQueries({ 
        queryKey: (queryKeys[byIdKey] as (id: string) => readonly string[])(id) 
      });
    }
  }
  
  // Always invalidate app data to ensure consistency
  invalidateAppData(queryClient);
}

/**
 * Invalidate multiple entities at once
 */
export function invalidateMultipleEntities(
  queryClient: QueryClient,
  entities: Array<'toaNha' | 'phong' | 'khachThue' | 'hopDong' | 'hoaDon' | 'thanhToan' | 'suCo' | 'thongBao'>
) {
  entities.forEach(entity => {
    queryClient.invalidateQueries({ queryKey: queryKeys[entity] });
  });
  invalidateAppData(queryClient);
}

/**
 * Invalidate all queries (use sparingly)
 */
export function invalidateAll(queryClient: QueryClient) {
  queryClient.invalidateQueries();
}

