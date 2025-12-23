import { Router } from 'express';
import {
    getDashboardStats,
    getCompanyOverview
} from '../controller/dashboard.controller';
import { errorHandler } from '../error-handler.validator';
import { authMiddleware } from '../middleware/auth.mid';
import { companyIsolationMiddleware, hrMiddleware, adminMiddleware } from '../middleware/admin.mid';

const dashboardRoutes: Router = Router();

/**
 * SECURE DASHBOARD ROUTES
 * 
 * All dashboard routes require authentication and company isolation.
 * Dashboard stats are restricted to HR+ level access for security.
 */
dashboardRoutes.use(authMiddleware);
dashboardRoutes.use(companyIsolationMiddleware);

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics (HR+ Access Only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: number
 *                     adminCount:
 *                       type: number
 *                     hrCount:
 *                       type: number
 *                     employeeCount:
 *                       type: number
 *                     recentUsers:
 *                       type: number
 *                     growthPercentage:
 *                       type: number
 *                     isGrowthPositive:
 *                       type: boolean
 *                 recentActivity:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       joinedAt:
 *                         type: string
 *                       timeAgo:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (HR+ required)
 */
// SECURITY: Only HR+ can access company-wide statistics
dashboardRoutes.get('/stats', hrMiddleware, errorHandler(getDashboardStats));

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: Get company overview (Admin Only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 company:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                 currentUser:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     isEmailVerified:
 *                       type: boolean
 *                     joinedAt:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (Admin required)
 */
// SECURITY: Only Admins can access company overview
dashboardRoutes.get('/overview', adminMiddleware, errorHandler(getCompanyOverview));

export default dashboardRoutes;