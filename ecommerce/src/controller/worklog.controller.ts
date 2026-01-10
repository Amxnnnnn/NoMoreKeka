import { NextFunction, Request, Response } from 'express';
import { prismaClient } from '../index.validator';
import { ErrorCodes } from '../exceptions/root';
import { BadRequestsException } from '../exceptions/bad_request';
import { NotFoundException } from '../exceptions/not_found';
import { UnauthorizedException } from '../exceptions/unauthorized.ex';

/**
 * Work Log Controller
 * 
 * Handles work log and time tracking operations:
 * - All users: Log work hours, view own work logs
 * - Managers: View team work logs, approve work logs
 * - HR/Admin: View all work logs, generate reports
 */

/**
 * Log work hours
 * POST /api/work-logs
 */
export const logWork = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        const { projectId, taskId, date, hoursWorked, description, logType } = req.body;

        console.log('Logging work for user:', userId);

        // Validate required fields
        if (!date || !hoursWorked || !description) {
            throw new BadRequestsException(
                'Date, hours worked, and description are required',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Validate hours (should be positive and reasonable)
        if (hoursWorked <= 0 || hoursWorked > 24) {
            throw new BadRequestsException(
                'Hours worked must be between 0 and 24',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Validate project exists and user has access (if provided)
        if (projectId) {
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
                project.managerId === userId ||
                project.team.members.some(member => member.id === userId);

            if (!hasAccess) {
                throw new UnauthorizedException(
                    'You do not have access to log work for this project',
                    ErrorCodes.UNAUTHORIZED_EXCEPTION
                );
            }
        }

        // Validate task exists and belongs to project (if provided)
        if (taskId) {
            const task = await prismaClient.task.findFirst({
                where: {
                    id: taskId,
                    isActive: true,
                    ...(projectId && { projectId: projectId })
                }
            });

            if (!task) {
                throw new NotFoundException(
                    'Task not found or does not belong to the specified project',
                    ErrorCodes.INTERNAL_EXCEPTION
                );
            }

            // If task is provided but no project, we could use task's project
            // but for now we'll let the user specify both explicitly
        }

        // Check for duplicate work log on the same date
        const existingLog = await prismaClient.workLog.findFirst({
            where: {
                userId: userId,
                date: new Date(date),
                projectId: projectId,
                taskId: taskId
            }
        });

        if (existingLog) {
            throw new BadRequestsException(
                'Work log already exists for this date, project, and task combination',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Create work log
        const workLog = await prismaClient.workLog.create({
            data: {
                userId: userId!,
                projectId: projectId,
                taskId: taskId,
                date: new Date(date),
                hoursWorked: parseFloat(hoursWorked),
                description: description,
                logType: logType || 'DAILY'
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                user: {
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
            message: 'Work log created successfully',
            workLog: workLog
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get work logs for current user
 * GET /api/work-logs
 */
export const getWorkLogs = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;
        const projectId = req.query.projectId as string;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        console.log('Getting work logs for user:', userId);

        const whereClause: any = {
            userId: userId
        };

        // Date range filter
        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) {
                whereClause.date.gte = new Date(startDate);
            }
            if (endDate) {
                whereClause.date.lte = new Date(endDate);
            }
        }

        // Project filter
        if (projectId) {
            whereClause.projectId = projectId;
        }

        const [workLogs, total] = await Promise.all([
            prismaClient.workLog.findMany({
                where: whereClause,
                include: {
                    project: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    task: {
                        select: {
                            id: true,
                            title: true
                        }
                    }
                },
                orderBy: {
                    date: 'desc'
                },
                skip: (page - 1) * limit,
                take: limit
            }),
            prismaClient.workLog.count({
                where: whereClause
            })
        ]);

        // Calculate total hours
        const totalHours = await prismaClient.workLog.aggregate({
            where: whereClause,
            _sum: {
                hoursWorked: true
            }
        });

        res.json({
            success: true,
            message: 'Work logs retrieved successfully',
            workLogs: workLogs,
            summary: {
                totalHours: totalHours._sum.hoursWorked || 0,
                totalEntries: total
            },
            pagination: {
                page: page,
                limit: limit,
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update work log
 * PUT /api/work-logs/:workLogId
 */
export const updateWorkLog = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { workLogId } = req.params;
        const { hoursWorked, description } = req.body;
        const userId = req.user?.id;

        console.log('Updating work log:', workLogId);

        // Get existing work log
        const existingWorkLog = await prismaClient.workLog.findFirst({
            where: {
                id: workLogId,
                userId: userId // Users can only update their own work logs
            }
        });

        if (!existingWorkLog) {
            throw new NotFoundException(
                'Work log not found or you do not have permission to update it',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Check if work log is already approved
        if (existingWorkLog.isApproved) {
            throw new BadRequestsException(
                'Cannot update approved work log',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Validate hours if provided
        if (hoursWorked && (hoursWorked <= 0 || hoursWorked > 24)) {
            throw new BadRequestsException(
                'Hours worked must be between 0 and 24',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Update work log
        const updateData: any = {};
        if (hoursWorked) updateData.hoursWorked = parseFloat(hoursWorked);
        if (description) updateData.description = description;

        const updatedWorkLog = await prismaClient.workLog.update({
            where: { id: workLogId },
            data: updateData,
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        res.json({
            success: true,
            message: 'Work log updated successfully',
            workLog: updatedWorkLog
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete work log
 * DELETE /api/work-logs/:workLogId
 */
export const deleteWorkLog = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { workLogId } = req.params;
        const userId = req.user?.id;

        console.log('Deleting work log:', workLogId);

        // Get existing work log
        const existingWorkLog = await prismaClient.workLog.findFirst({
            where: {
                id: workLogId,
                userId: userId // Users can only delete their own work logs
            }
        });

        if (!existingWorkLog) {
            throw new NotFoundException(
                'Work log not found or you do not have permission to delete it',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Check if work log is already approved
        if (existingWorkLog.isApproved) {
            throw new BadRequestsException(
                'Cannot delete approved work log',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Delete work log
        await prismaClient.workLog.delete({
            where: { id: workLogId }
        });

        res.json({
            success: true,
            message: 'Work log deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get team work logs (Manager/HR/Admin only)
 * GET /api/work-logs/team
 */
export const getTeamWorkLogs = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const managerId = req.user?.id;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;
        const projectId = req.query.projectId as string;
        const userId = req.query.userId as string;

        console.log('Getting team work logs for manager:', managerId);

        // Check permissions
        if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only managers, HR, and admins can view team work logs',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Build where clause
        const whereClause: any = {};

        // For managers, only show work logs from their team members
        if (req.user?.role === 'MANAGER') {
            // Get team member IDs
            const teams = await prismaClient.team.findMany({
                where: {
                    managerId: managerId,
                    companyId: req.companyId,
                    isActive: true
                },
                include: {
                    members: {
                        select: { id: true }
                    }
                }
            });

            const teamMemberIds = teams.flatMap(team => team.members.map(member => member.id));
            whereClause.userId = { in: teamMemberIds };
        } else {
            // HR/Admin can see all work logs in the company
            whereClause.user = {
                companyId: req.companyId
            };
        }

        // Date range filter
        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) {
                whereClause.date.gte = new Date(startDate);
            }
            if (endDate) {
                whereClause.date.lte = new Date(endDate);
            }
        }

        // Project filter
        if (projectId) {
            whereClause.projectId = projectId;
        }

        // User filter (for HR/Admin)
        if (userId && ['HR', 'ADMIN'].includes(req.user?.role || '')) {
            whereClause.userId = userId;
        }

        const workLogs = await prismaClient.workLog.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        department: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            },
            orderBy: [
                { date: 'desc' },
                { user: { name: 'asc' } }
            ]
        });

        // Calculate summary statistics
        const summary = workLogs.reduce((acc, log) => {
            acc.totalHours += log.hoursWorked;
            acc.totalEntries += 1;
            
            if (!acc.userHours[log.userId]) {
                acc.userHours[log.userId] = {
                    userName: log.user.name,
                    hours: 0,
                    entries: 0
                };
            }
            acc.userHours[log.userId].hours += log.hoursWorked;
            acc.userHours[log.userId].entries += 1;

            return acc;
        }, {
            totalHours: 0,
            totalEntries: 0,
            userHours: {} as Record<string, { userName: string; hours: number; entries: number }>
        });

        res.json({
            success: true,
            message: 'Team work logs retrieved successfully',
            workLogs: workLogs,
            summary: {
                totalHours: summary.totalHours,
                totalEntries: summary.totalEntries,
                userBreakdown: Object.values(summary.userHours)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Approve work logs (Manager/HR/Admin only)
 * PUT /api/work-logs/:workLogId/approve
 */
export const approveWorkLog = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { workLogId } = req.params;
        const approverId = req.user?.id;

        console.log('Approving work log:', workLogId);

        // Check permissions
        if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only managers, HR, and admins can approve work logs',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Get work log
        const workLog = await prismaClient.workLog.findFirst({
            where: {
                id: workLogId
            },
            include: {
                user: true
            }
        });

        if (!workLog) {
            throw new NotFoundException(
                'Work log not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        if (workLog.isApproved) {
            throw new BadRequestsException(
                'Work log is already approved',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Update work log
        const updatedWorkLog = await prismaClient.workLog.update({
            where: { id: workLogId },
            data: {
                isApproved: true,
                approvedBy: approverId,
                approvedAt: new Date()
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                approver: {
                    select: {
                        id: true,
                        name: true,
                        role: true
                    }
                }
            }
        });

        res.json({
            success: true,
            message: 'Work log approved successfully',
            workLog: updatedWorkLog
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get work log summary/statistics
 * GET /api/work-logs/summary
 */
export const getWorkLogSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        console.log('Getting work log summary for user:', userId);

        const whereClause: any = {
            userId: userId
        };

        // Date range filter
        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) {
                whereClause.date.gte = new Date(startDate);
            }
            if (endDate) {
                whereClause.date.lte = new Date(endDate);
            }
        }

        // Get aggregated data
        const [
            totalStats,
            approvalStats,
            projectBreakdown,
            dailyHours,
            logTypeBreakdown
        ] = await Promise.all([
            // Total hours and entries
            prismaClient.workLog.aggregate({
                where: whereClause,
                _sum: { hoursWorked: true },
                _count: true,
                _avg: { hoursWorked: true }
            }),

            // Approval statistics
            prismaClient.workLog.groupBy({
                by: ['isApproved'],
                where: whereClause,
                _count: true
            }),

            // Project breakdown
            prismaClient.workLog.groupBy({
                by: ['projectId'],
                where: { ...whereClause, projectId: { not: null } },
                _sum: { hoursWorked: true },
                _count: true
            }),

            // Daily hours for the period
            prismaClient.workLog.groupBy({
                by: ['date'],
                where: whereClause,
                _sum: { hoursWorked: true },
                _count: true,
                orderBy: { date: 'asc' }
            }),

            // Log type breakdown
            prismaClient.workLog.groupBy({
                by: ['logType'],
                where: whereClause,
                _sum: { hoursWorked: true },
                _count: true
            })
        ]);

        // Get project names for breakdown
        const projectIds = projectBreakdown.map(p => p.projectId).filter((id): id is string => id !== null);
        const projects = await prismaClient.project.findMany({
            where: { id: { in: projectIds } },
            select: { id: true, name: true }
        });

        // Calculate summary
        const totalHours = totalStats._sum.hoursWorked || 0;
        const totalEntries = totalStats._count;
        const approvedEntries = approvalStats.find(s => s.isApproved)?._count || 0;
        const pendingEntries = approvalStats.find(s => !s.isApproved)?._count || 0;

        // Format project breakdown
        const formattedProjectBreakdown = projectBreakdown.map(item => {
            const project = projects.find(p => p.id === item.projectId);
            return {
                projectId: item.projectId,
                projectName: project?.name || 'Unknown Project',
                hours: item._sum.hoursWorked || 0,
                percentage: totalHours > 0 ? ((item._sum.hoursWorked || 0) / totalHours) * 100 : 0
            };
        });

        // Format daily hours
        const formattedDailyHours = dailyHours.map(item => ({
            date: item.date.toISOString().split('T')[0],
            hours: item._sum.hoursWorked || 0,
            entries: item._count
        }));

        // Format log type breakdown
        const formattedLogTypeBreakdown = logTypeBreakdown.map(item => ({
            type: item.logType,
            hours: item._sum.hoursWorked || 0,
            count: item._count
        }));

        // Calculate average hours per day
        const dayCount = dailyHours.length || 1;
        const averageHoursPerDay = totalHours / dayCount;

        res.json({
            success: true,
            message: 'Work log summary retrieved successfully',
            data: {
                totalHours,
                totalEntries,
                approvedEntries,
                pendingEntries,
                averageHoursPerDay,
                projectBreakdown: formattedProjectBreakdown,
                dailyHours: formattedDailyHours,
                logTypeBreakdown: formattedLogTypeBreakdown,
                weeklyTrends: [], // Could be implemented for weekly analysis
            }
        });
    } catch (error) {
        next(error);
    }
};
export const getWorkLogReports = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;
        const departmentId = req.query.departmentId as string;

        console.log('Generating work log reports');

        // Check permissions
        if (!['HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only HR and admins can generate work log reports',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Build where clause
        const whereClause: any = {
            user: {
                companyId: req.companyId
            }
        };

        // Date range filter
        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) {
                whereClause.date.gte = new Date(startDate);
            }
            if (endDate) {
                whereClause.date.lte = new Date(endDate);
            }
        }

        // Department filter
        if (departmentId) {
            whereClause.user.departmentId = departmentId;
        }

        // Get aggregated data
        const [
            totalHours,
            userStats,
            projectStats,
            departmentStats
        ] = await Promise.all([
            // Total hours
            prismaClient.workLog.aggregate({
                where: whereClause,
                _sum: { hoursWorked: true },
                _count: true
            }),

            // Hours by user
            prismaClient.workLog.groupBy({
                by: ['userId'],
                where: whereClause,
                _sum: { hoursWorked: true },
                _count: true
            }),

            // Hours by project
            prismaClient.workLog.groupBy({
                by: ['projectId'],
                where: { ...whereClause, projectId: { not: null } },
                _sum: { hoursWorked: true },
                _count: true
            }),

            // Hours by user
            prismaClient.workLog.groupBy({
                by: ['userId'],
                where: whereClause,
                _sum: { hoursWorked: true }
            })
        ]);

        res.json({
            success: true,
            message: 'Work log reports generated successfully',
            report: {
                summary: {
                    totalHours: totalHours._sum.hoursWorked || 0,
                    totalEntries: totalHours._count,
                    averageHoursPerEntry: totalHours._count > 0 
                        ? (totalHours._sum.hoursWorked || 0) / totalHours._count 
                        : 0
                },
                userStats: userStats,
                projectStats: projectStats,
                departmentStats: departmentStats
            }
        });
    } catch (error) {
        next(error);
    }
};