import { NextFunction, Request, Response } from 'express';
import { prismaClient } from '../index.validator';
import { ErrorCodes } from '../exceptions/root';
import { BadRequestsException } from '../exceptions/bad_request';
import { NotFoundException } from '../exceptions/not_found';
import { UnauthorizedException } from '../exceptions/unauthorized.ex';

/**
 * Task Management Controller
 * 
 * Handles task operations with role-based access:
 * - All users: View assigned tasks, update status, add comments
 * - Managers: Create tasks, assign to team members, review status
 * - HR/Admin: View all tasks, reassign tasks
 */

/**
 * Get all tasks with role-based filtering
 * GET /api/tasks
 */
export const getTasks = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const { status, priority, projectId, assigneeId } = req.query;

        console.log('Getting tasks for user:', userId, 'role:', userRole);

        // Build where clause based on role
        let whereClause: any = {
            isActive: true,
            project: {
                companyId: req.companyId
            }
        };

        // Role-based filtering
        if (userRole === 'ADMIN' || userRole === 'HR') {
            // Admin/HR can see all tasks in their company
        } else if (userRole === 'MANAGER') {
            // Managers can see tasks from their projects or assigned to them
            whereClause.OR = [
                { 
                    project: {
                        managerId: userId
                    }
                }, // Tasks from projects they manage
                { assigneeId: userId }, // Tasks assigned to them
                { createdById: userId } // Tasks they created
            ];
        } else {
            // Employees can only see tasks assigned to them
            whereClause.assigneeId = userId;
        }

        // Add filters
        if (status) {
            whereClause.status = (status as string).toUpperCase();
        }
        if (priority) {
            whereClause.priority = (priority as string).toUpperCase();
        }
        if (projectId) {
            whereClause.projectId = projectId;
        }
        if (assigneeId && (userRole === 'ADMIN' || userRole === 'HR' || userRole === 'MANAGER')) {
            whereClause.assigneeId = assigneeId;
        }

        const tasks = await prismaClient.task.findMany({
            where: whereClause,
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        team: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                },
                _count: {
                    select: {
                        comments: {
                            where: { isActive: true }
                        }
                    }
                }
            },
            orderBy: [
                { priority: 'desc' },
                { dueDate: 'asc' },
                { createdAt: 'desc' }
            ]
        });

        res.json({
            success: true,
            message: 'Tasks retrieved successfully',
            data: tasks.map(task => ({
                ...task,
                commentCount: task._count.comments,
                isOverdue: task.dueDate && new Date() > task.dueDate && task.status !== 'COMPLETED'
            }))
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get assigned tasks for current user
 * GET /api/tasks/assigned
 */
export const getAssignedTasks = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        const status = req.query.status as string;
        const priority = req.query.priority as string;

        console.log('Getting assigned tasks for user:', userId);

        const whereClause: any = {
            assigneeId: userId,
            isActive: true
        };

        if (status) {
            whereClause.status = (status as string).toUpperCase();
        }

        if (priority) {
            whereClause.priority = (priority as string).toUpperCase();
        }

        const tasks = await prismaClient.task.findMany({
            where: whereClause,
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        team: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                },
                _count: {
                    select: {
                        comments: {
                            where: { isActive: true }
                        }
                    }
                }
            },
            orderBy: [
                { priority: 'desc' },
                { dueDate: 'asc' },
                { createdAt: 'desc' }
            ]
        });

        res.json({
            success: true,
            message: 'Assigned tasks retrieved successfully',
            tasks: tasks.map(task => ({
                ...task,
                commentCount: task._count.comments,
                isOverdue: task.dueDate && new Date() > task.dueDate && task.status !== 'COMPLETED'
            }))
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update task status
 * PUT /api/tasks/:taskId/status
 */
export const updateTaskStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { taskId } = req.params;
        const { status, actualHours } = req.body;
        const userId = req.user?.id;

        console.log('Updating task status:', taskId, 'to:', status);

        // Get task
        const task = await prismaClient.task.findFirst({
            where: {
                id: taskId,
                isActive: true
            },
            include: {
                project: true
            }
        });

        if (!task) {
            throw new NotFoundException(
                'Task not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Check if user can update this task
        const canUpdate = 
            task.assigneeId === userId || // Assigned user
            task.createdById === userId || // Task creator
            ['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || ''); // Manager/HR/Admin

        if (!canUpdate) {
            throw new UnauthorizedException(
                'You do not have permission to update this task',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Prepare update data
        const updateData: any = {
            status: status.toUpperCase()
        };

        // Set completion date if marking as completed
        if (status.toUpperCase() === 'COMPLETED') {
            updateData.completedAt = new Date();
        } else if (task.completedAt) {
            // Clear completion date if changing from completed to other status
            updateData.completedAt = null;
        }

        // Update actual hours if provided
        if (actualHours !== undefined) {
            updateData.actualHours = actualHours;
        }

        const updatedTask = await prismaClient.task.update({
            where: { id: taskId },
            data: updateData,
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        res.json({
            success: true,
            message: 'Task status updated successfully',
            task: updatedTask
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add task comment
 * POST /api/tasks/:taskId/comments
 */
export const addTaskComment = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { taskId } = req.params;
        const { comment } = req.body;
        const userId = req.user?.id;

        console.log('Adding comment to task:', taskId);

        // Validate task exists and user has access
        const task = await prismaClient.task.findFirst({
            where: {
                id: taskId,
                isActive: true
            },
            include: {
                project: {
                    include: {
                        team: {
                            include: {
                                members: {
                                    select: { id: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!task) {
            throw new NotFoundException(
                'Task not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Check if user has access to this task
        const hasAccess = 
            task.assigneeId === userId || // Assigned user
            task.createdById === userId || // Task creator
            task.project.managerId === userId || // Project manager
            task.project.team.members.some(member => member.id === userId) || // Team member
            ['HR', 'ADMIN'].includes(req.user?.role || ''); // HR/Admin

        if (!hasAccess) {
            throw new UnauthorizedException(
                'You do not have access to comment on this task',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Create comment
        const taskComment = await prismaClient.taskComment.create({
            data: {
                taskId: taskId,
                userId: userId!,
                comment: comment
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            }
        });

        res.json({
            success: true,
            message: 'Comment added successfully',
            comment: taskComment
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get task comments
 * GET /api/tasks/:taskId/comments
 */
export const getTaskComments = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { taskId } = req.params;

        console.log('Getting comments for task:', taskId);

        const comments = await prismaClient.taskComment.findMany({
            where: {
                taskId: taskId,
                isActive: true
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            success: true,
            message: 'Task comments retrieved successfully',
            comments: comments
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create new task (Manager/HR/Admin only)
 * POST /api/tasks
 */
export const createTask = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { title, description, projectId, assigneeId, priority, dueDate, estimatedHours } = req.body;
        const createdById = req.user?.id;

        console.log('Creating task:', title);

        // Check permissions
        if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only managers, HR, and admins can create tasks',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Validate project exists
        const project = await prismaClient.project.findFirst({
            where: {
                id: projectId,
                companyId: req.companyId,
                isActive: true
            },
            include: {
                team: {
                    include: {
                        members: {
                            select: { id: true }
                        }
                    }
                }
            }
        });

        if (!project) {
            throw new NotFoundException(
                'Project not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // For managers, ensure they manage this project
        if (req.user?.role === 'MANAGER' && project.managerId !== createdById) {
            throw new UnauthorizedException(
                'You can only create tasks for projects you manage',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Validate assignee is part of the project team (if provided)
        if (assigneeId) {
            const isTeamMember = project.team.members.some(member => member.id === assigneeId);
            if (!isTeamMember) {
                throw new BadRequestsException(
                    'Assignee must be a member of the project team',
                    ErrorCodes.INTERNAL_EXCEPTION
                );
            }
        }

        // Create task
        const task = await prismaClient.task.create({
            data: {
                title: title,
                description: description,
                projectId: projectId,
                assigneeId: assigneeId,
                createdById: createdById!,
                priority: priority || 'MEDIUM',
                dueDate: dueDate ? new Date(dueDate) : null,
                estimatedHours: estimatedHours,
                status: 'TODO'
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        team: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        res.json({
            success: true,
            message: 'Task created successfully',
            task: task
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Assign task to team member (Manager/HR/Admin only)
 * PUT /api/tasks/:taskId/assign
 */
export const assignTask = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { taskId } = req.params;
        const { assigneeId } = req.body;

        console.log('Assigning task:', taskId, 'to:', assigneeId);

        // Check permissions
        if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only managers, HR, and admins can assign tasks',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Get task with project and team info
        const task = await prismaClient.task.findFirst({
            where: {
                id: taskId,
                isActive: true
            },
            include: {
                project: {
                    include: {
                        team: {
                            include: {
                                members: {
                                    select: { id: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!task) {
            throw new NotFoundException(
                'Task not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Validate assignee is part of the project team
        const isTeamMember = task.project.team.members.some(member => member.id === assigneeId);
        if (!isTeamMember) {
            throw new BadRequestsException(
                'Assignee must be a member of the project team',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Update task assignment
        const updatedTask = await prismaClient.task.update({
            where: { id: taskId },
            data: { assigneeId: assigneeId },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        res.json({
            success: true,
            message: 'Task assigned successfully',
            task: updatedTask
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get team tasks (Manager only)
 * GET /api/tasks/team
 */
export const getTeamTasks = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const managerId = req.user?.id;
        const status = req.query.status as string;
        const projectId = req.query.projectId as string;

        console.log('Getting team tasks for manager:', managerId);

        // Check permissions
        if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only managers, HR, and admins can view team tasks',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Build where clause
        const whereClause: any = {
            isActive: true,
            project: {
                companyId: req.companyId
            }
        };

        // For managers, only show tasks from their projects
        if (req.user?.role === 'MANAGER') {
            whereClause.project.managerId = managerId;
        }

        if (status) {
            whereClause.status = status.toUpperCase();
        }

        if (projectId) {
            whereClause.projectId = projectId;
        }

        const tasks = await prismaClient.task.findMany({
            where: whereClause,
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        team: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        comments: {
                            where: { isActive: true }
                        }
                    }
                }
            },
            orderBy: [
                { priority: 'desc' },
                { dueDate: 'asc' },
                { createdAt: 'desc' }
            ]
        });

        res.json({
            success: true,
            message: 'Team tasks retrieved successfully',
            tasks: tasks.map(task => ({
                ...task,
                commentCount: task._count.comments,
                isOverdue: task.dueDate && new Date() > task.dueDate && task.status !== 'COMPLETED'
            }))
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark task as complete/cancelled (Manager/HR/Admin only)
 * PUT /api/tasks/:taskId/complete
 */
export const markTaskComplete = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { taskId } = req.params;
        const { status, actualHours, comments } = req.body; // status: 'COMPLETED' or 'CANCELLED'

        console.log('Marking task as:', status, 'taskId:', taskId);

        // Check permissions
        if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only managers, HR, and admins can mark tasks as complete/cancelled',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Validate status
        if (!['COMPLETED', 'CANCELLED'].includes(status.toUpperCase())) {
            throw new BadRequestsException(
                'Status must be either COMPLETED or CANCELLED',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Get task
        const task = await prismaClient.task.findFirst({
            where: {
                id: taskId,
                isActive: true
            }
        });

        if (!task) {
            throw new NotFoundException(
                'Task not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Update task
        const updateData: any = {
            status: status.toUpperCase()
        };

        if (status.toUpperCase() === 'COMPLETED') {
            updateData.completedAt = new Date();
            if (actualHours) {
                updateData.actualHours = actualHours;
            }
        }

        const updatedTask = await prismaClient.task.update({
            where: { id: taskId },
            data: updateData,
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        // Add comment if provided
        if (comments) {
            await prismaClient.taskComment.create({
                data: {
                    taskId: taskId,
                    userId: req.user?.id!,
                    comment: comments
                }
            });
        }

        res.json({
            success: true,
            message: `Task marked as ${status.toLowerCase()} successfully`,
            task: updatedTask
        });
    } catch (error) {
        next(error);
    }
};