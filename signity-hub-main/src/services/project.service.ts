import { api } from '@/lib/api';
import { handleAPIError } from '@/lib/errorHandler';
import { BaseService, ServiceRegistry } from './base.service';
import { useDataStore } from '@/stores/dataStore';

/**
 * ENHANCED PROJECT SERVICE
 * 
 * Handles project management operations with caching, optimistic updates,
 * and real-time synchronization capabilities
 */

export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  progress?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  manager: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
  team: {
    id: string;
    name: string;
    _count?: {
      members: number;
    };
  };
  tasks?: ProjectTask[];
  _count?: {
    tasks: number;
    completedTasks?: number;
  };
  teamSize?: number;
  totalTasks?: number;
}

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateProjectData {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  teamId: string;
  managerId?: string; // Optional since backend can use current user
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  status?: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  progress?: number;
  managerId?: string;
  teamId?: string;
  isActive?: boolean;
}

export interface ProjectQueryParams {
  status?: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  search?: string;
  managerId?: string;
  teamId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

class ProjectService extends BaseService {
  constructor() {
    super();
    // Register this service for global cache management
    ServiceRegistry.register('ProjectService', this);
    
    // Setup real-time sync for project-related events
    this.setupRealTimeSync(['project_updated', 'project_created', 'project_deleted', 'task_updated'], (event, data) => {
      this.handleRealTimeUpdate(event, data);
    });
  }

  /**
   * Get all projects with caching and role-based filtering
   */
  async getProjects(params: ProjectQueryParams = {}) {
    const cacheKey = `projects_${JSON.stringify(params)}`;
    
    try {
      const result = await this.getCachedData<Project[]>(
        '/projects',
        { key: cacheKey, ttl: 5 * 60 * 1000 }, // Cache for 5 minutes
        params
      );

      // Update store with fresh data
      if (result.success) {
        useDataStore.getState().setProjects(result.data);
        useDataStore.getState().updateLastFetch('projects');
      }

      return result;
    } catch (error: any) {
      console.error('Failed to get projects:', error);
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        return {
          success: false,
          data: [],
          message: 'You don\'t have permission to view projects. Please contact your administrator.',
          error: error
        };
      }
      
      if (error.response?.status === 401) {
        return {
          success: false,
          data: [],
          message: 'Your session has expired. Please log in again.',
          error: error
        };
      }
      
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to load projects',
        error: error
      };
    }
  }

  /**
   * Get assigned projects for current user
   */
  async getAssignedProjects() {
    return this.getCachedData<Project[]>(
      '/projects/assigned',
      { key: 'assigned_projects', ttl: 3 * 60 * 1000 } // Cache for 3 minutes
    );
  }

  /**
   * Get managed projects (Manager/HR/Admin only)
   */
  async getManagedProjects() {
    return this.getCachedData<Project[]>(
      '/projects/managed',
      { key: 'managed_projects', ttl: 3 * 60 * 1000 } // Cache for 3 minutes
    );
  }

  /**
   * Get project by ID with caching
   */
  async getProjectById(projectId: string) {
    return this.getCachedData<Project>(
      `/projects/${projectId}`,
      { key: `project_${projectId}`, ttl: 3 * 60 * 1000 } // Cache for 3 minutes
    );
  }

  /**
   * Create new project with optimistic updates
   */
  async createProject(data: CreateProjectData) {
    const store = useDataStore.getState();
    
    // Create optimistic project entry
    const optimisticProject: Project = {
      id: `temp_${Date.now()}`,
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      status: 'PLANNING',
      priority: data.priority,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      manager: {
        id: data.managerId,
        name: 'Loading...',
        email: ''
      },
      team: {
        id: data.teamId,
        name: 'Loading...'
      },
      tasks: [],
      _count: {
        tasks: 0,
        completedTasks: 0
      }
    };

    return this.postWithOptimisticUpdate<CreateProjectData, Project>(
      '/projects',
      data,
      {
        updateStore: (newProject) => {
          store.addProject(newProject);
        },
        rollbackStore: (originalData) => {
          store.removeProject(optimisticProject.id);
        },
        onSuccess: (newProject) => {
          // Remove optimistic entry and add real one
          store.removeProject(optimisticProject.id);
          store.addProject(newProject);
          
          // Invalidate related caches
          this.invalidateCache('projects');
          this.invalidateCache('my_projects');
        },
        onError: (error, originalData) => {
          console.error('Failed to create project:', error);
        }
      }
    );
  }

  /**
   * Update project with optimistic updates
   */
  async updateProject(projectId: string, data: UpdateProjectData) {
    const store = useDataStore.getState();
    
    return this.putWithOptimisticUpdate<UpdateProjectData, Project>(
      `/projects/${projectId}`,
      data,
      {
        updateStore: (updatedProject) => {
          store.updateProject(projectId, updatedProject);
        },
        rollbackStore: (originalData) => {
          console.log('Rolling back project update');
        },
        onSuccess: (updatedProject) => {
          // Invalidate related caches
          this.invalidateCache(`project_${projectId}`);
          this.invalidateCache('projects');
          this.invalidateCache('my_projects');
        }
      }
    );
  }

  /**
   * Delete project with optimistic updates
   */
  async deleteProject(projectId: string) {
    const store = useDataStore.getState();
    
    return this.deleteWithOptimisticUpdate<Project>(
      `/projects/${projectId}`,
      {
        updateStore: (deletedProject) => {
          store.removeProject(projectId);
        },
        rollbackStore: (originalData) => {
          if (originalData) {
            store.addProject(originalData);
          }
        },
        onSuccess: () => {
          // Invalidate related caches
          this.invalidateCache(`project_${projectId}`);
          this.invalidateCache('projects');
          this.invalidateCache('my_projects');
        }
      }
    );
  }

  /**
   * Get my projects with caching
   */
  async getMyProjects() {
    try {
      const result = await this.getCachedData<Project[]>(
        '/projects/my-projects',
        { key: 'my_projects', ttl: 3 * 60 * 1000 } // Cache for 3 minutes
      );

      // Update store with fresh data
      if (result.success) {
        useDataStore.getState().setMyProjects(result.data);
        useDataStore.getState().updateLastFetch('projects');
      }

      return result;
    } catch (error: any) {
      console.error('Failed to get my projects:', error);
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        return {
          success: false,
          data: [],
          message: 'You don\'t have permission to view projects. Please contact your administrator.',
          error: error
        };
      }
      
      if (error.response?.status === 401) {
        return {
          success: false,
          data: [],
          message: 'Your session has expired. Please log in again.',
          error: error
        };
      }
      
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to load your projects',
        error: error
      };
    }
  }

  /**
   * Get project members for a project
   * GET /api/projects/:projectId/members
   */
  async getProjectMembers(projectId: string) {
    return this.getCachedData<{
      id: string;
      name: string;
      manager: {
        id: string;
        name: string;
        email: string;
        role: string;
      };
      team: {
        id: string;
        name: string;
        members: Array<{
          id: string;
          name: string;
          email: string;
          role: string;
          department: {
            name: string;
          };
          assignedTasks: Array<{
            id: string;
            title: string;
            status: string;
            priority: string;
          }>;
        }>;
      };
      memberCount: number;
    }>(
      `/projects/${projectId}/members`,
      { key: `project_members_${projectId}`, ttl: 3 * 60 * 1000 } // Cache for 3 minutes
    );
  }

  /**
   * Get project tasks with caching
   */
  async getProjectTasks(projectId: string, params?: {
    status?: string;
    priority?: string;
    assigneeId?: string;
  }) {
    const cacheKey = `project_tasks_${projectId}_${JSON.stringify(params || {})}`;
    return this.getCachedData<{
      project: {
        id: string;
        name: string;
      };
      tasks: Array<ProjectTask & {
        commentCount: number;
      }>;
    }>(
      `/projects/${projectId}/tasks`,
      { key: cacheKey, ttl: 2 * 60 * 1000 }, // Cache for 2 minutes
      params
    );
  }

  /**
   * Get project metrics and statistics with caching
   */
  async getProjectMetrics(projectId: string) {
    return this.getCachedData<{
      totalTasks: number;
      completedTasks: number;
      inProgressTasks: number;
      overdueTasks: number;
      completionPercentage: number;
      averageTaskDuration: number;
      teamProductivity: number;
      milestones: Array<{
        name: string;
        dueDate: string;
        status: string;
        progress: number;
      }>;
    }>(
      `/projects/${projectId}/metrics`,
      { key: `project_metrics_${projectId}`, ttl: 5 * 60 * 1000 } // Cache for 5 minutes
    );
  }

  /**
   * Get project performance metrics using enterprise formulas
   */
  async getProjectPerformance(projectId: string) {
    return this.getCachedData<{
      projectId: string;
      projectName: string;
      status: string;
      priority: string;
      progress: number;
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      performance: {
        projectPerformance: number;
        taskCompletionRate: number;
        deadlineAdherence: number;
        timeAccuracyScore: number;
        activeTaskRatio: number;
      };
      taskMetrics: {
        totalTasks: number;
        completedTasks: number;
        pendingTasks: number;
        taskStatusDistribution: Record<string, number>;
      };
      timeMetrics: {
        tasksWithTimeData: number;
        totalEstimatedHours: number;
        totalActualHours: number;
      };
      deadlineMetrics: {
        hasDeadline: boolean;
        deadline?: string;
        daysToDeadline?: number;
        isOverdue: boolean;
        tasksWithDeadlines: number;
        onTimeTasks: number;
      };
    }>(
      `/projects/${projectId}/performance`,
      { key: `project_performance_${projectId}`, ttl: 5 * 60 * 1000 } // Cache for 5 minutes
    );
  }

  /**
   * Get project timeline/gantt data
   */
  async getProjectTimeline(projectId: string) {
    return this.getCachedData<{
      phases: Array<{
        id: string;
        name: string;
        startDate: string;
        endDate: string;
        progress: number;
        tasks: Array<{
          id: string;
          title: string;
          startDate: string;
          endDate: string;
          progress: number;
          dependencies: string[];
        }>;
      }>;
    }>(
      `/projects/${projectId}/timeline`,
      { key: `project_timeline_${projectId}`, ttl: 10 * 60 * 1000 } // Cache for 10 minutes
    );
  }

  /**
   * Batch update multiple projects
   */
  async batchUpdateProjects(updates: Array<{ projectId: string; data: UpdateProjectData }>) {
    const operations = updates.map(({ projectId, data }) => 
      () => this.updateProject(projectId, data)
    );

    return this.batchOperations(operations, 3); // Process 3 at a time
  }

  /**
   * Get project dashboard data (aggregated)
   */
  async getProjectDashboard() {
    try {
      const result = await this.getCachedData<{
        totalProjects: number;
        activeProjects: number;
        completedProjects: number;
        overdueProjects: number;
        projectsByStatus: Array<{ status: string; count: number }>;
        projectsByPriority: Array<{ priority: string; count: number }>;
        recentProjects: Project[];
        upcomingDeadlines: Array<{
          projectId: string;
          projectName: string;
          deadline: string;
          daysRemaining: number;
        }>;
        teamWorkload?: Array<{
          teamId: string;
          teamName: string;
          activeProjects: number;
          totalTasks: number;
        }>;
      }>(
        '/projects/dashboard',
        { key: 'project_dashboard', ttl: 5 * 60 * 1000 } // Cache for 5 minutes
      );

      console.log('ProjectService: Dashboard result:', result);

      return result;
    } catch (error: any) {
      console.error('ProjectService: Failed to get project dashboard:', error);
      
      return {
        success: false,
        data: {
          totalProjects: 0,
          activeProjects: 0,
          completedProjects: 0,
          overdueProjects: 0,
          projectsByStatus: [],
          projectsByPriority: [],
          recentProjects: [],
          upcomingDeadlines: [],
          teamWorkload: []
        },
        message: error.response?.data?.message || 'Failed to load dashboard data',
        error: error
      };
    }
  }

  /**
   * Search projects with advanced filters
   */
  async searchProjects(query: string, filters?: {
    status?: string[];
    priority?: string[];
    teamIds?: string[];
    managerIds?: string[];
    dateRange?: { start: string; end: string };
  }) {
    const params: Record<string, any> = { query };
    if (filters) {
      Object.assign(params, filters);
    }

    return this.getCachedData<{
      projects: Project[];
      totalCount: number;
      facets: {
        statuses: Array<{ value: string; count: number }>;
        priorities: Array<{ value: string; count: number }>;
        teams: Array<{ id: string; name: string; count: number }>;
      };
    }>(
      '/projects/search',
      { key: `project_search_${JSON.stringify(params)}`, ttl: 2 * 60 * 1000 }, // Cache for 2 minutes
      params
    );
  }

  /**
   * Handle real-time updates
   */
  private handleRealTimeUpdate(event: string, data: any): void {
    const store = useDataStore.getState();
    
    switch (event) {
      case 'project_created':
        store.addProject(data.project);
        this.invalidateCache('projects');
        this.invalidateCache('project_dashboard');
        break;
        
      case 'project_updated':
        store.updateProject(data.projectId, data.updates);
        this.invalidateCache(`project_${data.projectId}`);
        this.invalidateCache('projects');
        this.invalidateCache('project_dashboard');
        break;
        
      case 'project_deleted':
        store.removeProject(data.projectId);
        this.invalidateCache(`project_${data.projectId}`);
        this.invalidateCache('projects');
        this.invalidateCache('project_dashboard');
        break;
        
      case 'task_updated':
        // Invalidate project-specific caches when tasks change
        this.invalidateCache(`project_tasks_${data.projectId}`);
        this.invalidateCache(`project_metrics_${data.projectId}`);
        break;
    }
  }

  /**
   * Prefetch project data for better UX
   */
  async prefetchProjectData(): Promise<void> {
    try {
      // Prefetch commonly needed data
      await Promise.all([
        this.getMyProjects(),
        this.getProjectDashboard(),
        this.getProjects({ limit: 10, status: 'IN_PROGRESS' }) // Get active projects
      ]);
    } catch (error) {
      console.warn('Failed to prefetch project data:', error);
    }
  }

  /**
   * Export project data
   */
  async exportProject(projectId: string, format: 'pdf' | 'excel' | 'csv' = 'pdf') {
    try {
      const response = await api.get(`/projects/${projectId}/export`, {
        params: { format },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `project_${projectId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'Project exported successfully' };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'ProjectService',
        action: 'exportProject',
        additionalData: { projectId, format }
      });
      throw error;
    }
  }
}

export const projectService = new ProjectService();