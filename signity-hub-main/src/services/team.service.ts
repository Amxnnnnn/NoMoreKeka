import { api } from '@/lib/api';
import { handleAPIError } from '@/lib/errorHandler';

/**
 * TEAM SERVICE
 * 
 * Handles team management operations with error handling
 */

export interface Team {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  manager: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  members: TeamMember[];
  projects?: Array<{
    id: string;
    name: string;
    status: string;
    progress?: number;
  }>;
  _count?: {
    members: number;
    projects: number;
  };
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  department?: {
    name: string;
  };
  assignedTasks?: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string;
  }>;
}

export interface CreateTeamData {
  name: string;
  description?: string;
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
}

export interface TeamQueryParams {
  departmentId?: string;
  managerId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

class TeamService {
  /**
   * Get managed teams (Manager/HR/Admin only)
   * GET /api/teams/managed
   */
  async getManagedTeams() {
    try {
      const response = await api.get('/teams/managed');
      return {
        success: true,
        data: response.data.teams,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TeamService',
        action: 'getManagedTeams'
      });
      throw error;
    }
  }

  /**
   * Get all teams (with role-based filtering)
   * Uses /teams/managed endpoint as per backend API
   */
  async getTeams(params: TeamQueryParams = {}) {
    try {
      // Backend only supports /teams/managed endpoint, not /teams with query params
      // For now, we'll use getManagedTeams and filter client-side if needed
      const response = await api.get('/teams/managed');
      console.log(response,"team data");
      return {
        success: true,
        data: response.data.teams,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TeamService',
        action: 'getTeams',
        additionalData: { params }
      });
      throw error;
    }
  }

  /**
   * Get team by ID
   * GET /api/teams/:teamId/structure (using structure endpoint for detailed info)
   */
  async getTeamById(teamId: string) {
    try {
      const response = await api.get(`/teams/${teamId}/structure`);
      return {
        success: true,
        data: response.data.team,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TeamService',
        action: 'getTeamById',
        additionalData: { teamId }
      });
      throw error;
    }
  }

  /**
   * Create new team (Manager/HR/Admin only)
   * POST /api/teams
   */
  async createTeam(data: CreateTeamData) {
    try {
      const response = await api.post('/teams', data);
      return {
        success: true,
        data: response.data.team,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TeamService',
        action: 'createTeam',
        additionalData: {
          name: data.name
        }
      });
      throw error;
    }
  }

  /**
   * Update team (Manager/HR/Admin only)
   * PUT /api/teams/:teamId
   */
  async updateTeam(teamId: string, data: UpdateTeamData) {
    try {
      const response = await api.put(`/teams/${teamId}`, data);
      return {
        success: true,
        data: response.data.team,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TeamService',
        action: 'updateTeam',
        additionalData: {
          teamId,
          updates: Object.keys(data)
        }
      });
      throw error;
    }
  }

  /**
   * Delete team (Manager/HR/Admin only)
   * Note: Backend doesn't have delete endpoint, this would need to be implemented
   */
  async deleteTeam(teamId: string) {
    try {
      // Backend doesn't have delete endpoint, using update to set isActive: false
      const response = await api.put(`/teams/${teamId}`, { isActive: false });
      return {
        success: true,
        data: response.data.team,
        message: 'Team deactivated successfully'
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TeamService',
        action: 'deleteTeam',
        additionalData: { teamId }
      });
      throw error;
    }
  }

  /**
   * Get team structure
   * GET /api/teams/:teamId/structure
   */
  async getTeamStructure(teamId: string) {
    try {
      const response = await api.get(`/teams/${teamId}/structure`);
      return {
        success: true,
        data: response.data.team,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TeamService',
        action: 'getTeamStructure',
        additionalData: { teamId }
      });
      throw error;
    }
  }

  /**
   * Get team members
   * GET /api/teams/:teamId/structure (using structure endpoint)
   */
  async getTeamMembers(teamId: string) {
    try {
      const response = await api.get(`/teams/${teamId}/structure`);
      return {
        success: true,
        data: response.data.team.members,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TeamService',
        action: 'getTeamMembers',
        additionalData: { teamId }
      });
      throw error;
    }
  }

  /**
   * Get team workload analysis (Manager/HR/Admin only)
   * GET /api/teams/:teamId/workload
   */
  async getTeamWorkload(teamId: string) {
    try {
      const response = await api.get(`/teams/${teamId}/workload`);
      return {
        success: true,
        data: {
          team: response.data.team,
          summary: response.data.summary,
          memberWorkloads: response.data.memberWorkloads
        },
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TeamService',
        action: 'getTeamWorkload',
        additionalData: { teamId }
      });
      throw error;
    }
  }

  /**
   * Add member to team (Manager/HR/Admin only)
   * PUT /api/teams/:teamId/members
   */
  async addTeamMember(teamId: string, userId: string) {
    try {
      const response = await api.put(`/teams/${teamId}/members`, { memberIds: [userId] });
      return {
        success: true,
        data: response.data.team,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TeamService',
        action: 'addTeamMember',
        additionalData: { teamId, userId }
      });
      throw error;
    }
  }

  /**
   * Add multiple members to team (Manager/HR/Admin only)
   * PUT /api/teams/:teamId/members
   */
  async addTeamMembers(teamId: string, userIds: string[]) {
    try {
      const response = await api.put(`/teams/${teamId}/members`, { memberIds: userIds });
      return {
        success: true,
        data: response.data.team,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TeamService',
        action: 'addTeamMembers',
        additionalData: { teamId, userCount: userIds.length }
      });
      throw error;
    }
  }

  /**
   * Remove member from team (Manager/HR/Admin only)
   * DELETE /api/teams/:teamId/members/:memberId
   */
  async removeTeamMember(teamId: string, memberId: string) {
    try {
      const response = await api.delete(`/teams/${teamId}/members/${memberId}`);
      return {
        success: true,
        data: response.data.removedMember,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TeamService',
        action: 'removeTeamMember',
        additionalData: { teamId, memberId }
      });
      throw error;
    }
  }

  /**
   * Get my teams (teams where user is a member or manager)
   * Uses /teams/managed for now
   */
  async getMyTeams() {
    try {
      const response = await api.get('/teams/managed');
      return {
        success: true,
        data: response.data.teams,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TeamService',
        action: 'getMyTeams'
      });
      throw error;
    }
  }

  /**
   * Get team performance metrics (Manager/HR/Admin only)
   * GET /api/teams/:teamId/performance
   */
  async getTeamPerformance(teamId: string) {
    try {
      const response = await api.get(`/teams/${teamId}/performance`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TeamService',
        action: 'getTeamPerformance',
        additionalData: { teamId }
      });
      throw error;
    }
  }

  /**
   * Get team performance metrics (Manager/HR/Admin only)
   * GET /api/teams/:teamId/workload (using workload endpoint for metrics)
   */
  async getTeamMetrics(teamId: string, startDate?: string, endDate?: string) {
    try {
      const response = await api.get(`/teams/${teamId}/workload`);
      return {
        success: true,
        data: {
          team: response.data.team,
          metrics: response.data.summary,
          memberMetrics: response.data.memberWorkloads
        },
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TeamService',
        action: 'getTeamMetrics',
        additionalData: { teamId, startDate, endDate }
      });
      throw error;
    }
  }

  /**
   * Reassign team member to another team (Manager/HR/Admin only)
   * PUT /api/teams/:teamId/members/:memberId/reassign
   */
  async reassignTeamMember(teamId: string, memberId: string, newTeamId: string) {
    try {
      const response = await api.put(`/teams/${teamId}/members/${memberId}/reassign`, { newTeamId });
      return {
        success: true,
        data: response.data.member,
        message: response.data.message
      };
    } catch (error: any) {
      handleAPIError(error, {
        component: 'TeamService',
        action: 'reassignTeamMember',
        additionalData: { teamId, memberId, newTeamId }
      });
      throw error;
    }
  }
}

export const teamService = new TeamService();