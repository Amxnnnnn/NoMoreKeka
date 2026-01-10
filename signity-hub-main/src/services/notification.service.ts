import { api } from '@/lib/api';
import { handleAPIError } from '@/lib/errorHandler';

/**
 * NOTIFICATION SERVICE
 * 
 * Handles notification management with real-time updates and error handling
 */

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'LEAVE_REQUEST' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'TASK_ASSIGNED' | 'TASK_OVERDUE' | 'PROJECT_DEADLINE' | 'TEAM_UPDATE' | 'SYSTEM_ALERT';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
}

export interface NotificationQueryParams {
  type?: string;
  isRead?: boolean;
  page?: number;
  limit?: number;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  leaveRequests: boolean;
  taskAssignments: boolean;
  projectUpdates: boolean;
  systemAlerts: boolean;
}

class NotificationService {
  private eventSource: EventSource | null = null;
  private listeners: ((notification: Notification) => void)[] = [];

  /**
   * Get notifications for current user
   * GET /api/notifications
   */
  async getNotifications(params: NotificationQueryParams = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });

      const response = await api.get(`/notifications?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.notifications,
        summary: response.data.summary,
        pagination: response.data.pagination,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'NotificationService',
        action: 'getNotifications',
        additionalData: { params }
      });
      throw error;
    }
  }

  /**
   * Get notification summary
   * GET /api/notifications/summary
   */
  async getNotificationSummary() {
    try {
      const response = await api.get('/notifications/summary');
      return {
        success: true,
        data: response.data.summary,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'NotificationService',
        action: 'getNotificationSummary'
      });
      throw error;
    }
  }

  /**
   * Mark notification as read
   * PUT /api/notifications/:notificationId/read
   */
  async markAsRead(notificationId: string) {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return {
        success: true,
        data: response.data.notification,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'NotificationService',
        action: 'markAsRead',
        additionalData: { notificationId }
      });
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   * PUT /api/notifications/read-all
   */
  async markAllAsRead() {
    try {
      const response = await api.put('/notifications/read-all');
      return {
        success: true,
        data: { updatedCount: response.data.updatedCount },
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'NotificationService',
        action: 'markAllAsRead'
      });
      throw error;
    }
  }

  /**
   * Delete notification
   * DELETE /api/notifications/:notificationId
   */
  async deleteNotification(notificationId: string) {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'NotificationService',
        action: 'deleteNotification',
        additionalData: { notificationId }
      });
      throw error;
    }
  }

  /**
   * Clear old notifications (older than specified days)
   * DELETE /api/notifications/clear-old
   */
  async clearOldNotifications(days: number = 30) {
    try {
      const response = await api.delete(`/notifications/clear-old?days=${days}`);
      return {
        success: true,
        data: { deletedCount: response.data.deletedCount },
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'NotificationService',
        action: 'clearOldNotifications',
        additionalData: { days }
      });
      throw error;
    }
  }

  /**
   * Create notification (Internal use - for system/admin)
   * POST /api/notifications
   */
  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    relatedId?: string;
    relatedType?: string;
    actionUrl?: string;
  }) {
    try {
      const response = await api.post('/notifications', data);
      return {
        success: true,
        data: response.data.notification,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'NotificationService',
        action: 'createNotification',
        additionalData: { userId: data.userId, type: data.type }
      });
      throw error;
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<{ success: boolean; data: NotificationPreferences; message: string }> {
    try {
      const response = await api.get('/notifications/preferences');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'NotificationService',
        action: 'getPreferences'
      });
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>) {
    try {
      const response = await api.put('/notifications/preferences', preferences);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'NotificationService',
        action: 'updatePreferences',
        additionalData: { preferences: Object.keys(preferences) }
      });
      throw error;
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  subscribeToRealTime(onNotification: (notification: Notification) => void) {
    try {
      // Add listener
      this.listeners.push(onNotification);

      // Initialize SSE connection if not already connected
      if (!this.eventSource) {
        this.initializeSSE();
      }

      // Return unsubscribe function
      return () => {
        this.listeners = this.listeners.filter(listener => listener !== onNotification);
        
        // Close connection if no more listeners
        if (this.listeners.length === 0 && this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'NotificationService',
        action: 'subscribeToRealTime'
      });
      throw error;
    }
  }

  /**
   * Initialize Server-Sent Events connection
   */
  private initializeSSE() {
    try {
      const token = localStorage.getItem('nomorekeka-auth');
      if (!token) return;

      const authData = JSON.parse(token);
      if (!authData.state?.token) return;

      this.eventSource = new EventSource(
        `${api.defaults.baseURL}/notifications/stream?token=${authData.state.token}`
      );

      this.eventSource.onmessage = (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          this.listeners.forEach(listener => listener(notification));
        } catch (error) {
          console.error('Failed to parse notification:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        
        // Attempt to reconnect after delay
        setTimeout(() => {
          if (this.listeners.length > 0) {
            this.initializeSSE();
          }
        }, 5000);
      };

    } catch (error: any) {
      handleAPIError(error, {
        component: 'NotificationService',
        action: 'initializeSSE'
      });
    }
  }

  /**
   * Disconnect from real-time notifications
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.listeners = [];
  }
}

export const notificationService = new NotificationService();