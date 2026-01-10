import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LeaveBalance, Leave } from '@/services/leave.service';
import { WorkLog } from '@/services/worklog.service';
import { Team } from '@/services/team.service';
import { Project } from '@/services/project.service';
import { Task } from '@/services/task.service';
import { Notification } from '@/services/notification.service';

/**
 * COMPREHENSIVE DATA STORE
 * 
 * Centralized state management for all HRMS data with caching,
 * optimistic updates, and real-time synchronization
 */

interface DataState {
  // Leave Management
  leaveBalance: LeaveBalance[];
  leaves: Leave[];
  pendingLeaves: Leave[];
  upcomingLeaves: Leave[];
  
  // Work Logs
  workLogs: WorkLog[];
  teamWorkLogs: WorkLog[];
  
  // Teams & Projects
  teams: Team[];
  myTeams: Team[];
  projects: Project[];
  myProjects: Project[];
  
  // Tasks
  tasks: Task[];
  myTasks: Task[];
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Loading states
  loading: {
    leaveBalance: boolean;
    leaves: boolean;
    workLogs: boolean;
    teams: boolean;
    projects: boolean;
    tasks: boolean;
    notifications: boolean;
  };
  
  // Error states
  errors: {
    leaveBalance?: string;
    leaves?: string;
    workLogs?: string;
    teams?: string;
    projects?: string;
    tasks?: string;
    notifications?: string;
  };
  
  // Cache timestamps
  lastFetch: {
    leaveBalance?: number;
    leaves?: number;
    workLogs?: number;
    teams?: number;
    projects?: number;
    tasks?: number;
    notifications?: number;
  };
}

interface DataActions {
  // Leave Management Actions
  setLeaveBalance: (balance: LeaveBalance[]) => void;
  setLeaves: (leaves: Leave[]) => void;
  addLeave: (leave: Leave) => void;
  updateLeave: (leaveId: string, updates: Partial<Leave>) => void;
  removeLeave: (leaveId: string) => void;
  
  // Work Log Actions
  setWorkLogs: (workLogs: WorkLog[]) => void;
  addWorkLog: (workLog: WorkLog) => void;
  updateWorkLog: (workLogId: string, updates: Partial<WorkLog>) => void;
  removeWorkLog: (workLogId: string) => void;
  
  // Team Actions
  setTeams: (teams: Team[]) => void;
  setMyTeams: (teams: Team[]) => void;
  addTeam: (team: Team) => void;
  updateTeam: (teamId: string, updates: Partial<Team>) => void;
  removeTeam: (teamId: string) => void;
  
  // Project Actions
  setProjects: (projects: Project[]) => void;
  setMyProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  removeProject: (projectId: string) => void;
  
  // Task Actions
  setTasks: (tasks: Task[]) => void;
  setMyTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  
  // Notification Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (notificationId: string) => void;
  removeNotification: (notificationId: string) => void;
  setUnreadCount: (count: number) => void;
  
  // Loading Actions
  setLoading: (key: keyof DataState['loading'], loading: boolean) => void;
  
  // Error Actions
  setError: (key: keyof DataState['errors'], error?: string) => void;
  clearError: (key: keyof DataState['errors']) => void;
  clearAllErrors: () => void;
  
  // Cache Actions
  updateLastFetch: (key: keyof DataState['lastFetch']) => void;
  isCacheValid: (key: keyof DataState['lastFetch'], maxAge?: number) => boolean;
  
  // Utility Actions
  reset: () => void;
  resetSection: (section: 'leaves' | 'workLogs' | 'teams' | 'projects' | 'tasks' | 'notifications') => void;
}

const initialState: DataState = {
  // Data
  leaveBalance: [],
  leaves: [],
  pendingLeaves: [],
  upcomingLeaves: [],
  workLogs: [],
  teamWorkLogs: [],
  teams: [],
  myTeams: [],
  projects: [],
  myProjects: [],
  tasks: [],
  myTasks: [],
  notifications: [],
  unreadCount: 0,
  
  // Loading states
  loading: {
    leaveBalance: false,
    leaves: false,
    workLogs: false,
    teams: false,
    projects: false,
    tasks: false,
    notifications: false,
  },
  
  // Error states
  errors: {},
  
  // Cache timestamps
  lastFetch: {},
};

export const useDataStore = create<DataState & DataActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Leave Management Actions
      setLeaveBalance: (balance) => set({ leaveBalance: balance }),
      
      setLeaves: (leaves) => {
        const pendingLeaves = leaves.filter(leave => leave.status === 'PENDING');
        const upcomingLeaves = leaves.filter(leave => 
          leave.status === 'APPROVED' && new Date(leave.startDate) >= new Date()
        );
        
        set({ 
          leaves, 
          pendingLeaves, 
          upcomingLeaves 
        });
      },
      
      addLeave: (leave) => set((state) => ({
        leaves: [leave, ...state.leaves],
        pendingLeaves: leave.status === 'PENDING' 
          ? [leave, ...state.pendingLeaves] 
          : state.pendingLeaves,
        upcomingLeaves: leave.status === 'APPROVED' && new Date(leave.startDate) >= new Date()
          ? [leave, ...state.upcomingLeaves]
          : state.upcomingLeaves
      })),
      
      updateLeave: (leaveId, updates) => set((state) => ({
        leaves: state.leaves.map(leave => 
          leave.id === leaveId ? { ...leave, ...updates } : leave
        ),
        pendingLeaves: state.pendingLeaves.map(leave => 
          leave.id === leaveId ? { ...leave, ...updates } : leave
        ).filter(leave => leave.status === 'PENDING'),
        upcomingLeaves: state.upcomingLeaves.map(leave => 
          leave.id === leaveId ? { ...leave, ...updates } : leave
        ).filter(leave => leave.status === 'APPROVED' && new Date(leave.startDate) >= new Date())
      })),
      
      removeLeave: (leaveId) => set((state) => ({
        leaves: state.leaves.filter(leave => leave.id !== leaveId),
        pendingLeaves: state.pendingLeaves.filter(leave => leave.id !== leaveId),
        upcomingLeaves: state.upcomingLeaves.filter(leave => leave.id !== leaveId)
      })),

      // Work Log Actions
      setWorkLogs: (workLogs) => set({ workLogs }),
      
      addWorkLog: (workLog) => set((state) => ({
        workLogs: [workLog, ...state.workLogs]
      })),
      
      updateWorkLog: (workLogId, updates) => set((state) => ({
        workLogs: state.workLogs.map(log => 
          log.id === workLogId ? { ...log, ...updates } : log
        ),
        teamWorkLogs: state.teamWorkLogs.map(log => 
          log.id === workLogId ? { ...log, ...updates } : log
        )
      })),
      
      removeWorkLog: (workLogId) => set((state) => ({
        workLogs: state.workLogs.filter(log => log.id !== workLogId),
        teamWorkLogs: state.teamWorkLogs.filter(log => log.id !== workLogId)
      })),

      // Team Actions
      setTeams: (teams) => set({ teams }),
      setMyTeams: (teams) => set({ myTeams: teams }),
      
      addTeam: (team) => set((state) => ({
        teams: [team, ...state.teams]
      })),
      
      updateTeam: (teamId, updates) => set((state) => ({
        teams: state.teams.map(team => 
          team.id === teamId ? { ...team, ...updates } : team
        ),
        myTeams: state.myTeams.map(team => 
          team.id === teamId ? { ...team, ...updates } : team
        )
      })),
      
      removeTeam: (teamId) => set((state) => ({
        teams: state.teams.filter(team => team.id !== teamId),
        myTeams: state.myTeams.filter(team => team.id !== teamId)
      })),

      // Project Actions
      setProjects: (projects) => set({ projects }),
      setMyProjects: (projects) => set({ myProjects: projects }),
      
      addProject: (project) => set((state) => ({
        projects: [project, ...state.projects]
      })),
      
      updateProject: (projectId, updates) => set((state) => ({
        projects: state.projects.map(project => 
          project.id === projectId ? { ...project, ...updates } : project
        ),
        myProjects: state.myProjects.map(project => 
          project.id === projectId ? { ...project, ...updates } : project
        )
      })),
      
      removeProject: (projectId) => set((state) => ({
        projects: state.projects.filter(project => project.id !== projectId),
        myProjects: state.myProjects.filter(project => project.id !== projectId)
      })),

      // Task Actions
      setTasks: (tasks) => set({ tasks }),
      setMyTasks: (tasks) => set({ myTasks: tasks }),
      
      addTask: (task) => set((state) => ({
        tasks: [task, ...state.tasks],
        myTasks: [task, ...state.myTasks]
      })),
      
      updateTask: (taskId, updates) => set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        ),
        myTasks: state.myTasks.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        )
      })),
      
      removeTask: (taskId) => set((state) => ({
        tasks: state.tasks.filter(task => task.id !== taskId),
        myTasks: state.myTasks.filter(task => task.id !== taskId)
      })),

      // Notification Actions
      setNotifications: (notifications) => set({ notifications }),
      
      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1
      })),
      
      markNotificationAsRead: (notificationId) => set((state) => ({
        notifications: state.notifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true } 
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      })),
      
      removeNotification: (notificationId) => set((state) => {
        const notification = state.notifications.find(n => n.id === notificationId);
        return {
          notifications: state.notifications.filter(n => n.id !== notificationId),
          unreadCount: notification && !notification.isRead 
            ? Math.max(0, state.unreadCount - 1) 
            : state.unreadCount
        };
      }),
      
      setUnreadCount: (count) => set({ unreadCount: count }),

      // Loading Actions
      setLoading: (key, loading) => set((state) => ({
        loading: { ...state.loading, [key]: loading }
      })),

      // Error Actions
      setError: (key, error) => set((state) => ({
        errors: { ...state.errors, [key]: error }
      })),
      
      clearError: (key) => set((state) => {
        const { [key]: _, ...rest } = state.errors;
        return { errors: rest };
      }),
      
      clearAllErrors: () => set({ errors: {} }),

      // Cache Actions
      updateLastFetch: (key) => set((state) => ({
        lastFetch: { ...state.lastFetch, [key]: Date.now() }
      })),
      
      isCacheValid: (key, maxAge = 5 * 60 * 1000) => { // 5 minutes default
        const lastFetch = get().lastFetch[key];
        return lastFetch ? (Date.now() - lastFetch) < maxAge : false;
      },

      // Utility Actions
      reset: () => set(initialState),
      
      resetSection: (section) => set((state) => {
        switch (section) {
          case 'leaves':
            return {
              ...state,
              leaveBalance: [],
              leaves: [],
              pendingLeaves: [],
              upcomingLeaves: []
            };
          case 'workLogs':
            return {
              ...state,
              workLogs: [],
              teamWorkLogs: []
            };
          case 'teams':
            return {
              ...state,
              teams: [],
              myTeams: []
            };
          case 'projects':
            return {
              ...state,
              projects: [],
              myProjects: []
            };
          case 'tasks':
            return {
              ...state,
              tasks: [],
              myTasks: []
            };
          case 'notifications':
            return {
              ...state,
              notifications: [],
              unreadCount: 0
            };
          default:
            return state;
        }
      }),
    }),
    {
      name: 'nomorekeka-data',
      partialize: (state) => ({
        // Only persist essential data, not loading/error states
        leaveBalance: state.leaveBalance,
        leaves: state.leaves,
        workLogs: state.workLogs,
        teams: state.teams,
        myTeams: state.myTeams,
        projects: state.projects,
        myProjects: state.myProjects,
        tasks: state.tasks,
        myTasks: state.myTasks,
        notifications: state.notifications.slice(0, 50), // Limit persisted notifications
        unreadCount: state.unreadCount,
        lastFetch: state.lastFetch,
      }),
    }
  )
);

/**
 * Selectors for computed values
 */
export const useDataSelectors = () => {
  const store = useDataStore();
  
  return {
    // Leave selectors
    getTotalLeaveBalance: () => 
      store.leaveBalance.reduce((total, balance) => total + balance.remainingDays, 0),
    
    getLeaveByStatus: (status: Leave['status']) => 
      store.leaves.filter(leave => leave.status === status),
    
    // Work log selectors
    getTotalHoursThisMonth: () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return store.workLogs
        .filter(log => new Date(log.date) >= startOfMonth)
        .reduce((total, log) => total + log.hoursWorked, 0);
    },
    
    getWorkLogsByProject: (projectId: string) =>
      store.workLogs.filter(log => log.project?.name && log.project.name === projectId),
    
    // Task selectors
    getTasksByStatus: (status: Task['status']) =>
      store.myTasks.filter(task => task.status === status),
    
    getOverdueTasks: () => {
      const now = new Date();
      return store.myTasks.filter(task => 
        task.dueDate && new Date(task.dueDate) < now && task.status !== 'COMPLETED'
      );
    },
    
    // Notification selectors
    getUnreadNotifications: () =>
      store.notifications.filter(notification => !notification.isRead),
    
    getNotificationsByType: (type: Notification['type']) =>
      store.notifications.filter(notification => notification.type === type),
    
    // General selectors
    hasError: (key: keyof DataState['errors']) => !!store.errors[key],
    isLoading: (key: keyof DataState['loading']) => store.loading[key],
    
    // Cache selectors
    needsRefresh: (key: keyof DataState['lastFetch'], maxAge = 5 * 60 * 1000) =>
      !store.isCacheValid(key, maxAge),
  };
};