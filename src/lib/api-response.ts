/**
 * Standardized API Response Helpers
 * Ensures consistent response format across all API routes
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Standard API Response format
 */
export interface StandardApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: unknown;
}

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200,
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  }
): NextResponse<StandardApiResponse<T> & { pagination?: typeof pagination }> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
      ...(pagination && { pagination }),
    },
    { status }
  );
}

/**
 * Error response helper
 */
export function errorResponse(
  message: string,
  status: number = 500,
  error?: string,
  details?: unknown
): NextResponse<StandardApiResponse> {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(error && { error }),
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Unauthorized response
 */
export function unauthorizedResponse(
  message: string = 'Unauthorized'
): NextResponse<StandardApiResponse> {
  return errorResponse(message, 401, 'UNAUTHORIZED');
}

/**
 * Not found response
 */
export function notFoundResponse(
  message: string = 'Resource not found'
): NextResponse<StandardApiResponse> {
  return errorResponse(message, 404, 'NOT_FOUND');
}

/**
 * Validation error response
 */
export function validationErrorResponse(
  zodError: z.ZodError
): NextResponse<StandardApiResponse> {
  return NextResponse.json(
    {
      success: false,
      message: zodError.issues[0]?.message || 'Validation error',
      error: 'VALIDATION_ERROR',
      details: zodError.issues,
    },
    { status: 400 }
  );
}

/**
 * Server error response
 */
export function serverErrorResponse(
  error: unknown,
  message: string = 'Internal server error'
): NextResponse<StandardApiResponse> {
  console.error('Server error:', error);
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return NextResponse.json(
    {
      success: false,
      message,
      error: 'SERVER_ERROR',
      ...(isDevelopment && {
        details: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      }),
    },
    { status: 500 }
  );
}

/**
 * Forbidden response
 */
export function forbiddenResponse(
  message: string = 'Forbidden'
): NextResponse<StandardApiResponse> {
  return errorResponse(message, 403, 'FORBIDDEN');
}

/**
 * Bad request response
 */
export function badRequestResponse(
  message: string,
  details?: unknown
): NextResponse<StandardApiResponse> {
  return errorResponse(message, 400, 'BAD_REQUEST', details);
}

