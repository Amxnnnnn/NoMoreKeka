import { NextFunction, Request, Response } from 'express';
import { prismaClient } from '../index.validator';
import { ErrorCodes } from '../exceptions/root';
import { BadRequestsException } from '../exceptions/bad_request';
import { NotFoundException } from '../exceptions/not_found';
import { UnauthorizedException } from '../exceptions/unauthorized.ex';

/**
 * Team Management Controller
 * 
 * Handles team operations with role-based access:
 * - Managers: Create teams, manage team members, view team structure
 * - HR/Admin: View all teams, reassign managers, manage team structure
 * - All users: View teams they belong to
 */

/**
 * Create new team (Manager/HR/Admin only)
 * POST /api/teams
 */
export const createTeam = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, description } = req.body;
        const managerId = req.user?.id;

        console.log('Creating team:', name, 'by manager:', managerId);

        // Check permissions
        if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only managers, HR, and admins can create teams',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Check if team name already exists in the company
        const existingTeam = await prismaClient.team.findFirst({
            where: {
                name: name,
                companyId: req.companyId,
                isActive: true
            }
        });

        if (existingTeam) {
            throw new BadRequestsException(
                'Team name already exists in the company',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Create team
        const team = await prismaClient.team.create({
            data: {
                name: name,
                description: description,
                managerId: managerId!,
                companyId: req.companyId!
            },
            include: {
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                },
                _count: {
                    select: {
                        members: true,
                        projects: true
                    }
                }
            }
        });

        res.json({
            success: true,
            message: 'Team created successfully',
            team: {
                ...team,
                memberCount: team._count.members,
                projectCount: team._count.projects
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get managed teams (Manager/HR/Admin only)
 * GET /api/teams/managed
 */
export const getManagedTeams = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const managerId = req.user?.id;

        console.log('Getting managed teams for:', managerId);

        // Check permissions
        if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only managers, HR, and admins can view managed teams',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        const whereClause: any = {
            companyId: req.companyId,
            isActive: true
        };

        // Managers see only their teams, HR/Admin see all
        if (req.user?.role === 'MANAGER') {
            whereClause.managerId = managerId;
        }

        const teams = await prismaClient.team.findMany({
            where: whereClause,
            include: {
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                },
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
                projects: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        progress: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            success: true,
            message: 'Managed teams retrieved successfully',
            teams: teams.map(team => ({
                ...team,
                memberCount: team.members.length,
                projectCount: team.projects.length
            }))
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add members to team (Manager/HR/Admin only)
 * PUT /api/teams/:teamId/members
 */
export const addTeamMembers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { teamId } = req.params;
        const { memberIds } = req.body; // Array of user IDs

        console.log('Adding members to team:', teamId);

        // Check permissions
        if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only managers, HR, and admins can manage team members',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Get team
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

        // For managers, ensure they manage this team
        if (req.user?.role === 'MANAGER' && team.managerId !== req.user?.id) {
            throw new UnauthorizedException(
                'You can only manage members of teams you manage',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Validate all member IDs exist and belong to the company
        const users = await prismaClient.user.findMany({
            where: {
                id: { in: memberIds },
                companyId: req.companyId,
                isActive: true
            }
        });

        if (users.length !== memberIds.length) {
            throw new BadRequestsException(
                'One or more user IDs are invalid or inactive',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Update users to assign them to the team
        await prismaClient.user.updateMany({
            where: {
                id: { in: memberIds },
                companyId: req.companyId
            },
            data: {
                teamId: teamId
            }
        });

        // Get updated team with members
        const updatedTeam = await prismaClient.team.findUnique({
            where: { id: teamId },
            include: {
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
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
                }
            }
        });

        res.json({
            success: true,
            message: 'Team members added successfully',
            team: updatedTeam
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove member from team (Manager/HR/Admin only)
 * DELETE /api/teams/:teamId/members/:memberId
 */
export const removeTeamMember = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { teamId, memberId } = req.params;

        console.log('Removing member from team:', memberId, 'from', teamId);

        // Check permissions
        if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only managers, HR, and admins can manage team members',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Get team
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

        // For managers, ensure they manage this team
        if (req.user?.role === 'MANAGER' && team.managerId !== req.user?.id) {
            throw new UnauthorizedException(
                'You can only manage members of teams you manage',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Validate member exists and is part of the team
        const member = await prismaClient.user.findFirst({
            where: {
                id: memberId,
                teamId: teamId,
                companyId: req.companyId,
                isActive: true
            }
        });

        if (!member) {
            throw new NotFoundException(
                'Member not found in this team',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Remove member from team
        await prismaClient.user.update({
            where: { id: memberId },
            data: { teamId: null }
        });

        res.json({
            success: true,
            message: 'Team member removed successfully',
            removedMember: {
                id: member.id,
                name: member.name,
                email: member.email
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reassign team member to another team (Manager/HR/Admin only)
 * PUT /api/teams/:teamId/members/:memberId/reassign
 */
export const reassignTeamMember = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { teamId, memberId } = req.params;
        const { newTeamId } = req.body;

        console.log('Reassigning member:', memberId, 'from', teamId, 'to', newTeamId);

        // Check permissions
        if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only managers, HR, and admins can reassign team members',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Validate both teams exist
        const [currentTeam, newTeam] = await Promise.all([
            prismaClient.team.findFirst({
                where: {
                    id: teamId,
                    companyId: req.companyId,
                    isActive: true
                }
            }),
            prismaClient.team.findFirst({
                where: {
                    id: newTeamId,
                    companyId: req.companyId,
                    isActive: true
                }
            })
        ]);

        if (!currentTeam || !newTeam) {
            throw new NotFoundException(
                'One or both teams not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Validate member exists and is part of the current team
        const member = await prismaClient.user.findFirst({
            where: {
                id: memberId,
                teamId: teamId,
                companyId: req.companyId,
                isActive: true
            }
        });

        if (!member) {
            throw new NotFoundException(
                'Member not found in the current team',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Reassign member to new team
        const updatedMember = await prismaClient.user.update({
            where: { id: memberId },
            data: { teamId: newTeamId },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        res.json({
            success: true,
            message: 'Team member reassigned successfully',
            member: {
                id: updatedMember.id,
                name: updatedMember.name,
                email: updatedMember.email,
                previousTeam: currentTeam.name,
                newTeam: updatedMember.team?.name
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get team structure
 * GET /api/teams/:teamId/structure
 */
export const getTeamStructure = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { teamId } = req.params;

        console.log('Getting team structure for:', teamId);

        const team = await prismaClient.team.findFirst({
            where: {
                id: teamId,
                companyId: req.companyId,
                isActive: true
            },
            include: {
                manager: {
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
                        },
                        assignedTasks: {
                            where: {
                                isActive: true,
                                status: { not: 'COMPLETED' }
                            },
                            select: {
                                id: true,
                                title: true,
                                status: true,
                                priority: true,
                                dueDate: true
                            }
                        }
                    }
                },
                projects: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        progress: true,
                        deadline: true,
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

        if (!team) {
            throw new NotFoundException(
                'Team not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Calculate team statistics
        const totalTasks = team.members.reduce((sum, member) => sum + member.assignedTasks.length, 0);
        const overdueTasks = team.members.reduce((sum, member) => {
            return sum + member.assignedTasks.filter(task => 
                task.dueDate && new Date() > task.dueDate
            ).length;
        }, 0);

        res.json({
            success: true,
            message: 'Team structure retrieved successfully',
            team: {
                ...team,
                statistics: {
                    memberCount: team.members.length,
                    projectCount: team.projects.length,
                    totalActiveTasks: totalTasks,
                    overdueTasks: overdueTasks
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update team details (Manager/HR/Admin only)
 * PUT /api/teams/:teamId
 */
export const updateTeam = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { teamId } = req.params;
        const { name, description } = req.body;

        console.log('Updating team:', teamId);

        // Check permissions
        if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only managers, HR, and admins can update teams',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Get existing team
        const existingTeam = await prismaClient.team.findFirst({
            where: {
                id: teamId,
                companyId: req.companyId,
                isActive: true
            }
        });

        if (!existingTeam) {
            throw new NotFoundException(
                'Team not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // For managers, ensure they manage this team
        if (req.user?.role === 'MANAGER' && existingTeam.managerId !== req.user?.id) {
            throw new UnauthorizedException(
                'You can only update teams you manage',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Check if new name conflicts with existing teams
        if (name && name !== existingTeam.name) {
            const nameConflict = await prismaClient.team.findFirst({
                where: {
                    name: name,
                    companyId: req.companyId,
                    isActive: true,
                    id: { not: teamId }
                }
            });

            if (nameConflict) {
                throw new BadRequestsException(
                    'Team name already exists in the company',
                    ErrorCodes.INTERNAL_EXCEPTION
                );
            }
        }

        // Update team
        const updateData: any = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;

        const updatedTeam = await prismaClient.team.update({
            where: { id: teamId },
            data: updateData,
            include: {
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        members: true,
                        projects: true
                    }
                }
            }
        });

        res.json({
            success: true,
            message: 'Team updated successfully',
            team: {
                ...updatedTeam,
                memberCount: updatedTeam._count.members,
                projectCount: updatedTeam._count.projects
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get team workload analysis (Manager/HR/Admin only)
 * GET /api/teams/:teamId/workload
 */
export const getTeamWorkload = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { teamId } = req.params;

        console.log('Getting team workload for:', teamId);

        // Check permissions
        if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only managers, HR, and admins can view team workload',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        const team = await prismaClient.team.findFirst({
            where: {
                id: teamId,
                companyId: req.companyId,
                isActive: true
            },
            include: {
                members: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        assignedTasks: {
                            where: {
                                isActive: true,
                                status: { not: 'COMPLETED' }
                            },
                            select: {
                                id: true,
                                title: true,
                                status: true,
                                priority: true,
                                dueDate: true,
                                estimatedHours: true
                            }
                        }
                    }
                }
            }
        });

        if (!team) {
            throw new NotFoundException(
                'Team not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Calculate workload for each member
        const memberWorkloads = team.members.map(member => {
            const tasks = member.assignedTasks;
            const totalTasks = tasks.length;
            const urgentTasks = tasks.filter(task => task.priority === 'URGENT').length;
            const overdueTasks = tasks.filter(task => 
                task.dueDate && new Date() > task.dueDate
            ).length;
            const estimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);

            return {
                member: {
                    id: member.id,
                    name: member.name,
                    email: member.email
                },
                workload: {
                    totalTasks,
                    urgentTasks,
                    overdueTasks,
                    estimatedHours,
                    workloadLevel: totalTasks > 10 ? 'HIGH' : totalTasks > 5 ? 'MEDIUM' : 'LOW'
                },
                tasks: tasks
            };
        });

        // Calculate team summary
        const teamSummary = memberWorkloads.reduce((acc, member) => {
            acc.totalTasks += member.workload.totalTasks;
            acc.totalUrgentTasks += member.workload.urgentTasks;
            acc.totalOverdueTasks += member.workload.overdueTasks;
            acc.totalEstimatedHours += member.workload.estimatedHours;
            return acc;
        }, {
            totalTasks: 0,
            totalUrgentTasks: 0,
            totalOverdueTasks: 0,
            totalEstimatedHours: 0
        });

        res.json({
            success: true,
            message: 'Team workload retrieved successfully',
            team: {
                id: team.id,
                name: team.name,
                memberCount: team.members.length
            },
            summary: teamSummary,
            memberWorkloads: memberWorkloads
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Calculate team performance metrics using provided formulas
 * GET /api/teams/:teamId/performance
 */
export const getTeamPerformance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { teamId } = req.params;

        console.log('Calculating team performance for:', teamId);

        // Check permissions
        if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only managers, HR, and admins can view team performance',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        const team = await prismaClient.team.findFirst({
            where: {
                id: teamId,
                companyId: req.companyId,
                isActive: true
            },
            include: {
                projects: {
                    where: { isActive: true },
                    include: {
                        tasks: {
                            where: { isActive: true },
                            select: {
                                id: true,
                                status: true,
                                dueDate: true,
                                completedAt: true,
                                assigneeId: true
                            }
                        }
                    }
                },
                members: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        assignedTasks: {
                            where: { isActive: true },
                            select: {
                                id: true,
                                status: true,
                                dueDate: true,
                                completedAt: true
                            }
                        },
                        workLogs: {
                            where: { 
                                date: {
                                    gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
                                }
                            },
                            select: {
                                isApproved: true
                            }
                        }
                    }
                }
            }
        });

        if (!team) {
            throw new NotFoundException(
                'Team not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Calculate Team Performance using provided formula:
        // Team Performance = (0.4 × Project Completion Rate) + (0.4 × Task Completion Rate) + (0.2 × Deadline Adherence)

        // 1. Project Completion Rate
        const totalProjects = team.projects.length;
        const completedProjects = team.projects.filter(p => p.status === 'COMPLETED').length;
        const projectCompletionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

        // 2. Task Completion Rate (across all team projects)
        const allTasks = team.projects.flatMap(p => p.tasks);
        const completedTasks = allTasks.filter(t => t.status === 'COMPLETED').length;
        const taskCompletionRate = allTasks.length > 0 ? (completedTasks / allTasks.length) * 100 : 0;

        // 3. Deadline Adherence
        const tasksWithDeadlines = allTasks.filter(t => t.dueDate && t.status === 'COMPLETED');
        const onTimeTasks = tasksWithDeadlines.filter(t => 
            t.completedAt && t.dueDate && new Date(t.completedAt) <= new Date(t.dueDate)
        ).length;
        const deadlineAdherence = tasksWithDeadlines.length > 0 ? (onTimeTasks / tasksWithDeadlines.length) * 100 : 0;

        // Final Team Performance Score
        const teamPerformance = (0.4 * projectCompletionRate) + (0.4 * taskCompletionRate) + (0.2 * deadlineAdherence);

        // Calculate individual member performance
        const memberPerformances = team.members.map(member => {
            const memberTasks = member.assignedTasks;
            const memberCompletedTasks = memberTasks.filter(t => t.status === 'COMPLETED').length;
            const memberTaskCompletionRate = memberTasks.length > 0 ? (memberCompletedTasks / memberTasks.length) * 100 : 0;

            // On-time delivery for member
            const memberTasksWithDeadlines = memberTasks.filter(t => t.dueDate && t.status === 'COMPLETED');
            const memberOnTimeTasks = memberTasksWithDeadlines.filter(t => 
                t.completedAt && t.dueDate && new Date(t.completedAt) <= new Date(t.dueDate)
            ).length;
            const memberOnTimeDelivery = memberTasksWithDeadlines.length > 0 ? (memberOnTimeTasks / memberTasksWithDeadlines.length) * 100 : 0;

            // WorkLog approval rate
            const totalWorkLogs = member.workLogs.length;
            const approvedWorkLogs = member.workLogs.filter(w => w.isApproved).length;
            const workLogApprovalRate = totalWorkLogs > 0 ? (approvedWorkLogs / totalWorkLogs) * 100 : 0;

            // Load factor normalization (tasks compared to team average)
            const avgTasksPerMember = allTasks.length / Math.max(team.members.length, 1);
            const loadFactor = avgTasksPerMember > 0 ? (memberTasks.length / avgTasksPerMember) : 1;
            const loadFactorNormalization = Math.min(100, Math.max(50, 100 - (Math.abs(loadFactor - 1) * 50)));

            // Individual Performance Score
            const individualPerformance = (0.5 * memberTaskCompletionRate) + (0.2 * memberOnTimeDelivery) + (0.2 * workLogApprovalRate) + (0.1 * loadFactorNormalization);

            return {
                memberId: member.id,
                memberName: member.name,
                memberEmail: member.email,
                metrics: {
                    taskCompletionRate: Math.round(memberTaskCompletionRate * 100) / 100,
                    onTimeDelivery: Math.round(memberOnTimeDelivery * 100) / 100,
                    workLogApprovalRate: Math.round(workLogApprovalRate * 100) / 100,
                    loadFactorNormalization: Math.round(loadFactorNormalization * 100) / 100,
                    individualPerformance: Math.round(individualPerformance * 100) / 100
                },
                taskStats: {
                    totalTasks: memberTasks.length,
                    completedTasks: memberCompletedTasks,
                    pendingTasks: memberTasks.length - memberCompletedTasks
                }
            };
        });

        // Calculate average project completion days
        const completedProjectsWithDates = team.projects.filter(p => 
            p.status === 'COMPLETED' && p.startDate && p.updatedAt
        );
        const avgProjectCompletionDays = completedProjectsWithDates.length > 0 
            ? Math.round(completedProjectsWithDates.reduce((sum, p) => {
                const startDate = new Date(p.startDate!);
                const endDate = new Date(p.updatedAt);
                const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                return sum + days;
            }, 0) / completedProjectsWithDates.length)
            : 0;

        res.json({
            success: true,
            message: 'Team performance calculated successfully',
            data: {
                teamId: team.id,
                teamName: team.name,
                memberCount: team.members.length,
                activeProjects: team.projects.filter(p => p.status === 'IN_PROGRESS').length,
                totalProjects: totalProjects,
                completedProjects: completedProjects,
                avgProjectCompletionDays: avgProjectCompletionDays,
                performance: {
                    teamPerformance: Math.round(teamPerformance * 100) / 100,
                    projectCompletionRate: Math.round(projectCompletionRate * 100) / 100,
                    taskCompletionRate: Math.round(taskCompletionRate * 100) / 100,
                    deadlineAdherence: Math.round(deadlineAdherence * 100) / 100
                },
                taskStats: {
                    totalTasks: allTasks.length,
                    completedTasks: completedTasks,
                    pendingTasks: allTasks.length - completedTasks
                },
                memberPerformances: memberPerformances
            }
        });
    } catch (error) {
        next(error);
    }
};