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