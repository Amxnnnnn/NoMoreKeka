import { api } from '@/lib/api';
import { handleAPIError } from '@/lib/errorHandler';

/**
 * PROFILE SERVICE
 * 
 * Handles user profile management operations with error handling
 */

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  address?: string;
  profilePhoto?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CompanyInfo {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
    departments: number;
    teams: number;
    projects: number;
  };
}

class ProfileService {
  /**
   * Get current user profile
   */
  async getProfile() {
    try {
      const response = await api.get('/profile');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'ProfileService',
        action: 'getProfile'
      });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData) {
    try {
      const response = await api.put('/profile', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'ProfileService',
        action: 'updateProfile',
        additionalData: { fields: Object.keys(data) }
      });
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordData) {
    try {
      const response = await api.put('/profile/change-password', data);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'ProfileService',
        action: 'changePassword'
      });
      throw error;
    }
  }

  /**
   * Get company information (read-only)
   */
  async getCompanyInfo(): Promise<{ success: boolean; data: CompanyInfo; message: string }> {
    try {
      const response = await api.get('/profile/company');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'ProfileService',
        action: 'getCompanyInfo'
      });
      throw error;
    }
  }
}

export const profileService = new ProfileService();