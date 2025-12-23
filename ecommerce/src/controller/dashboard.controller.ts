import { NextFunction, Request, Response } from 'express';
import { prismaClient } from '../index.validator';
import { ErrorCodes } from '../exceptions/root';
import { BadRequestsException } from '../exceptions/bad_request';

/**
 * Dashboard Controller
 * 
 * This controller provides dashboard statistics and analytics
 */

/**
 * Get dashboard statistics
 * GET /api/dashboard/stats
 */
export const getDashboardStats = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log('Getting dashboard stats for company:', req.companyId);

        // Get total users count
        const totalUsers = await prismaClient.user.count({
            where: {
                companyId: req.companyId,
                isActive: true
            }
        });

        // Get users by role
        const usersByRole = await prismaClient.user.groupBy({
            by: ['role'],
            where: {
                companyId: req.companyId,
                isActive: true
            },
            _count: {
                role: true
            }
        });

        // Convert to object for easier access
        const roleStats = usersByRole.reduce((acc, item) => {
            acc[item.role] = item._count.role;
            return acc;
        }, {} as Record<string, number>);

        // Get recent users (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentUsers = await prismaClient.user.count({
            where: {
                companyId: req.companyId,
                isActive: true,
                createdAt: {
                    gte: sevenDaysAgo
                }
            }
        });

        // Get recent activity (last 10 users)
        const recentActivity = await prismaClient.user.findMany({
            where: {
                companyId: req.companyId,
                isActive: true
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });

        // Calculate growth percentage (compare with previous 7 days)
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const previousPeriodUsers = await prismaClient.user.count({
            where: {
                companyId: req.companyId,
                isActive: true,
                createdAt: {
                    gte: fourteenDaysAgo,
                    lt: sevenDaysAgo
                }
            }
        });

        const growthPercentage = previousPeriodUsers > 0 
            ? Math.round(((recentUsers - previousPeriodUsers) / previousPeriodUsers) * 100)
            : recentUsers > 0 ? 100 : 0;

        // Prepare statistics
        const stats = {
            totalUsers,
            adminCount: roleStats.ADMIN || 0,
            hrCount: roleStats.HR || 0,
            employeeCount: roleStats.EMPLOYEE || 0,
            recentUsers,
            growthPercentage,
            isGrowthPositive: growthPercentage >= 0
        };

        res.json({
            success: true,
            message: 'Dashboard statistics retrieved successfully',
            stats,
            recentActivity: recentActivity.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                joinedAt: user.createdAt,
                timeAgo: getTimeAgo(user.createdAt)
            }))
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get company overview
 * GET /api/dashboard/overview
 */
export const getCompanyOverview = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log('Getting company overview for:', req.companyId);

        // Get company details
        const company = await prismaClient.company.findUnique({
            where: { id: req.companyId },
            select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!company) {
            throw new BadRequestsException(
                'Company not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Get current user info
        const currentUser = req.user;

        res.json({
            success: true,
            message: 'Company overview retrieved successfully',
            company,
            currentUser: {
                id: currentUser?.id,
                name: currentUser?.name,
                email: currentUser?.email,
                role: currentUser?.role,
                isEmailVerified: currentUser?.isEmailVerified,
                joinedAt: currentUser?.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get manager dashboard statistics
 * GET /api/manager/dashboard
 */
export const getManagerDashboard = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log('Getting manager dashboard for user:', req.user?.id);

        const managerId = req.user?.id;

        // Get teams managed by this user
        const managedTeams = await prismaClient.team.findMany({
            where: {
                managerId: managerId,
                companyId: req.companyId,
                isActive: true
            },
            include: {
                members: true,
                projects: {
                    where: { isActive: true }
                }
            }
        });

        // Get projects managed by this user
        const managedProjects = await prismaClient.project.findMany({
            where: {
                managerId: managerId,
                companyId: req.companyId,
                isActive: true
            },
            include: {
                tasks: true
            }
        });

        // Calculate statistics
        const teamMembers = managedTeams.reduce((total, team) => total + team.members.length, 0);
        const activeProjects = managedProjects.length;
        const allTasks = managedProjects.flatMap(project => project.tasks);
        const completedTasks = allTasks.filter(task => task.status === 'COMPLETED').length;
        const pendingTasks = allTasks.filter(task => task.status !== 'COMPLETED' && task.status !== 'CANCELLED').length;

        const stats = {
            teamMembers,
            activeProjects,
            completedTasks,
            pendingTasks,
            totalTasks: allTasks.length
        };

        res.json({
            success: true,
            message: 'Manager dashboard statistics retrieved successfully',
            stats,
            teams: managedTeams.map(team => ({
                id: team.id,
                name: team.name,
                memberCount: team.members.length,
                projectCount: team.projects.length
            })),
            projects: managedProjects.map(project => ({
                id: project.id,
                name: project.name,
                status: project.status,
                progress: project.progress,
                taskCount: project.tasks.length
            }))
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get employee dashboard statistics
 * GET /api/employee/dashboard
 */
export const getEmployeeDashboard = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log('Getting employee dashboard for user:', req.user?.id);

        const employeeId = req.user?.id;

        // Get tasks assigned to this employee
        const assignedTasks = await prismaClient.task.findMany({
            where: {
                assigneeId: employeeId,
                isActive: true
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                }
            }
        });

        // Get projects the employee is involved in
        const projectIds = [...new Set(assignedTasks.map(task => task.projectId))];
        const projects = await prismaClient.project.findMany({
            where: {
                id: { in: projectIds },
                companyId: req.companyId,
                isActive: true
            }
        });

        // Calculate statistics
        const totalTasks = assignedTasks.length;
        const completedTasks = assignedTasks.filter(task => task.status === 'COMPLETED').length;
        const inProgressTasks = assignedTasks.filter(task => task.status === 'IN_PROGRESS').length;
        const pendingTasks = assignedTasks.filter(task => task.status === 'TODO').length;

        // Calculate total estimated hours
        const totalEstimatedHours = assignedTasks.reduce((total, task) => {
            return total + (task.estimatedHours || 0);
        }, 0);

        // Calculate actual hours worked
        const totalActualHours = assignedTasks.reduce((total, task) => {
            return total + (task.actualHours || 0);
        }, 0);

        const stats = {
            assignedTasks: totalTasks,
            completedTasks,
            inProgressTasks,
            pendingTasks,
            projectsInvolved: projects.length,
            estimatedHours: totalEstimatedHours,
            actualHours: totalActualHours
        };

        res.json({
            success: true,
            message: 'Employee dashboard statistics retrieved successfully',
            stats,
            recentTasks: assignedTasks
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 5)
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    status: task.status,
                    priority: task.priority,
                    dueDate: task.dueDate,
                    project: task.project
                })),
            projects: projects.map(project => ({
                id: project.id,
                name: project.name,
                status: project.status,
                progress: project.progress
            }))
        });
    } catch (error) {
        next(error);
    }
};
/**

 * Helper function to calculate time ago
 */
function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString();
    }
}