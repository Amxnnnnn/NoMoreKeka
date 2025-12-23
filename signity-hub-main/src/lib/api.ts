import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

// API base URL - update this when backend is connected
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout user
      useAuthStore.getState().logout();
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Error code mapping - matches backend ErrorCodes enum
export const ERROR_MESSAGES: Record<string, string> = {
  // User-related errors (1000s)
  1001: 'No account found with this email address.',
  1002: 'An account with this email already exists.',
  1003: 'The password you entered is incorrect.',
  
  // Validation errors (2000s)
  2002: 'The data you provided is invalid. Please check and try again.',
  
  // System errors (3000s)
  3000: 'Something went wrong. Please try again later.',
  
  // Authorization errors (4000s)
  4001: 'You are not authorized to perform this action.',
  
  // Legacy string-based error codes (for backward compatibility)
  USER_ALREADY_EXIST: 'An account with this email already exists.',
  USER_NOT_FOUND: 'No account found with this email address.',
  INCORRECT_PASSWORD: 'The password you entered is incorrect.',
  UNAUTHORIZED_EXCEPTION: 'You are not authorized to perform this action.',
  INTERNAL_EXCEPTION: 'Something went wrong. Please try again later.',
  UNPROCESSABLE_ENTITY: 'The data you provided is invalid. Please check and try again.',
  INVALID_OTP: 'The OTP you entered is invalid or has expired.',
  OTP_EXPIRED: 'Your OTP has expired. Please request a new one.',
};

export const getErrorMessage = (errorCode: string | number): string => {
  const code = String(errorCode);
  return ERROR_MESSAGES[code] || 'An unexpected error occurred.';
};

// Types for API responses
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  message: string;
  errorCode: string;
  statusCode: number;
  errors?: unknown;
}
