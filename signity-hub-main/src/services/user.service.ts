import { api, getErrorMessage } from '@/lib/api';
import { User, UserRole } from '@/stores/authStore';

/**
 * User Management Service
 * 
 * This service handles all user-related API calls
 */

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: UserRole;
}

// Get all users in the company (Admin/HR only)
export const getAllUsers = async () => {
  try {
    const response = await api.get('/users');
    return {
      success: true,
      users: response.data.users,
      total: response.data.total,
      message: response.data.message
    };
  } catch (error: any) {
    const errorCode = error.response?.data?.errorCode;
    const message = errorCode ? getErrorMessage(errorCode) : error.response?.data?.message || 'Failed to fetch users';
    throw new Error(message);
  }
};

// Get current user's profile
export const getUserProfile = async () => {
  try {
    const response = await api.get('/users/profile');
    return {
      success: true,
      user: response.data.user,
      message: response.data.message
    };
  } catch (error: any) {
    const errorCode = error.response?.data?.errorCode;
    const message = errorCode ? getErrorMessage(errorCode) : error.response?.data?.message || 'Failed to fetch profile';
    throw new Error(message);
  }
};

// Get users by role (Admin/HR only)
export const getUsersByRole = async (role: UserRole) => {
  try {
    const response = await api.get(`/users/role/${role}`);
    return {
      success: true,
      users: response.data.users,
      total: response.data.total,
      role: response.data.role,
      message: response.data.message
    };
  } catch (error: any) {
    const errorCode = error.response?.data?.errorCode;
    const message = errorCode ? getErrorMessage(errorCode) : error.response?.data?.message || 'Failed to fetch users';
    throw new Error(message);
  }
};

// Get user by ID (Self or Admin/HR)
export const getUserById = async (userId: string) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return {
      success: true,
      user: response.data.user,
      message: response.data.message
    };
  } catch (error: any) {
    const errorCode = error.response?.data?.errorCode;
    const message = errorCode ? getErrorMessage(errorCode) : error.response?.data?.message || 'Failed to fetch user';
    throw new Error(message);
  }
};

// Update user (Self or Admin/HR)
export const updateUser = async (userId: string, data: UpdateUserData) => {
  try {
    const response = await api.put(`/users/${userId}`, data);
    return {
      success: true,
      user: response.data.user,
      message: response.data.message
    };
  } catch (error: any) {
    const errorCode = error.response?.data?.errorCode;
    const message = errorCode ? getErrorMessage(errorCode) : error.response?.data?.message || 'Failed to update user';
    throw new Error(message);
  }
};

// Deactivate user (Admin only)
export const deactivateUser = async (userId: string) => {
  try {
    const response = await api.delete(`/users/${userId}`);
    return {
      success: true,
      userId: response.data.userId,
      message: response.data.message
    };
  } catch (error: any) {
    const errorCode = error.response?.data?.errorCode;
    const message = errorCode ? getErrorMessage(errorCode) : error.response?.data?.message || 'Failed to deactivate user';
    throw new Error(message);
  }
};

// Activate user (Admin only)
export const activateUser = async (userId: string) => {
  try {
    const response = await api.put(`/users/${userId}/activate`);
    return {
      success: true,
      userId: response.data.userId,
      message: response.data.message
    };
  } catch (error: any) {
    const errorCode = error.response?.data?.errorCode;
    const message = errorCode ? getErrorMessage(errorCode) : error.response?.data?.message || 'Failed to activate user';
    throw new Error(message);
  }
};

// Export as a service object for easier importing
export const userService = {
  getAllUsers,
  getUserProfile,
  getUsersByRole,
  getUserById,
  updateUser,
  deactivateUser,
  activateUser
};