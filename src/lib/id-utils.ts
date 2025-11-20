/**
 * Utility functions for ID normalization and comparison
 * Handles cases where IDs can be strings, objects, or arrays
 */

/**
 * Normalize an ID to a string
 * Handles: string, object with _id/id, array, null, undefined
 */
export function normalizeId(id: any): string | null {
  if (!id) return null;
  if (typeof id === 'string') return id;
  if (typeof id === 'number') return String(id);
  if (Array.isArray(id)) {
    // If array, return first element normalized
    return normalizeId(id[0]);
  }
  if (typeof id === 'object' && id !== null) {
    // Try common ID fields
    return id._id || id.id || id.toString() || null;
  }
  return String(id);
}

/**
 * Normalize an ID array to string array
 */
export function normalizeIdArray(ids: any): string[] {
  if (!ids) return [];
  if (Array.isArray(ids)) {
    return ids.map(normalizeId).filter((id): id is string => id !== null);
  }
  const normalized = normalizeId(ids);
  return normalized ? [normalized] : [];
}

/**
 * Compare two IDs (handles string, object, array)
 */
export function compareIds(id1: any, id2: any): boolean {
  const normalized1 = normalizeId(id1);
  const normalized2 = normalizeId(id2);
  if (!normalized1 || !normalized2) return false;
  return normalized1 === normalized2;
}

/**
 * Check if an ID is in an array of IDs
 */
export function isIdInArray(id: any, idArray: any[]): boolean {
  const normalizedId = normalizeId(id);
  if (!normalizedId) return false;
  return idArray.some(item => compareIds(item, normalizedId));
}

/**
 * Extract ID from a relationship field (can be string or populated object)
 */
export function extractIdFromRelationship(rel: any): string | null {
  return normalizeId(rel);
}

/**
 * Safe string comparison for IDs
 */
export function safeIdEquals(id1: any, id2: any): boolean {
  return String(normalizeId(id1) || '') === String(normalizeId(id2) || '');
}

