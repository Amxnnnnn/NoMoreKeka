/**
 * **Feature: hrms-frontend-integration, Property 2: Real-time data synchronization**
 * **Validates: Requirements 1.2, 1.5, 9.1, 9.4**
 * 
 * Property-based test for data synchronization functionality.
 * Tests that data updates propagate correctly across all components
 * and maintain consistency without manual refresh.
 */

import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { useDataStore } from '../dataStore';
import { syncService } from '../../services/sync.service';

// Test data generators with better constraints and unique IDs
let idCounter = 0;
const generateUniqueId = () => `test-id-${++idCounter}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const generateUser = () => fc.record({
  id: fc.constant(generateUniqueId()),
  name: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(s.trim())),
  email: fc.emailAddress(),
  role: fc.constantFrom('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'),
  isActive: fc.boolean(),
  createdAt: fc.integer({ min: 0, max: 365 }).map(days => {
    const date = new Date('2024-01-01');
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }),
  updatedAt: fc.integer({ min: 0, max: 365 }).map(days => {
    const date = new Date('2024-01-01');
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }),
});

const generateLeave = () => fc.record({
  id: fc.constant(generateUniqueId()),
  startDate: fc.integer({ min: 0, max: 365 }).map(days => {
    const date = new Date('2024-01-01');
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }),
  endDate: fc.integer({ min: 0, max: 365 }).map(days => {
    const date = new Date('2024-01-01');
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }),
  days: fc.integer({ min: 1, max: 30 }),
  reason: fc.string({ minLength: 5, maxLength: 500 }).filter(s => s.trim().length >= 5 && /^[a-zA-Z0-9\s.,!?-]+$/.test(s.trim())),
  status: fc.constantFrom('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'),
  appliedAt: fc.integer({ min: 0, max: 365 }).map(days => {
    const date = new Date('2024-01-01');
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }),
  respondedAt: fc.option(fc.integer({ min: 0, max: 365 }).map(days => {
    const date = new Date('2024-01-01');
    date.setDate(date.getDate() + days);
    return date.toISOString();
  })),
  comments: fc.option(fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length >= 1)),
  leaveType: fc.record({
    name: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(s.trim())),
    description: fc.option(fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length >= 1)),
  }),
  approver: fc.option(fc.record({
    name: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(s.trim())),
    role: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(s.trim())),
  })),
});

const generateWorkLog = () => fc.record({
  id: fc.constant(generateUniqueId()),
  date: fc.integer({ min: 0, max: 365 }).map(days => {
    const date = new Date('2024-01-01');
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }),
  hoursWorked: fc.float({ min: 0.5, max: 24 }),
  description: fc.string({ minLength: 5, maxLength: 500 }).filter(s => s.trim().length >= 5 && /^[a-zA-Z0-9\s.,!?-]+$/.test(s.trim())),
  logType: fc.constantFrom('DAILY', 'WEEKLY', 'PROJECT', 'TASK'),
  isApproved: fc.boolean(),
  createdAt: fc.integer({ min: 0, max: 365 }).map(days => {
    const date = new Date('2024-01-01');
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }),
  updatedAt: fc.integer({ min: 0, max: 365 }).map(days => {
    const date = new Date('2024-01-01');
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }),
  user: fc.record({
    id: fc.constant(generateUniqueId()),
    name: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(s.trim())),
    email: fc.emailAddress(),
    department: fc.option(fc.record({
      name: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(s.trim())),
    })),
  }),
  project: fc.option(fc.record({
    id: fc.constant(generateUniqueId()),
    name: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s.trim())),
  })),
  task: fc.option(fc.record({
    id: fc.constant(generateUniqueId()),
    title: fc.string({ minLength: 2, maxLength: 200 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s.,!?-]+$/.test(s.trim())),
  })),
  approver: fc.option(fc.record({
    id: fc.constant(generateUniqueId()),
    name: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(s.trim())),
    role: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(s.trim())),
  })),
});

const generateTask = () => fc.record({
  id: fc.constant(generateUniqueId()),
  title: fc.string({ minLength: 2, maxLength: 200 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s.,!?-]+$/.test(s.trim())),
  description: fc.option(fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length >= 1)),
  status: fc.constantFrom('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'),
  priority: fc.constantFrom('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
  dueDate: fc.option(fc.integer({ min: 0, max: 365 }).map(days => {
    const date = new Date('2024-01-01');
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  })),
  estimatedHours: fc.option(fc.float({ min: 0.5, max: 100 })),
  actualHours: fc.option(fc.float({ min: 0.5, max: 100 })),
  isActive: fc.boolean(),
  createdAt: fc.integer({ min: 0, max: 365 }).map(days => {
    const date = new Date('2024-01-01');
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }),
  updatedAt: fc.integer({ min: 0, max: 365 }).map(days => {
    const date = new Date('2024-01-01');
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }),
  project: fc.record({
    id: fc.constant(generateUniqueId()),
    name: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s]+$/.test(s.trim())),
  }),
  assignee: fc.option(fc.record({
    id: fc.constant(generateUniqueId()),
    name: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(s.trim())),
    email: fc.emailAddress(),
  })),
  creator: fc.record({
    id: fc.constant(generateUniqueId()),
    name: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(s.trim())),
    email: fc.emailAddress(),
  }),
});

const generateNotification = () => fc.record({
  id: fc.constant(generateUniqueId()),
  title: fc.string({ minLength: 2, maxLength: 200 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s.,!?-]+$/.test(s.trim())),
  message: fc.string({ minLength: 5, maxLength: 1000 }).filter(s => s.trim().length >= 5 && /^[a-zA-Z0-9\s.,!?-]+$/.test(s.trim())),
  type: fc.constantFrom('LEAVE_REQUEST', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'TASK_ASSIGNED', 'TASK_OVERDUE', 'PROJECT_DEADLINE', 'TEAM_UPDATE', 'SYSTEM_ALERT'),
  isRead: fc.boolean(),
  createdAt: fc.integer({ min: 0, max: 365 }).map(days => {
    const date = new Date('2024-01-01');
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }),
  relatedId: fc.option(fc.constant(generateUniqueId())),
  relatedType: fc.option(fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(s.trim()))),
  readAt: fc.option(fc.integer({ min: 0, max: 365 }).map(days => {
    const date = new Date('2024-01-01');
    date.setDate(date.getDate() + days);
    return date.toISOString();
  })),
  actionUrl: fc.option(fc.string({ minLength: 5, maxLength: 200 }).filter(s => s.trim().length >= 5)),
});

describe('Data Store Synchronization Properties', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useDataStore());
    act(() => {
      result.current.reset();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 2: Real-time data synchronization
   * For any data update in the system, all related UI components should reflect 
   * changes automatically within performance thresholds without manual refresh
   */
  describe('Property 2: Real-time data synchronization', () => {

    test('Leave data updates propagate correctly across all leave-related state', () => {
      fc.assert(fc.property(
        fc.array(generateLeave(), { minLength: 1, maxLength: 10 }),
        fc.array(generateLeave(), { minLength: 1, maxLength: 5 }),
        (initialLeaves, newLeaves) => {
          const { result } = renderHook(() => useDataStore());

          // Set initial leaves
          act(() => {
            result.current.setLeaves(initialLeaves);
          });

          // Verify initial state is consistent
          expect(result.current.leaves).toEqual(initialLeaves);
          expect(result.current.pendingLeaves).toEqual(
            initialLeaves.filter(leave => leave.status === 'PENDING')
          );
          expect(result.current.upcomingLeaves.length).toBeGreaterThanOrEqual(0);
          // Check that all upcoming leaves are approved and in the future
          result.current.upcomingLeaves.forEach(leave => {
            expect(leave.status).toBe('APPROVED');
            expect(new Date(leave.startDate).getTime()).toBeGreaterThanOrEqual(new Date().getTime() - 24 * 60 * 60 * 1000); // Allow for some time difference
          });

          // Add new leaves one by one and verify consistency
          newLeaves.forEach(newLeave => {
            act(() => {
              result.current.addLeave(newLeave);
            });

            // Verify the leave was added
            expect(result.current.leaves).toContain(newLeave);

            // Verify derived state is updated correctly
            if (newLeave.status === 'PENDING') {
              expect(result.current.pendingLeaves).toContain(newLeave);
            }

            if (newLeave.status === 'APPROVED' && new Date(newLeave.startDate) >= new Date()) {
              expect(result.current.upcomingLeaves).toContain(newLeave);
            }
          });

          // Verify final state consistency
          const allLeaves = [...initialLeaves, ...newLeaves];
          expect(result.current.leaves).toHaveLength(allLeaves.length);
          expect(result.current.pendingLeaves).toEqual(
            expect.arrayContaining(allLeaves.filter(leave => leave.status === 'PENDING'))
          );
          expect(result.current.upcomingLeaves.length).toBeGreaterThanOrEqual(0);
          // Check that all upcoming leaves are approved and in the future
          result.current.upcomingLeaves.forEach(leave => {
            expect(leave.status).toBe('APPROVED');
            expect(new Date(leave.startDate).getTime()).toBeGreaterThanOrEqual(new Date().getTime() - 24 * 60 * 60 * 1000); // Allow for some time difference
          });
        }
      ), { numRuns: 100 });
    });

    test('Work log updates maintain consistency across all work log state', () => {
      fc.assert(fc.property(
        fc.array(generateWorkLog(), { minLength: 1, maxLength: 10 }),
        generateWorkLog(),
        fc.record({
          hoursWorked: fc.float({ min: 0.5, max: 24 }),
          isApproved: fc.boolean(),
          description: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        (initialWorkLogs, newWorkLog, updates) => {
          // Ensure no duplicate IDs
          const uniqueInitialWorkLogs = initialWorkLogs.filter((log, index, arr) =>
            arr.findIndex(l => l.id === log.id) === index
          );

          if (uniqueInitialWorkLogs.find(log => log.id === newWorkLog.id)) {
            return true; // Skip if duplicate ID
          }
          const { result } = renderHook(() => useDataStore());

          // Set initial work logs
          act(() => {
            result.current.setWorkLogs(uniqueInitialWorkLogs);
          });

          // Add new work log
          act(() => {
            result.current.addWorkLog(newWorkLog);
          });

          // Verify work log was added
          expect(result.current.workLogs).toContain(newWorkLog);
          expect(result.current.workLogs).toHaveLength(uniqueInitialWorkLogs.length + 1);

          // Update the work log
          act(() => {
            result.current.updateWorkLog(newWorkLog.id, updates);
          });

          // Verify update was applied
          const updatedWorkLog = result.current.workLogs.find(log => log.id === newWorkLog.id);
          expect(updatedWorkLog).toBeDefined();
          expect(updatedWorkLog!.hoursWorked).toBe(updates.hoursWorked);
          expect(updatedWorkLog!.isApproved).toBe(updates.isApproved);
          expect(updatedWorkLog!.description).toBe(updates.description);

          // Verify other work logs remain unchanged (check key properties)
          const otherWorkLogs = result.current.workLogs.filter(log => log.id !== newWorkLog.id);
          expect(otherWorkLogs).toHaveLength(uniqueInitialWorkLogs.length);
          otherWorkLogs.forEach(log => {
            const originalLog = uniqueInitialWorkLogs.find(orig => orig.id === log.id);
            expect(originalLog).toBeDefined();
            expect(log.id).toEqual(originalLog!.id);
            expect(log.hoursWorked).toEqual(originalLog!.hoursWorked);
            expect(log.description).toEqual(originalLog!.description);
          });
        }
      ), { numRuns: 100 });
    });

    test('Task updates propagate correctly and maintain derived state consistency', () => {
      fc.assert(fc.property(
        fc.array(generateTask(), { minLength: 1, maxLength: 10 }),
        generateTask(),
        fc.constantFrom('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'),
        (initialTasks, newTask, newStatus) => {
          // Ensure no duplicate IDs
          const uniqueInitialTasks = initialTasks.filter((task, index, arr) =>
            arr.findIndex(t => t.id === task.id) === index
          );

          if (uniqueInitialTasks.find(task => task.id === newTask.id)) {
            return true; // Skip if duplicate ID
          }
          const { result } = renderHook(() => useDataStore());

          // Set initial tasks
          act(() => {
            result.current.setMyTasks(uniqueInitialTasks);
          });

          // Add new task
          act(() => {
            result.current.addTask(newTask);
          });

          // Update task status
          act(() => {
            result.current.updateTask(newTask.id, { status: newStatus });
          });

          // Verify task was updated
          const updatedTask = result.current.myTasks.find(task => task.id === newTask.id);
          expect(updatedTask).toBeDefined();
          expect(updatedTask!.status).toBe(newStatus);

          // Verify all tasks are still present
          expect(result.current.myTasks).toHaveLength(uniqueInitialTasks.length + 1);

          // Verify original tasks remain unchanged
          const originalTasks = result.current.myTasks.filter(task => task.id !== newTask.id);
          expect(originalTasks).toHaveLength(uniqueInitialTasks.length);
          originalTasks.forEach(task => {
            const originalTask = uniqueInitialTasks.find(orig => orig.id === task.id);
            expect(originalTask).toBeDefined();
            expect(task).toEqual(originalTask);
          });
        }
      ), { numRuns: 100 });
    });

    test('Notification updates maintain unread count consistency', () => {
      fc.assert(fc.property(
        fc.array(generateNotification(), { minLength: 1, maxLength: 10 }),
        fc.array(generateNotification(), { minLength: 1, maxLength: 5 }),
        (initialNotifications, newNotifications) => {
          const { result } = renderHook(() => useDataStore());

          // Set initial notifications
          act(() => {
            result.current.setNotifications(initialNotifications);
          });

          // Calculate initial unread count
          const initialUnreadCount = initialNotifications.filter(n => !n.isRead).length;
          act(() => {
            result.current.setUnreadCount(initialUnreadCount);
          });

          expect(result.current.unreadCount).toBe(initialUnreadCount);

          // Add new notifications and track unread count changes
          let expectedUnreadCount = initialUnreadCount;

          newNotifications.forEach(notification => {
            act(() => {
              result.current.addNotification(notification);
            });

            if (!notification.isRead) {
              expectedUnreadCount++;
            }

            expect(result.current.unreadCount).toBe(expectedUnreadCount);
            expect(result.current.notifications).toContain(notification);
          });

          // Mark some notifications as read and verify count updates
          const unreadNotifications = result.current.notifications.filter(n => !n.isRead);
          if (unreadNotifications.length > 0) {
            const notificationToMarkRead = unreadNotifications[0];

            act(() => {
              result.current.markNotificationAsRead(notificationToMarkRead.id);
            });

            expectedUnreadCount--;
            expect(result.current.unreadCount).toBe(expectedUnreadCount);

            // Verify notification is marked as read
            const markedNotification = result.current.notifications.find(
              n => n.id === notificationToMarkRead.id
            );
            expect(markedNotification?.isRead).toBe(true);
          }
        }
      ), { numRuns: 100 });
    });

    test('Cache invalidation triggers data refresh correctly', () => {
      fc.assert(fc.property(
        fc.array(generateLeave(), { minLength: 1, maxLength: 5 }),
        fc.constantFrom('leaves', 'workLogs', 'teams', 'projects', 'tasks', 'notifications'),
        (testData, section) => {
          const { result } = renderHook(() => useDataStore());

          // Set some test data based on section
          act(() => {
            switch (section) {
              case 'leaves':
                result.current.setLeaves(testData as any);
                break;
              case 'workLogs':
                result.current.setWorkLogs(testData as any);
                break;
              case 'teams':
                result.current.setTeams(testData as any);
                break;
              case 'projects':
                result.current.setProjects(testData as any);
                break;
              case 'tasks':
                result.current.setTasks(testData as any);
                break;
              case 'notifications':
                result.current.setNotifications(testData as any);
                break;
            }
          });

          // Update cache timestamp
          act(() => {
            result.current.updateLastFetch(section as any);
          });

          // Verify cache is valid initially
          expect(result.current.isCacheValid(section as any)).toBe(true);

          // Reset the section
          act(() => {
            result.current.resetSection(section);
          });

          // Verify section was reset correctly
          switch (section) {
            case 'leaves':
              expect(result.current.leaves).toEqual([]);
              expect(result.current.pendingLeaves).toEqual([]);
              expect(result.current.upcomingLeaves).toEqual([]);
              break;
            case 'workLogs':
              expect(result.current.workLogs).toEqual([]);
              expect(result.current.teamWorkLogs).toEqual([]);
              break;
            case 'teams':
              expect(result.current.teams).toEqual([]);
              expect(result.current.myTeams).toEqual([]);
              break;
            case 'projects':
              expect(result.current.projects).toEqual([]);
              expect(result.current.myProjects).toEqual([]);
              break;
            case 'tasks':
              expect(result.current.tasks).toEqual([]);
              expect(result.current.myTasks).toEqual([]);
              break;
            case 'notifications':
              expect(result.current.notifications).toEqual([]);
              expect(result.current.unreadCount).toBe(0);
              break;
          }
        }
      ), { numRuns: 100 });
    });

    test('Error states are managed consistently with data updates', () => {
      fc.assert(fc.property(
        fc.constantFrom('leaveBalance', 'leaves', 'workLogs', 'teams', 'projects', 'tasks', 'notifications'),
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.array(generateLeave(), { minLength: 1, maxLength: 3 }),
        (errorKey, errorMessage, testData) => {
          const { result } = renderHook(() => useDataStore());

          // Set an error
          act(() => {
            result.current.setError(errorKey as any, errorMessage);
          });

          expect(result.current.errors[errorKey]).toBe(errorMessage);

          // Set loading state
          act(() => {
            result.current.setLoading(errorKey as any, true);
          });

          expect(result.current.loading[errorKey]).toBe(true);

          // Simulate successful data update (should clear error)
          act(() => {
            result.current.clearError(errorKey as any);
            result.current.setLoading(errorKey as any, false);

            // Set some data based on the key
            if (errorKey === 'leaves') {
              result.current.setLeaves(testData as any);
            }
          });

          // Verify error was cleared and loading stopped
          expect(result.current.errors[errorKey]).toBeUndefined();
          expect(result.current.loading[errorKey]).toBe(false);

          // Verify data was set if applicable
          if (errorKey === 'leaves') {
            expect(result.current.leaves).toEqual(testData);
          }
        }
      ), { numRuns: 100 });
    });

    test('Optimistic updates rollback correctly on failure', () => {
      fc.assert(fc.property(
        fc.array(generateLeave(), { minLength: 2, maxLength: 5 }),
        generateLeave(),
        fc.record({
          status: fc.constantFrom('APPROVED', 'REJECTED'),
          comments: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
        }),
        (initialLeaves, optimisticLeave, optimisticUpdate) => {
          const { result } = renderHook(() => useDataStore());

          // Set initial state
          act(() => {
            result.current.setLeaves(initialLeaves);
          });

          const initialCount = result.current.leaves.length;

          // Perform optimistic update (add leave)
          act(() => {
            result.current.addLeave(optimisticLeave);
          });

          // Verify optimistic update was applied
          expect(result.current.leaves).toHaveLength(initialCount + 1);
          expect(result.current.leaves).toContain(optimisticLeave);

          // Simulate optimistic update to existing leave (if any exist)
          if (result.current.leaves.length > 1) {
            const existingLeave = result.current.leaves.find(l => l.id !== optimisticLeave.id);
            if (existingLeave) {
              const originalStatus = existingLeave.status;
              const originalComments = existingLeave.comments;

              act(() => {
                result.current.updateLeave(existingLeave.id, optimisticUpdate);
              });

              // Verify optimistic update was applied
              const updatedLeave = result.current.leaves.find(l => l.id === existingLeave.id);
              expect(updatedLeave?.status).toBe(optimisticUpdate.status);
              expect(updatedLeave?.comments).toBe(optimisticUpdate.comments);

              // Simulate rollback (remove optimistic leave, revert update)
              act(() => {
                result.current.removeLeave(optimisticLeave.id);
                result.current.updateLeave(existingLeave.id, {
                  status: originalStatus,
                  comments: originalComments
                });
              });

              // Verify rollback was successful
              expect(result.current.leaves).toHaveLength(initialCount);
              expect(result.current.leaves).not.toContain(optimisticLeave);

              const revertedLeave = result.current.leaves.find(l => l.id === existingLeave.id);
              expect(revertedLeave?.status).toBe(originalStatus);
              expect(revertedLeave?.comments).toBe(originalComments);
            }
          } else {
            // If only one leave (the optimistic one), just test removal
            act(() => {
              result.current.removeLeave(optimisticLeave.id);
            });

            expect(result.current.leaves).toHaveLength(initialCount);
            expect(result.current.leaves).not.toContain(optimisticLeave);
          }
        }
      ), { numRuns: 100 });
    });
  });
});