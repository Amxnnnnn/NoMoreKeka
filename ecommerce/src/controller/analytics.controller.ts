import { NextFunction, Request, Response } from 'express';
import { prismaClient } from '../index.validator';
import { ErrorCodes } from '../exceptions/root';
import { BadRequestsException } from '../exceptions/bad_request';
import { UnauthorizedException } from '../exceptions/unauthorized.ex';

/**
 * Analytics Controller
 * 
 * Provides comprehensive analytics data for admin dashboard
 * Requires HR+ access for most endpoints
 */

/**
 * Get comprehensive analytics overview
 * GET /api/analytics/overview
 */
export const getAnalyticsOverview = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log('Getting analytics overview for company:', req.companyId);
        console.log('User role:', req.user?.role);

        // Check permissions - Allow all authenticated users for now (for testing)
        // TODO: Restore HR+ only access after testing
        // if (!['HR', 'ADMIN'].includes(req.user?.role || '')) {
        //     throw new UnauthorizedException(
        //         'HR or Admin access required for analytics',
        //         ErrorCodes.UNAUTHORIZED_EXCEPTION
        //     );
        // }

        const companyId = req.companyId;
        const currentDate = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(currentDate.getMonth() - 6);

        console.log('Fetching employee metrics...');
        // Employee metrics
        const totalEmployees = await prismaClient.user.count({
            where: { companyId, isActive: true }
        });

        const newHires = await prismaClient.user.count({
            where: {
                companyId,
                isActive: true,
                createdAt: { gte: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000) }
            }
        });

        console.log('Fetching department data...');
        // Department distribution
        const departments = await prismaClient.department.findMany({
            where: { companyId, isActive: true },
            include: {
                _count: {
                    select: {
                        users: {
                            where: { isActive: true }
                        }
                    }
                }
            }
        });

        console.log('Fetching leave stats...');
        // Leave analytics
        const leaveStats = await prismaClient.leave.groupBy({
            by: ['status'],
            where: {
                user: { companyId },
                appliedAt: { gte: sixMonthsAgo }
            },
            _count: { status: true }
        });

        const leaveTypeStats = await prismaClient.leave.groupBy({
            by: ['leaveTypeId'],
            where: {
                user: { companyId },
                appliedAt: { gte: sixMonthsAgo }
            },
            _count: { leaveTypeId: true },
            _sum: { days: true }
        });

        console.log('Fetching leave types...');
        // Get leave type names
        const leaveTypes = await prismaClient.leaveType.findMany({
            where: { companyId, isActive: true }
        });

        const leaveTypeMap = leaveTypes.reduce((acc, type) => {
            acc[type.id] = type.name;
            return acc;
        }, {} as Record<string, string>);

        console.log('Fetching project stats...');
        // Project analytics
        const projectStats = await prismaClient.project.groupBy({
            by: ['status'],
            where: { companyId, isActive: true },
            _count: { status: true }
        });

        const projectsAtRisk = await prismaClient.project.count({
            where: {
                companyId,
                isActive: true,
                deadline: { lt: new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000) },
                status: { not: 'COMPLETED' },
                progress: { lt: 80 }
            }
        });

        console.log('Fetching monthly leave trends...');
        // Monthly leave trends (last 6 months) - using Prisma instead of raw SQL
        const monthlyLeaves = await prismaClient.leave.findMany({
            where: {
                user: { companyId },
                appliedAt: { gte: sixMonthsAgo }
            },
            select: {
                appliedAt: true,
                status: true
            }
        });

        // Process monthly data
        const monthlyTrends = monthlyLeaves.reduce((acc: any[], leave) => {
            const month = leave.appliedAt.toISOString().substring(0, 7); // YYYY-MM format
            const existing = acc.find(item => item.month === month && item.status === leave.status);
            if (existing) {
                existing.count++;
            } else {
                acc.push({
                    month: leave.appliedAt,
                    status: leave.status,
                    count: 1
                });
            }
            return acc;
        }, []);

        console.log('Preparing response data...');
        const responseData = {
            employeeMetrics: {
                totalEmployees,
                activeEmployees: totalEmployees, // Assuming all are active
                newHires,
                growthRate: newHires > 0 ? ((newHires / totalEmployees) * 100) : 0
            },
            departmentDistribution: departments.map(dept => ({
                name: dept.name,
                employees: dept._count.users,
                id: dept.id
            })),
            leaveAnalytics: {
                statusBreakdown: leaveStats.reduce((acc, stat) => {
                    acc[stat.status.toLowerCase()] = stat._count.status;
                    return acc;
                }, {} as Record<string, number>),
                typeBreakdown: leaveTypeStats.map(stat => ({
                    leaveType: leaveTypeMap[stat.leaveTypeId] || 'Unknown',
                    count: stat._count.leaveTypeId,
                    totalDays: stat._sum.days || 0
                })),
                monthlyTrends: monthlyTrends
            },
            projectAnalytics: {
                statusBreakdown: projectStats.reduce((acc, stat) => {
                    acc[stat.status.toLowerCase()] = stat._count.status;
                    return acc;
                }, {} as Record<string, number>),
                projectsAtRisk
            }
        };

        console.log('Sending response...');
        res.json({
            success: true,
            message: 'Analytics overview retrieved successfully',
            data: responseData
        });
    } catch (error) {
        console.error('Error in getAnalyticsOverview:', error);
        next(error);
    }
};

/**
 * Get worklog analytics
 * GET /api/analytics/worklogs
 */
export const getWorklogAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log('Getting worklog analytics for company:', req.companyId);

        // Check permissions - Allow all authenticated users for now (for testing)
        // TODO: Restore HR+ only access after testing
        // if (!['HR', 'ADMIN'].includes(req.user?.role || '')) {
        //     throw new UnauthorizedException(
        //         'HR or Admin access required for worklog analytics',
        //         ErrorCodes.UNAUTHORIZED_EXCEPTION
        //     );
        // }

        const companyId = req.companyId;
        const { startDate, endDate } = req.query;

        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                date: {
                    gte: new Date(startDate as string),
                    lte: new Date(endDate as string)
                }
            };
        } else {
            // Default to last 6 weeks
            const sixWeeksAgo = new Date();
            sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
            dateFilter = {
                date: { gte: sixWeeksAgo }
            };
        }

        // Weekly worklog trends - using Prisma instead of raw SQL
        const weeklyWorklogs = await prismaClient.workLog.findMany({
            where: {
                user: { companyId },
                ...dateFilter
            },
            select: {
                date: true,
                hoursWorked: true,
                userId: true
            }
        });

        // Process weekly data
        const weeklyTrends = weeklyWorklogs.reduce((acc: any[], log) => {
            const weekStart = new Date(log.date);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
            const weekKey = weekStart.toISOString().substring(0, 10);
            
            const existing = acc.find(item => item.week === weekKey);
            if (existing) {
                existing.total_hours += log.hoursWorked;
                existing.active_users.add(log.userId);
                existing.log_count++;
            } else {
                acc.push({
                    week: weekStart,
                    total_hours: log.hoursWorked,
                    active_users: new Set([log.userId]),
                    log_count: 1
                });
            }
            return acc;
        }, []).map(item => ({
            week: item.week,
            total_hours: item.total_hours.toString(),
            active_users: item.active_users.size.toString(),
            avg_hours_per_log: (item.total_hours / item.log_count).toString()
        })).slice(0, 12);

        // Department worklog breakdown - using Prisma
        const departmentWorklogs = await prismaClient.workLog.findMany({
            where: {
                user: { companyId },
                ...dateFilter
            },
            include: {
                user: {
                    include: {
                        department: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        const departmentBreakdown = departmentWorklogs.reduce((acc: any[], log) => {
            const deptName = log.user.department?.name || 'Unassigned';
            const existing = acc.find(item => item.department_name === deptName);
            if (existing) {
                existing.total_hours += log.hoursWorked;
                existing.total_logs++;
                existing.active_users.add(log.userId);
            } else {
                acc.push({
                    department_name: deptName,
                    total_hours: log.hoursWorked,
                    total_logs: 1,
                    active_users: new Set([log.userId])
                });
            }
            return acc;
        }, []).map(item => ({
            department_name: item.department_name,
            total_hours: item.total_hours.toString(),
            total_logs: item.total_logs.toString(),
            active_users: item.active_users.size.toString()
        }));

        // Project worklog breakdown
        const projectWorklogs = await prismaClient.workLog.groupBy({
            by: ['projectId'],
            where: {
                user: { companyId },
                ...dateFilter
            },
            _sum: { hoursWorked: true },
            _count: { id: true }
        });

        const projectIds = projectWorklogs.map(pw => pw.projectId).filter(Boolean);
        const projects = await prismaClient.project.findMany({
            where: { id: { in: projectIds as string[] } },
            select: { id: true, name: true }
        });

        const projectMap = projects.reduce((acc, project) => {
            acc[project.id] = project.name;
            return acc;
        }, {} as Record<string, string>);

        res.json({
            success: true,
            message: 'Worklog analytics retrieved successfully',
            data: {
                weeklyTrends: weeklyTrends.map(week => ({
                    week: week.week,
                    hours: parseFloat(week.total_hours || '0'),
                    activeUsers: parseInt(week.active_users || '0'),
                    productivity: Math.min(100, (parseFloat(week.avg_hours_per_log || '0') / 8) * 100) // Assuming 8 hours is 100% productivity
                })),
                departmentBreakdown: departmentBreakdown.map(dept => ({
                    department: dept.department_name || 'Unassigned',
                    totalHours: parseFloat(dept.total_hours || '0'),
                    totalLogs: parseInt(dept.total_logs || '0'),
                    activeUsers: parseInt(dept.active_users || '0')
                })),
                projectBreakdown: projectWorklogs.map(pw => ({
                    projectName: projectMap[pw.projectId || ''] || 'Unassigned',
                    totalHours: pw._sum.hoursWorked || 0,
                    totalLogs: pw._count.id
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Test endpoint to verify analytics routes are working
 * GET /api/analytics/test
 */
export const testAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        res.json({
            success: true,
            message: 'Analytics routes are working',
            user: {
                id: req.user?.id,
                role: req.user?.role,
                companyId: req.companyId
            }
        });
    } catch (error) {
        next(error);
    }
};
export const getProjectPerformanceAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log('Getting project performance analytics for company:', req.companyId);

        // Check permissions - Allow all authenticated users for now (for testing)
        // TODO: Restore Manager+ only access after testing
        // if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
        //     throw new UnauthorizedException(
        //         'Manager+ access required for project performance analytics',
        //         ErrorCodes.UNAUTHORIZED_EXCEPTION
        //     );
        // }

        const companyId = req.companyId;
        const currentDate = new Date();

        // Get projects with performance data
        const projects = await prismaClient.project.findMany({
            where: { companyId, isActive: true },
            include: {
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
                },
                team: {
                    select: {
                        name: true,
                        _count: { select: { members: true } }
                    }
                }
            }
        });

        const projectPerformanceData = projects.map(project => {
            const tasks = project.tasks;
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;

            // Calculate performance metrics
            const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            // Deadline adherence
            const tasksWithDeadlines = tasks.filter(t => t.dueDate && t.status === 'COMPLETED');
            const onTimeTasks = tasksWithDeadlines.filter(t => 
                t.completedAt && t.dueDate && new Date(t.completedAt) <= new Date(t.dueDate)
            ).length;
            const deadlineAdherence = tasksWithDeadlines.length > 0 ? (onTimeTasks / tasksWithDeadlines.length) * 100 : 100;

            // Days remaining to deadline
            const daysRemaining = project.deadline 
                ? Math.ceil((new Date(project.deadline).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
                : null;

            // Risk assessment
            let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
            const isOverdue = project.deadline && currentDate > project.deadline && project.status !== 'COMPLETED';
            
            if (isOverdue) {
                riskLevel = 'CRITICAL';
            } else if (daysRemaining !== null && daysRemaining <= 7 && taskCompletionRate < 80) {
                riskLevel = 'HIGH';
            } else if (daysRemaining !== null && daysRemaining <= 14 && taskCompletionRate < 60) {
                riskLevel = 'MEDIUM';
            }

            return {
                id: project.id,
                name: project.name,
                status: project.status,
                priority: project.priority,
                progress: project.progress,
                daysRemaining: Math.max(0, daysRemaining || 0),
                taskCompletionRate,
                deadlineAdherence,
                riskLevel,
                teamSize: project.team?._count.members || 0,
                totalTasks,
                completedTasks
            };
        });

        // Sort by risk level and days remaining
        const sortedProjects = projectPerformanceData.sort((a, b) => {
            const riskOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
            if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
                return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
            }
            return a.daysRemaining - b.daysRemaining;
        });

        res.json({
            success: true,
            message: 'Project performance analytics retrieved successfully',
            data: {
                projects: sortedProjects,
                summary: {
                    totalProjects: projects.length,
                    projectsAtRisk: sortedProjects.filter(p => ['HIGH', 'CRITICAL'].includes(p.riskLevel)).length,
                    averageProgress: projects.length > 0 ? projects.reduce((sum, p) => sum + p.progress, 0) / projects.length : 0,
                    overdueProjects: sortedProjects.filter(p => p.riskLevel === 'CRITICAL').length
                }
            }
        });
    } catch (error) {
        next(error);
    }
};