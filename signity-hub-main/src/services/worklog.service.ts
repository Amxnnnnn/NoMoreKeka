import { api } from '@/lib/api';
import { handleAPIError } from '@/lib/errorHandler';

/**
 * WORK LOG SERVICE
 * 
 * Handles work log and time tracking operations with error handling
 */

export interface CreateWorkLogData {
  projectId?: string;
  taskId?: string;
  date: string;
  hoursWorked: number;
  description: string;
  logType?: 'DAILY' | 'WEEKLY' | 'PROJECT' | 'TASK';
}

export interface UpdateWorkLogData {
  hoursWorked?: number;
  description?: string;
}

export interface WorkLog {
  id: string;
  date: string;
  hoursWorked: number;
  description: string;
  logType: 'DAILY' | 'WEEKLY' | 'PROJECT' | 'TASK';
  isApproved: boolean;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    department?: {
      name: string;
    };
  };
  project?: {
    id: string;
    name: string;
  };
  task?: {
    id: string;
    title: string;
  };
  approver?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface WorkLogQueryParams {
  projectId?: string;
  taskId?: string;
  logType?: 'DAILY' | 'WEEKLY' | 'PROJECT' | 'TASK';
  startDate?: string;
  endDate?: string;
  isApproved?: boolean;
  userId?: string;
  page?: number;
  limit?: number;
}

class WorkLogService {
  /**
   * Create work log entry
   * POST /api/work-logs
   */
  async logWork(data: CreateWorkLogData) {
    try {
      const response = await api.post('/work-logs', data);
      return {
        success: true,
        data: response.data.workLog,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'WorkLogService',
        action: 'logWork',
        additionalData: {
          date: data.date,
          hours: data.hoursWorked,
          logType: data.logType
        }
      });
      throw error;
    }
  }

  /**
   * Get work logs for current user
   * GET /api/work-logs
   */
  async getWorkLogs(params: WorkLogQueryParams = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });

      const response = await api.get(`/work-logs?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.workLogs,
        summary: response.data.summary,
        pagination: response.data.pagination,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'WorkLogService',
        action: 'getWorkLogs',
        additionalData: { params }
      });
      throw error;
    }
  }

  /**
   * Update work log entry
   * PUT /api/work-logs/:workLogId
   */
  async updateWorkLog(workLogId: string, data: UpdateWorkLogData) {
    try {
      const response = await api.put(`/work-logs/${workLogId}`, data);
      return {
        success: true,
        data: response.data.workLog,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'WorkLogService',
        action: 'updateWorkLog',
        additionalData: {
          workLogId,
          updates: Object.keys(data)
        }
      });
      throw error;
    }
  }

  /**
   * Delete work log entry
   * DELETE /api/work-logs/:workLogId
   */
  async deleteWorkLog(workLogId: string) {
    try {
      const response = await api.delete(`/work-logs/${workLogId}`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'WorkLogService',
        action: 'deleteWorkLog',
        additionalData: { workLogId }
      });
      throw error;
    }
  }

  /**
   * Get team work logs (Manager/HR/Admin only)
   * GET /api/work-logs/team
   */
  async getTeamWorkLogs(params: WorkLogQueryParams = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });

      const response = await api.get(`/work-logs/team?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.workLogs,
        summary: response.data.summary,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'WorkLogService',
        action: 'getTeamWorkLogs',
        additionalData: { params }
      });
      throw error;
    }
  }

  /**
   * Approve work log (Manager/HR/Admin only)
   * PUT /api/work-logs/:workLogId/approve
   */
  async approveWorkLog(workLogId: string) {
    try {
      const response = await api.put(`/work-logs/${workLogId}/approve`);
      return {
        success: true,
        data: response.data.workLog,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'WorkLogService',
        action: 'approveWorkLog',
        additionalData: { workLogId }
      });
      throw error;
    }
  }

  /**
   * Get work log summary/statistics
   * GET /api/work-logs/summary
   */
  async getWorkLogSummary(startDate?: string, endDate?: string) {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const response = await api.get(`/work-logs/summary?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'WorkLogService',
        action: 'getWorkLogSummary',
        additionalData: { startDate, endDate }
      });
      throw error;
    }
  }

  /**
   * Get work log reports (HR/Admin only)
   * GET /api/work-logs/reports
   */
  async getWorkLogReports(params: {
    startDate?: string;
    endDate?: string;
    departmentId?: string;
  } = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });

      const response = await api.get(`/work-logs/reports?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.report,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'WorkLogService',
        action: 'getWorkLogReports',
        additionalData: { params }
      });
      throw error;
    }
  }
}

export const worklogService = new WorkLogService();