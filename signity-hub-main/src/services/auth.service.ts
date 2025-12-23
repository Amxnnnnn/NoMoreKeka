import { api, getErrorMessage } from '@/lib/api';
import { User } from '@/stores/authStore';

/**
 * Authentication Service
 * 
 * This service handles all authentication-related API calls
 */

// Request OTP for admin registration
export const requestAdminSignupOTP = async (email: string) => {
  try {
    const response = await api.post('/auth/admin/request-signup-otp', { email });
    return {
      success: true,
      data: response.data,
      message: response.data.message
    };
  } catch (error: any) {
    const errorCode = error.response?.data?.errorCode;
    const message = errorCode ? getErrorMessage(errorCode) : error.response?.data?.message || 'Failed to send OTP';
    throw new Error(message);
  }
};

// Verify OTP and create admin account
export const verifyAdminSignupOTP = async (data: {
  email: string;
  otpCode: string;
  name: string;
  password: string;
}) => {
  try {
    const response = await api.post('/auth/admin/verify-signup-otp', data);
    return {
      success: true,
      user: response.data.user,
      token: response.data.token,
      message: response.data.message
    };
  } catch (error: any) {
    const errorCode = error.response?.data?.errorCode;
    const message = errorCode ? getErrorMessage(errorCode) : error.response?.data?.message || 'Verification failed';
    throw new Error(message);
  }
};

// Login with email and password
export const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return {
      success: true,
      user: response.data.user,
      token: response.data.token,
      message: 'Login successful'
    };
  } catch (error: any) {
    const errorCode = error.response?.data?.errorCode;
    const message = errorCode ? getErrorMessage(errorCode) : error.response?.data?.message || 'Login failed';
    throw new Error(message);
  }
};

// Get current user profile
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return {
      success: true,
      user: response.data.user
    };
  } catch (error: any) {
    const errorCode = error.response?.data?.errorCode;
    const message = errorCode ? getErrorMessage(errorCode) : error.response?.data?.message || 'Failed to fetch user';
    throw new Error(message);
  }
};

// Request OTP for login (optional)
export const requestLoginOTP = async (email: string) => {
  try {
    const response = await api.post('/auth/login/request-otp', { email });
    return {
      success: true,
      data: response.data,
      message: response.data.message
    };
  } catch (error: any) {
    const errorCode = error.response?.data?.errorCode;
    const message = errorCode ? getErrorMessage(errorCode) : error.response?.data?.message || 'Failed to send OTP';
    throw new Error(message);
  }
};

// Verify OTP for login (optional)
export const verifyLoginOTP = async (email: string, otpCode: string) => {
  try {
    const response = await api.post('/auth/login/verify-otp', { email, otpCode });
    return {
      success: true,
      user: response.data.user,
      token: response.data.token,
      message: response.data.message
    };
  } catch (error: any) {
    const errorCode = error.response?.data?.errorCode;
    const message = errorCode ? getErrorMessage(errorCode) : error.response?.data?.message || 'Verification failed';
    throw new Error(message);
  }
};