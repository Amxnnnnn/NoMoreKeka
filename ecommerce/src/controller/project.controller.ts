import { NextFunction, Request, Response } from 'express';
import { prismaClient } from '../index.validator';
import { ErrorCodes } from '../exceptions/root';
import { BadRequestsException } from '../exceptions/bad_request';
import { NotFoundException } from '../exceptions/not_found';
import { UnauthorizedException } from '../exceptions/unauthorized.ex';

/**
 * Project Management Controller
 * 
 * Handles project operations with role-based access:
 * - All users: View assigned projects, project details
 * - Managers: Create, update, assign projects to teams
 * - HR/Admin: View all projects, reassign managers
 */

/**
 * Get assigned projects for current user
 * GET /api/projects/assigned
 */
export const getAssignedProjects = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        console.log('Getting assigned projects for user:', userId);

        // Get projects where user is either:
        // 1. Project manager
        // 2. Team member (through team assignment)
        // 3. Has assigned tasks in the project

        const projects = await prismaClient.project.findMany({
            where: {
                companyId: req.companyId,
                isActive: true,
                OR: [
                    { managerId: userId }, // User is project manager
                    { 
                        team: {
                            members: {
                                some: { id: userId }
                            }
                        }
                    }, // User is team member
                    {
                        tasks: {
                            some: { assigneeId: userId }
                        }
                    } // User has assigned tasks
                ]
            },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        _count: {
                            select: {
                                members: true
                            }
                        }
                    }
                },
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        tasks: {
                            where: { isActive: true }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            success: true,
            message: 'Assigned projects retrieved successfully',
            projects: projects.map(project => ({
                ...project,
                teamSize: project.team._count.members,
                totalTasks: project._count.tasks
            }))
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get project details by ID
 * GET /api/projects/:projectId
 */
export const getProjectDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { projectId } = req.params;
        const userId = req.user?.id;

        console.log('Getting project details for:', projectId);

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
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                                department: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        },
                        manager: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                },
                tasks: {
                    where: { isActive: true },
                    include: {
                        assignee: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
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

        // Check if user has access to this project
        const hasAccess = 
            project.managerId === userId || // User is project manager
            project.team.members.some(member => member.id === userId) || // User is team member
            project.tasks.some(task => task.assigneeId === userId) || // User has assigned tasks
            ['HR', 'ADMIN'].includes(req.user?.role || ''); // HR/Admin can view all

        if (!hasAccess) {
            throw new UnauthorizedException(
                'You do not have access to this project',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Calculate project statistics
        const taskStats = project.tasks.reduce((acc, task) => {
            acc[task.status.toLowerCase()] = (acc[task.status.toLowerCase()] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        res.json({
            success: true,
            message: 'Project details retrieved successfully',
            project: {
                ...project,
                statistics: {
                    totalTasks: project.tasks.length,
                    completedTasks: taskStats.completed || 0,
                    inProgressTasks: taskStats.in_progress || 0,
                    todoTasks: taskStats.todo || 0,
                    teamSize: project.team.members.length
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get team members for a project (read-only)
 * GET /api/projects/:projectId/members
 */
export const getProjectMembers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { projectId } = req.params;

        console.log('Getting project members for:', projectId);

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
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                                department: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                },
                                assignedTasks: {
                                    where: {
                                        projectId: projectId,
                                        isActive: true
                                    },
                                    select: {
                                        id: true,
                                        title: true,
                                        status: true,
                                        priority: true
                                    }
                                }
                            }
                        }
                    }
                },
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
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

        res.json({
            success: true,
            message: 'Project members retrieved successfully',
            project: {
                id: project.id,
                name: project.name,
                manager: project.manager,
                team: project.team,
                memberCount: project.team.members.length
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create new project (Manager/HR/Admin only)
 * POST /api/projects
 */
export const createProject = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, description, teamId, priority, startDate, endDate, deadline } = req.body;
        const managerId = req.user?.id;

        console.log('Creating project:', name, 'by manager:', managerId);

        // Check permissions
        if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only managers, HR, and admins can create projects',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Validate team exists and user has access
        const team = await prismaClient.team.findFirst({
            where: {
                id: teamId,
                companyId: req.companyId,
                isActive: true
            }
        });

        if (!team) {
            throw new NotFoundException(
                'Team not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // For managers, ensure they manage this team (HR/Admin can assign to any team)
        if (req.user?.role === 'MANAGER' && team.managerId !== managerId) {
            throw new UnauthorizedException(
                'You can only create projects for teams you manage',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Create project
        const project = await prismaClient.project.create({
            data: {
                name: name,
                description: description,
                teamId: teamId,
                managerId: managerId!,
                companyId: req.companyId!,
                priority: priority || 'MEDIUM',
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                deadline: deadline ? new Date(deadline) : null,
                status: 'PLANNING'
            },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        _count: {
                            select: {
                                members: true
                            }
                        }
                    }
                },
                manager: {
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
            message: 'Project created successfully',
            project: project
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update project (Manager/HR/Admin only)
 * PUT /api/projects/:projectId
 */
export const updateProject = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { projectId } = req.params;
        const { name, description, status, priority, startDate, endDate, deadline, progress } = req.body;
        const userId = req.user?.id;

        console.log('Updating project:', projectId);

        // Get existing project
        const existingProject = await prismaClient.project.findFirst({
            where: {
                id: projectId,
                companyId: req.companyId,
                isActive: true
            }
        });

        if (!existingProject) {
            throw new NotFoundException(
                'Project not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Check permissions
        const canUpdate = 
            existingProject.managerId === userId || // Project manager
            ['HR', 'ADMIN'].includes(req.user?.role || ''); // HR/Admin

        if (!canUpdate) {
            throw new UnauthorizedException(
                'You do not have permission to update this project',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Prepare update data
        const updateData: any = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (status) updateData.status = status;
        if (priority) updateData.priority = priority;
        if (startDate) updateData.startDate = new Date(startDate);
        if (endDate) updateData.endDate = new Date(endDate);
        if (deadline) updateData.deadline = new Date(deadline);
        if (progress !== undefined) updateData.progress = Math.max(0, Math.min(100, progress));

        // Update project
        const updatedProject = await prismaClient.project.update({
            where: { id: projectId },
            data: updateData,
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        _count: {
                            select: {
                                members: true
                            }
                        }
                    }
                },
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        tasks: {
                            where: { isActive: true }
                        }
                    }
                }
            }
        });

        res.json({
            success: true,
            message: 'Project updated successfully',
            project: updatedProject
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get managed projects (Manager only)
 * GET /api/projects/managed
 */
export const getManagedProjects = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const managerId = req.user?.id;

        console.log('Getting managed projects for:', managerId);

        // Check if user is a manager
        if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only managers, HR, and admins can view managed projects',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        const whereClause: any = {
            companyId: req.companyId,
            isActive: true
        };

        // Managers see only their projects, HR/Admin see all
        if (req.user?.role === 'MANAGER') {
            whereClause.managerId = managerId;
        }

        const projects = await prismaClient.project.findMany({
            where: whereClause,
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        _count: {
                            select: {
                                members: true
                            }
                        }
                    }
                },
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        tasks: {
                            where: { isActive: true }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            success: true,
            message: 'Managed projects retrieved successfully',
            projects: projects.map(project => ({
                ...project,
                teamSize: project.team._count.members,
                totalTasks: project._count.tasks
            }))
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Assign project to team (Manager/HR/Admin only)
 * PUT /api/projects/:projectId/assign
 */
export const assignProjectToTeam = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { projectId } = req.params;
        const { teamId } = req.body;

        console.log('Assigning project to team:', projectId, '->', teamId);

        // Check permissions
        if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only managers, HR, and admins can assign projects',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Validate project exists
        const project = await prismaClient.project.findFirst({
            where: {
                id: projectId,
                companyId: req.companyId,
                isActive: true
            }
        });

        if (!project) {
            throw new NotFoundException(
                'Project not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Validate team exists
        const team = await prismaClient.team.findFirst({
            where: {
                id: teamId,
                companyId: req.companyId,
                isActive: true
            }
        });

        if (!team) {
            throw new NotFoundException(
                'Team not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Update project team assignment
        const updatedProject = await prismaClient.project.update({
            where: { id: projectId },
            data: { teamId: teamId },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        _count: {
                            select: {
                                members: true
                            }
                        }
                    }
                },
                manager: {
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
            message: 'Project assigned to team successfully',
            project: updatedProject
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all projects with role-based filtering
 * GET /api/projects
 */
export const getProjects = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const { status, priority, search } = req.query;

        console.log('Getting projects for user:', userId, 'role:', userRole);

        // Build where clause based on role
        let whereClause: any = {
            companyId: req.companyId,
            isActive: true
        };

        // Role-based filtering
        if (userRole === 'ADMIN') {
            // Admin can see all projects
        } else if (userRole === 'HR') {
            // HR can see all projects in their company (already filtered by companyId)
        } else if (userRole === 'MANAGER') {
            // Managers can see projects they manage or are assigned to
            whereClause.OR = [
                { managerId: userId }, // Projects they manage
                { 
                    team: {
                        members: {
                            some: { id: userId }
                        }
                    }
                }, // Projects where they're team members
                {
                    tasks: {
                        some: { assigneeId: userId }
                    }
                } // Projects where they have assigned tasks
            ];
        } else {
            // Employees can only see projects they're assigned to
            whereClause.OR = [
                { 
                    team: {
                        members: {
                            some: { id: userId }
                        }
                    }
                }, // Projects where they're team members
                {
                    tasks: {
                        some: { assigneeId: userId }
                    }
                } // Projects where they have assigned tasks
            ];
        }

        // Add filters
        if (status) {
            whereClause.status = status;
        }
        if (priority) {
            whereClause.priority = priority;
        }
        if (search) {
            whereClause.OR = whereClause.OR || [];
            whereClause.OR.push(
                { name: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } }
            );
        }

        const projects = await prismaClient.project.findMany({
            where: whereClause,
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        _count: {
                            select: {
                                members: true
                            }
                        }
                    }
                },
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        tasks: {
                            where: { isActive: true }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            success: true,
            message: 'Projects retrieved successfully',
            projects: projects.map(project => ({
                ...project,
                teamSize: project.team._count.members,
                totalTasks: project._count.tasks
            }))
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's assigned projects
 * GET /api/projects/my-projects
 */
export const getMyProjects = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        console.log('Getting my projects for user:', userId);

        const projects = await prismaClient.project.findMany({
            where: {
                companyId: req.companyId,
                isActive: true,
                OR: [
                    { managerId: userId }, // User is project manager
                    { 
                        team: {
                            members: {
                                some: { id: userId }
                            }
                        }
                    }, // User is team member
                    {
                        tasks: {
                            some: { assigneeId: userId }
                        }
                    } // User has assigned tasks
                ]
            },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        _count: {
                            select: {
                                members: true
                            }
                        }
                    }
                },
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        tasks: {
                            where: { isActive: true }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            success: true,
            message: 'My projects retrieved successfully',
            projects: projects.map(project => ({
                ...project,
                teamSize: project.team._count.members,
                totalTasks: project._count.tasks
            }))
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get project dashboard statistics
 * GET /api/projects/dashboard
 */
export const getProjectDashboard = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;

        console.log('Getting project dashboard for user:', userId, 'role:', userRole);

        // Build where clause based on role (same logic as getProjects)
        let whereClause: any = {
            companyId: req.companyId,
            isActive: true
        };

        if (userRole === 'ADMIN') {
            // Admin can see all projects
        } else if (userRole === 'HR') {
            // HR can see all projects in their company
        } else if (userRole === 'MANAGER') {
            whereClause.OR = [
                { managerId: userId },
                { 
                    team: {
                        members: {
                            some: { id: userId }
                        }
                    }
                },
                {
                    tasks: {
                        some: { assigneeId: userId }
                    }
                }
            ];
        } else {
            whereClause.OR = [
                { 
                    team: {
                        members: {
                            some: { id: userId }
                        }
                    }
                },
                {
                    tasks: {
                        some: { assigneeId: userId }
                    }
                }
            ];
        }

        // Get project counts by status
        const projectsByStatus = await prismaClient.project.groupBy({
            by: ['status'],
            where: whereClause,
            _count: {
                id: true
            }
        });

        // Get project counts by priority
        const projectsByPriority = await prismaClient.project.groupBy({
            by: ['priority'],
            where: whereClause,
            _count: {
                id: true
            }
        });

        // Get total counts
        const totalProjects = await prismaClient.project.count({
            where: whereClause
        });

        const activeProjects = await prismaClient.project.count({
            where: {
                ...whereClause,
                status: 'IN_PROGRESS'
            }
        });

        const completedProjects = await prismaClient.project.count({
            where: {
                ...whereClause,
                status: 'COMPLETED'
            }
        });

        const overdueProjects = await prismaClient.project.count({
            where: {
                ...whereClause,
                deadline: {
                    lt: new Date()
                },
                status: {
                    not: 'COMPLETED'
                }
            }
        });

        // Get recent projects
        const recentProjects = await prismaClient.project.findMany({
            where: whereClause,
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        _count: {
                            select: {
                                members: true
                            }
                        }
                    }
                },
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        tasks: {
                            where: { isActive: true }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5
        });

        // Get upcoming deadlines
        const upcomingDeadlines = await prismaClient.project.findMany({
            where: {
                ...whereClause,
                deadline: {
                    gte: new Date(),
                    lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
                },
                status: {
                    not: 'COMPLETED'
                }
            },
            select: {
                id: true,
                name: true,
                deadline: true
            },
            orderBy: {
                deadline: 'asc'
            },
            take: 10
        });

        // Get team workload
        const teamWorkload = await prismaClient.team.findMany({
            where: {
                companyId: req.companyId,
                isActive: true,
                projects: {
                    some: whereClause
                }
            },
            include: {
                _count: {
                    select: {
                        projects: {
                            where: {
                                ...whereClause,
                                status: 'IN_PROGRESS'
                            }
                        }
                    }
                },
                projects: {
                    where: whereClause,
                    include: {
                        _count: {
                            select: {
                                tasks: {
                                    where: { isActive: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        const dashboardData = {
            totalProjects,
            activeProjects,
            completedProjects,
            overdueProjects,
            projectsByStatus: projectsByStatus.map(item => ({
                status: item.status,
                count: item._count.id
            })),
            projectsByPriority: projectsByPriority.map(item => ({
                priority: item.priority,
                count: item._count.id
            })),
            recentProjects: recentProjects.map(project => ({
                ...project,
                teamSize: project.team._count.members,
                totalTasks: project._count.tasks
            })),
            upcomingDeadlines: upcomingDeadlines.map(project => ({
                projectId: project.id,
                projectName: project.name,
                deadline: project.deadline,
                daysRemaining: project.deadline ? Math.ceil((project.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0
            })),
            teamWorkload: teamWorkload.map(team => ({
                teamId: team.id,
                teamName: team.name,
                activeProjects: team._count.projects,
                totalTasks: team.projects.reduce((sum, project) => sum + project._count.tasks, 0),
                completedTasks: 0 // This would need a more complex query
            }))
        };

        res.json({
            success: true,
            message: 'Project dashboard data retrieved successfully',
            dashboard: dashboardData
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get project tasks
 * GET /api/projects/:projectId/tasks
 */
export const getProjectTasks = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { projectId } = req.params;
        const userId = req.user?.id;
        const { status, priority, assigneeId } = req.query;

        console.log('Getting tasks for project:', projectId);

        // First verify user has access to this project
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

        // Check if user has access to this project
        const hasAccess = 
            project.managerId === userId || // User is project manager
            project.team.members.some(member => member.id === userId) || // User is team member
            ['HR', 'ADMIN'].includes(req.user?.role || ''); // HR/Admin can view all

        if (!hasAccess) {
            throw new UnauthorizedException(
                'You do not have access to this project',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Build where clause for tasks
        let taskWhereClause: any = {
            projectId: projectId,
            isActive: true
        };

        if (status) {
            taskWhereClause.status = status;
        }
        if (priority) {
            taskWhereClause.priority = priority;
        }
        if (assigneeId) {
            taskWhereClause.assigneeId = assigneeId;
        }

        const tasks = await prismaClient.task.findMany({
            where: taskWhereClause,
            include: {
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
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            success: true,
            message: 'Project tasks retrieved successfully',
            project: {
                id: project.id,
                name: project.name
            },
            tasks: tasks.map(task => ({
                ...task,
                commentCount: task._count.comments
            }))
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get project metrics and analytics
 * GET /api/projects/:projectId/metrics
 */
export const getProjectMetrics = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { projectId } = req.params;
        const userId = req.user?.id;

        console.log('Getting metrics for project:', projectId);

        // First verify user has access to this project
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
                },
                tasks: {
                    where: { isActive: true },
                    include: {
                        assignee: {
                            select: {
                                id: true,
                                name: true
                            }
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

        // Check if user has access to this project
        const hasAccess = 
            project.managerId === userId || // User is project manager
            project.team.members.some(member => member.id === userId) || // User is team member
            ['HR', 'ADMIN'].includes(req.user?.role || ''); // HR/Admin can view all

        if (!hasAccess) {
            throw new UnauthorizedException(
                'You do not have access to this project',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Calculate task statistics
        const taskStats = project.tasks.reduce((acc, task) => {
            acc[task.status.toLowerCase()] = (acc[task.status.toLowerCase()] || 0) + 1;
            acc[`${task.priority.toLowerCase()}_priority`] = (acc[`${task.priority.toLowerCase()}_priority`] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Calculate team member workload
        const memberWorkload = project.team.members.map(member => {
            const memberTasks = project.tasks.filter(task => task.assigneeId === member.id);
            return {
                memberId: member.id,
                memberName: project.tasks.find(task => task.assigneeId === member.id)?.assignee?.name || 'Unknown',
                totalTasks: memberTasks.length,
                completedTasks: memberTasks.filter(task => task.status === 'COMPLETED').length,
                inProgressTasks: memberTasks.filter(task => task.status === 'IN_PROGRESS').length,
                todoTasks: memberTasks.filter(task => task.status === 'TODO').length
            };
        });

        // Calculate project timeline metrics
        const now = new Date();
        const startDate = project.startDate;
        const endDate = project.endDate || project.deadline;
        
        let timelineMetrics = {};
        if (startDate && endDate) {
            const totalDuration = endDate.getTime() - startDate.getTime();
            const elapsed = now.getTime() - startDate.getTime();
            const progressByTime = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
            
            timelineMetrics = {
                startDate: startDate,
                endDate: endDate,
                daysTotal: Math.ceil(totalDuration / (1000 * 60 * 60 * 24)),
                daysElapsed: Math.max(0, Math.ceil(elapsed / (1000 * 60 * 60 * 24))),
                daysRemaining: Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
                progressByTime: Math.round(progressByTime),
                isOverdue: now > endDate && project.status !== 'COMPLETED'
            };
        }

        const metrics = {
            projectInfo: {
                id: project.id,
                name: project.name,
                status: project.status,
                priority: project.priority,
                progress: project.progress
            },
            taskMetrics: {
                totalTasks: project.tasks.length,
                completedTasks: taskStats.completed || 0,
                inProgressTasks: taskStats.in_progress || 0,
                todoTasks: taskStats.todo || 0,
                inReviewTasks: taskStats.in_review || 0,
                cancelledTasks: taskStats.cancelled || 0,
                completionRate: project.tasks.length > 0 ? Math.round(((taskStats.completed || 0) / project.tasks.length) * 100) : 0
            },
            priorityDistribution: {
                low: taskStats.low_priority || 0,
                medium: taskStats.medium_priority || 0,
                high: taskStats.high_priority || 0,
                urgent: taskStats.urgent_priority || 0
            },
            teamMetrics: {
                totalMembers: project.team.members.length,
                memberWorkload: memberWorkload
            },
            timelineMetrics
        };

        res.json({
            success: true,
            message: 'Project metrics retrieved successfully',
            metrics
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Calculate project performance metrics using provided formulas
 * GET /api/projects/:projectId/performance
 */
export const getProjectPerformance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { projectId } = req.params;
        const userId = req.user?.id;

        console.log('Calculating project performance for:', projectId);

        // First verify user has access to this project
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
                },
                tasks: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        status: true,
                        dueDate: true,
                        completedAt: true,
                        estimatedHours: true,
                        actualHours: true
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

        // Check if user has access to this project
        const hasAccess = 
            project.managerId === userId || // User is project manager
            project.team.members.some(member => member.id === userId) || // User is team member
            ['HR', 'ADMIN'].includes(req.user?.role || ''); // HR/Admin can view all

        if (!hasAccess) {
            throw new UnauthorizedException(
                'You do not have access to this project',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Calculate Project Performance using provided formula:
        // Project Performance = (0.6 × Task Completion Rate) + (0.2 × Deadline Adherence) + (0.2 × Time Accuracy Score)

        const tasks = project.tasks;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;

        // 1. Task Completion Rate
        const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // 2. Deadline Adherence
        const tasksWithDeadlines = tasks.filter(t => t.dueDate && t.status === 'COMPLETED');
        const onTimeTasks = tasksWithDeadlines.filter(t => 
            t.completedAt && t.dueDate && new Date(t.completedAt) <= new Date(t.dueDate)
        ).length;
        const deadlineAdherence = tasksWithDeadlines.length > 0 ? (onTimeTasks / tasksWithDeadlines.length) * 100 : 0;

        // 3. Time Accuracy Score (actualHours / estimatedHours)
        const tasksWithTimeData = tasks.filter(t => t.estimatedHours && t.actualHours && t.status === 'COMPLETED');
        let timeAccuracyScore = 100; // Default to perfect if no time data
        
        if (tasksWithTimeData.length > 0) {
            const totalEstimated = tasksWithTimeData.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
            const totalActual = tasksWithTimeData.reduce((sum, t) => sum + (t.actualHours || 0), 0);
            
            if (totalEstimated > 0) {
                const accuracy = totalActual / totalEstimated;
                // Convert to score: 1.0 = 100%, >1.3 = poor (50%), <0.7 = over-buffered (75%)
                if (accuracy >= 0.7 && accuracy <= 1.3) {
                    timeAccuracyScore = 100 - (Math.abs(accuracy - 1.0) * 50);
                } else if (accuracy > 1.3) {
                    timeAccuracyScore = Math.max(30, 100 - ((accuracy - 1.0) * 100));
                } else {
                    timeAccuracyScore = Math.max(60, 100 - ((1.0 - accuracy) * 50));
                }
            }
        }

        // Final Project Performance Score
        const projectPerformance = (0.6 * taskCompletionRate) + (0.2 * deadlineAdherence) + (0.2 * timeAccuracyScore);

        // Calculate risk level based on performance and deadlines
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
        const now = new Date();
        const isOverdue = project.deadline && now > project.deadline && project.status !== 'COMPLETED';
        const daysToDeadline = project.deadline ? Math.ceil((project.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

        if (isOverdue) {
            riskLevel = 'CRITICAL';
        } else if (daysToDeadline !== null && daysToDeadline <= 7 && taskCompletionRate < 80) {
            riskLevel = 'HIGH';
        } else if (daysToDeadline !== null && daysToDeadline <= 14 && taskCompletionRate < 60) {
            riskLevel = 'MEDIUM';
        } else if (projectPerformance < 70) {
            riskLevel = 'MEDIUM';
        }

        // Calculate task status distribution
        const taskStatusDistribution = {
            TODO: tasks.filter(t => t.status === 'TODO').length,
            IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
            IN_REVIEW: tasks.filter(t => t.status === 'IN_REVIEW').length,
            COMPLETED: completedTasks,
            CANCELLED: tasks.filter(t => t.status === 'CANCELLED').length
        };

        // Calculate progress consistency (active tasks ratio)
        const activeTasks = taskStatusDistribution.IN_PROGRESS + taskStatusDistribution.IN_REVIEW;
        const activeTaskRatio = totalTasks > 0 ? (activeTasks / totalTasks) * 100 : 0;

        res.json({
            success: true,
            message: 'Project performance calculated successfully',
            data: {
                projectId: project.id,
                projectName: project.name,
                status: project.status,
                priority: project.priority,
                progress: project.progress,
                riskLevel: riskLevel,
                performance: {
                    projectPerformance: Math.round(projectPerformance * 100) / 100,
                    taskCompletionRate: Math.round(taskCompletionRate * 100) / 100,
                    deadlineAdherence: Math.round(deadlineAdherence * 100) / 100,
                    timeAccuracyScore: Math.round(timeAccuracyScore * 100) / 100,
                    activeTaskRatio: Math.round(activeTaskRatio * 100) / 100
                },
                taskMetrics: {
                    totalTasks: totalTasks,
                    completedTasks: completedTasks,
                    pendingTasks: totalTasks - completedTasks,
                    taskStatusDistribution: taskStatusDistribution
                },
                timeMetrics: {
                    tasksWithTimeData: tasksWithTimeData.length,
                    totalEstimatedHours: tasksWithTimeData.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
                    totalActualHours: tasksWithTimeData.reduce((sum, t) => sum + (t.actualHours || 0), 0)
                },
                deadlineMetrics: {
                    hasDeadline: !!project.deadline,
                    deadline: project.deadline,
                    daysToDeadline: daysToDeadline,
                    isOverdue: !!isOverdue,
                    tasksWithDeadlines: tasksWithDeadlines.length,
                    onTimeTasks: onTimeTasks
                }
            }
        });
    } catch (error) {
        next(error);
    }
};