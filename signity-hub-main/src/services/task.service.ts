import { api } from '@/lib/api';
import { handleAPIError } from '@/lib/errorHandler';

/**
 * TASK SERVICE
 * 
 * Handles task management operations with error handling
 */

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  estimatedHours?: number;
  projectId: string;
  assigneeId?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  assigneeId?: string;
  isActive?: boolean;
}

export interface TaskQueryParams {
  status?: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId?: string;
  assigneeId?: string;
  creatorId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

class TaskService {
  /**
   * Get all tasks (with role-based filtering)
   */
  async getTasks(params: TaskQueryParams = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });

      const response = await api.get(`/tasks?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TaskService',
        action: 'getTasks',
        additionalData: { params }
      });
      throw error;
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId: string) {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TaskService',
        action: 'getTaskById',
        additionalData: { taskId }
      });
      throw error;
    }
  }

  /**
   * Create new task (Manager/HR/Admin only)
   */
  async createTask(data: CreateTaskData) {
    try {
      const response = await api.post('/tasks', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TaskService',
        action: 'createTask',
        additionalData: {
          title: data.title,
          projectId: data.projectId,
          priority: data.priority
        }
      });
      throw error;
    }
  }

  /**
   * Update task
   */
  async updateTask(taskId: string, data: UpdateTaskData) {
    try {
      const response = await api.put(`/tasks/${taskId}`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TaskService',
        action: 'updateTask',
        additionalData: {
          taskId,
          updates: Object.keys(data)
        }
      });
      throw error;
    }
  }

  /**
   * Delete task (Manager/HR/Admin only)
   */
  async deleteTask(taskId: string) {
    try {
      const response = await api.delete(`/tasks/${taskId}`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TaskService',
        action: 'deleteTask',
        additionalData: { taskId }
      });
      throw error;
    }
  }

  /**
   * Get assigned tasks for current user
   * GET /api/tasks/assigned
   */
  async getAssignedTasks(params: { status?: string; priority?: string } = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });

      const response = await api.get(`/tasks/assigned?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.tasks,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TaskService',
        action: 'getAssignedTasks',
        additionalData: { params }
      });
      throw error;
    }
  }

  /**
   * Get team tasks (Manager/HR/Admin only)
   * GET /api/tasks/team
   */
  async getTeamTasks(params: { status?: string; projectId?: string } = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });

      const response = await api.get(`/tasks/team?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.tasks,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TaskService',
        action: 'getTeamTasks',
        additionalData: { params }
      });
      throw error;
    }
  }

  /**
   * Update task status
   * PUT /api/tasks/:taskId/status
   */
  async updateTaskStatus(taskId: string, status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED', actualHours?: number) {
    try {
      const data: any = { status };
      if (actualHours !== undefined) {
        data.actualHours = actualHours;
      }
      
      const response = await api.put(`/tasks/${taskId}/status`, data);
      return {
        success: true,
        data: response.data.task,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TaskService',
        action: 'updateTaskStatus',
        additionalData: { taskId, status, actualHours }
      });
      throw error;
    }
  }

  /**
   * Assign task to team member (Manager/HR/Admin only)
   * PUT /api/tasks/:taskId/assign
   */
  async assignTask(taskId: string, assigneeId: string) {
    try {
      const response = await api.put(`/tasks/${taskId}/assign`, { assigneeId });
      return {
        success: true,
        data: response.data.task,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TaskService',
        action: 'assignTask',
        additionalData: { taskId, assigneeId }
      });
      throw error;
    }
  }

  /**
   * Mark task as complete/cancelled (Manager/HR/Admin only)
   * PUT /api/tasks/:taskId/complete
   */
  async markTaskComplete(taskId: string, status: 'COMPLETED' | 'CANCELLED', actualHours?: number, comments?: string) {
    try {
      const data: any = { status };
      if (actualHours !== undefined) {
        data.actualHours = actualHours;
      }
      if (comments) {
        data.comments = comments;
      }
      
      const response = await api.put(`/tasks/${taskId}/complete`, data);
      return {
        success: true,
        data: response.data.task,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TaskService',
        action: 'markTaskComplete',
        additionalData: { taskId, status, actualHours }
      });
      throw error;
    }
  }

  /**
   * Add task comment
   * POST /api/tasks/:taskId/comments
   */
  async addTaskComment(taskId: string, comment: string) {
    try {
      const response = await api.post(`/tasks/${taskId}/comments`, { comment });
      return {
        success: true,
        data: response.data.comment,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TaskService',
        action: 'addTaskComment',
        additionalData: { taskId, commentLength: comment.length }
      });
      throw error;
    }
  }

  /**
   * Get task comments
   * GET /api/tasks/:taskId/comments
   */
  async getTaskComments(taskId: string) {
    try {
      const response = await api.get(`/tasks/${taskId}/comments`);
      return {
        success: true,
        data: response.data.comments,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TaskService',
        action: 'getTaskComments',
        additionalData: { taskId }
      });
      throw error;
    }
  }

  /**
   * Get tasks for a specific project
   * GET /api/projects/:projectId/tasks
   */
  async getProjectTasks(projectId: string, params: { status?: string; priority?: string; assigneeId?: string } = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });

      const response = await api.get(`/projects/${projectId}/tasks?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.tasks,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TaskService',
        action: 'getProjectTasks',
        additionalData: { projectId, params }
      });
      
      // Return empty array on error to prevent crashes
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to load project tasks',
        error: error
      };
    }
  }
}

export const taskService = new TaskService();