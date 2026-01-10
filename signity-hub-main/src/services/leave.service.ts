import { api } from '@/lib/api';
import { handleAPIError } from '@/lib/errorHandler';
import { BaseService, ServiceRegistry } from './base.service';
import { useDataStore } from '@/stores/dataStore';

/**
 * ENHANCED LEAVE SERVICE
 * 
 * Handles leave management operations with caching, optimistic updates,
 * and real-time synchronization capabilities
 */

export interface LeaveBalance {
  id: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  year: number;
  leaveType: {
    id: string;
    name: string;
    description?: string;
    defaultDays: number;
  };
}

export interface ApplyLeaveData {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface Leave {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  appliedAt: string;
  respondedAt?: string;
  comments?: string;
  leaveType: {
    name: string;
    description?: string;
  };
  approver?: {
    name: string;
    role: string;
  };
}

export interface LeaveApprovalData {
  status: 'APPROVED' | 'REJECTED';
  comments?: string;
}

export interface LeaveQueryParams {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

class LeaveService extends BaseService {
  constructor() {
    super();
    // Register this service for global cache management
    ServiceRegistry.register('LeaveService', this);
    
    // Setup real-time sync for leave-related events
    this.setupRealTimeSync(['leave_approved', 'leave_rejected', 'leave_applied'], (event, data) => {
      this.handleRealTimeUpdate(event, data);
    });
  }

  /**
   * Get leave balance for current user with caching
   */
  async getLeaveBalance(): Promise<{ success: boolean; data: LeaveBalance[]; message: string }> {
    const result = await this.getCachedData<LeaveBalance[]>(
      '/leaves/balance',
      { key: 'leave_balance', ttl: 10 * 60 * 1000 } // Cache for 10 minutes
    );

    // Update store with fresh data
    if (result.success) {
      useDataStore.getState().setLeaveBalance(result.data);
      useDataStore.getState().updateLastFetch('leaveBalance');
    }

    return result;
  }

  /**
   * Apply for leave with optimistic updates
   */
  async applyLeave(data: ApplyLeaveData) {
    const store = useDataStore.getState();
    
    // Create optimistic leave entry
    const optimisticLeave: Leave = {
      id: `temp_${Date.now()}`,
      startDate: data.startDate,
      endDate: data.endDate,
      days: this.calculateLeaveDays(data.startDate, data.endDate),
      reason: data.reason,
      status: 'PENDING',
      appliedAt: new Date().toISOString(),
      leaveType: {
        name: 'Loading...',
      },
    };

    return this.postWithOptimisticUpdate<ApplyLeaveData, Leave>(
      '/leaves/apply',
      data,
      {
        updateStore: (newLeave) => {
          store.addLeave(newLeave);
          // Invalidate leave balance cache as it might have changed
          this.invalidateCache('leave_balance');
        },
        rollbackStore: (originalData) => {
          store.removeLeave(optimisticLeave.id);
        },
        onSuccess: (newLeave) => {
          // Remove optimistic entry and add real one
          store.removeLeave(optimisticLeave.id);
          store.addLeave(newLeave);
          
          // Refresh leave balance
          this.getLeaveBalance();
        },
        onError: (error, originalData) => {
          console.error('Failed to apply leave:', error);
        }
      }
    );
  }

  /**
   * Get leave history with caching and pagination
   */
  async getLeaveHistory(params: LeaveQueryParams = {}) {
    const cacheKey = `leave_history_${JSON.stringify(params)}`;
    
    const result = await this.getCachedData<Leave[]>(
      '/leaves/history',
      { key: cacheKey, ttl: 5 * 60 * 1000 }, // Cache for 5 minutes
      params
    );

    // Update store with fresh data
    if (result.success) {
      useDataStore.getState().setLeaves(result.data);
      useDataStore.getState().updateLastFetch('leaves');
    }

    return result;
  }

  /**
   * Get current leave status with caching
   */
  async getLeaveStatus() {
    return this.getCachedData<{
      pending: Leave[];
      upcoming: Leave[];
      current: Leave[];
    }>(
      '/leaves/status',
      { key: 'leave_status', ttl: 2 * 60 * 1000 } // Cache for 2 minutes
    );
  }

  /**
   * Get team leave requests (Manager/HR/Admin only)
   */
  async getTeamLeaveRequests() {
    return this.getCachedData<Leave[]>(
      '/leaves/team',
      { key: 'team_leave_requests', ttl: 1 * 60 * 1000 } // Cache for 1 minute
    );
  }

  /**
   * Process leave request (approve/reject) with optimistic updates
   */
  async processLeaveRequest(leaveId: string, data: LeaveApprovalData) {
    const store = useDataStore.getState();
    
    return this.putWithOptimisticUpdate<LeaveApprovalData, Leave>(
      `/leaves/${leaveId}/process`,
      data,
      {
        updateStore: (updatedLeave) => {
          store.updateLeave(leaveId, updatedLeave);
        },
        rollbackStore: (originalData) => {
          // Rollback would need the original leave data
          console.log('Rolling back leave approval');
        },
        onSuccess: (updatedLeave) => {
          // Invalidate related caches
          this.invalidateCache('team_leave_requests');
          this.invalidateCache('leave_status');
          
          // If approved, might affect leave balance
          if (data.status === 'APPROVED') {
            this.invalidateCache('leave_balance');
          }
        }
      }
    );
  }

  /**
   * Get upcoming leaves for calendar/dashboard view
   */
  async getUpcomingLeaves(params: {
    startDate?: string;
    endDate?: string;
    teamOnly?: boolean;
  } = {}) {
    const cacheKey = `upcoming_leaves_${JSON.stringify(params)}`;
    
    return this.getCachedData<Array<{
      id: string;
      startDate: string;
      endDate: string;
      status: string;
      user: {
        id: string;
        name: string;
      };
      leaveType: {
        id: string;
        name: string;
      };
      reason: string;
    }>>(
      '/leaves/upcoming',
      { key: cacheKey, ttl: 5 * 60 * 1000 }, // Cache for 5 minutes
      params
    );
  }

  /**
   * Approve leave request with optimistic updates
   */
  async approveLeave(leaveId: string, comments?: string) {
    const store = useDataStore.getState();
    
    return this.putWithOptimisticUpdate<{ comments?: string }, Leave>(
      `/leaves/${leaveId}/approve`,
      { comments },
      {
        updateStore: (updatedLeave) => {
          store.updateLeave(leaveId, { status: 'APPROVED', comments });
        },
        rollbackStore: (originalData) => {
          console.log('Rolling back leave approval');
        },
        onSuccess: (updatedLeave) => {
          // Invalidate related caches
          this.invalidateCache('team_leave_requests');
          this.invalidateCache('leave_status');
          this.invalidateCache('leave_balance');
        }
      }
    );
  }

  /**
   * Reject leave request with optimistic updates
   */
  async rejectLeave(leaveId: string, comments?: string) {
    const store = useDataStore.getState();
    
    return this.putWithOptimisticUpdate<{ comments?: string }, Leave>(
      `/leaves/${leaveId}/reject`,
      { comments },
      {
        updateStore: (updatedLeave) => {
          store.updateLeave(leaveId, { status: 'REJECTED', comments });
        },
        rollbackStore: (originalData) => {
          console.log('Rolling back leave rejection');
        },
        onSuccess: (updatedLeave) => {
          // Invalidate related caches
          this.invalidateCache('team_leave_requests');
          this.invalidateCache('leave_status');
        }
      }
    );
  }

  /**
   * Cancel leave request with optimistic updates
   */
  async cancelLeaveRequest(leaveId: string) {
    const store = useDataStore.getState();
    
    return this.putWithOptimisticUpdate<Record<string, never>, Leave>(
      `/leaves/${leaveId}/cancel`,
      {},
      {
        updateStore: (updatedLeave) => {
          store.updateLeave(leaveId, { status: 'CANCELLED' });
        },
        rollbackStore: (originalData) => {
          console.log('Rolling back leave cancellation');
        },
        onSuccess: (updatedLeave) => {
          // Invalidate related caches
          this.invalidateCache('leave_status');
          this.invalidateCache('leave_balance');
        }
      }
    );
  }

  /**
   * Get leave analytics/summary
   */
  async getLeaveAnalytics(startDate?: string, endDate?: string) {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.getCachedData<{
      totalLeaves: number;
      approvedLeaves: number;
      pendingLeaves: number;
      rejectedLeaves: number;
      averageLeaveDays: number;
      leavesByType: Array<{ type: string; count: number }>;
    }>(
      '/leaves/analytics',
      { key: `leave_analytics_${JSON.stringify(params)}`, ttl: 15 * 60 * 1000 }, // Cache for 15 minutes
      params
    );
  }

  /**
   * Get team leaves for calendar view (Manager/HR/Admin only)
   */
  async getTeamLeaves(teamId: string, startDate?: string, endDate?: string) {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.getCachedData<Array<{
      id: string;
      startDate: string;
      endDate: string;
      status: string;
      user: {
        id: string;
        name: string;
      };
      leaveType: {
        id: string;
        name: string;
      };
      reason: string;
    }>>(
      `/teams/${teamId}/leaves`,
      { key: `team_leaves_${teamId}_${JSON.stringify(params)}`, ttl: 5 * 60 * 1000 }, // Cache for 5 minutes
      params
    );
  }

  /**
   * Handle real-time updates
   */
  private handleRealTimeUpdate(event: string, data: {
    leaveId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    respondedAt?: string;
    comments?: string;
    approver?: { name: string; role: string };
    leave?: Leave;
  }): void {
    const store = useDataStore.getState();
    
    switch (event) {
      case 'leave_approved':
      case 'leave_rejected':
        store.updateLeave(data.leaveId, { 
          status: data.status,
          respondedAt: data.respondedAt,
          comments: data.comments,
          approver: data.approver
        });
        
        // Invalidate relevant caches
        this.invalidateCache('leave_status');
        this.invalidateCache('team_leave_requests');
        break;
        
      case 'leave_applied':
        store.addLeave(data.leave);
        this.invalidateCache('team_leave_requests');
        break;
    }
  }

  /**
   * Calculate leave days between two dates
   */
  private calculateLeaveDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  /**
   * Prefetch related data for better UX
   */
  async prefetchLeaveData(): Promise<void> {
    try {
      // Prefetch commonly needed data
      await Promise.all([
        this.getLeaveBalance(),
        this.getLeaveStatus(),
        this.getLeaveHistory({ limit: 10 }) // Get recent history
      ]);
    } catch (error) {
      console.warn('Failed to prefetch leave data:', error);
    }
  }
}

export const leaveService = new LeaveService();