import { Router } from 'express';
import {
    getDashboardStats,
    getCompanyOverview,
    getManagerDashboard,
    getEmployeeDashboard
} from '../controller/dashboard.controller';
import { errorHandler } from '../error-handler.validator';
import { authMiddleware } from '../middleware/auth.mid';
import { companyIsolationMiddleware, hrMiddleware, adminMiddleware, managerMiddleware, employeeMiddleware } from '../middleware/admin.mid';

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

/**
 * 
@swagger
 * /api/dashboard/manager:
 *   get:
 *     summary: Get manager dashboard statistics (Manager+ Access)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Manager dashboard statistics retrieved successfully
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
 *                     teamMembers:
 *                       type: number
 *                     activeProjects:
 *                       type: number
 *                     completedTasks:
 *                       type: number
 *                     pendingTasks:
 *                       type: number
 *                     totalTasks:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (Manager+ required)
 */
// SECURITY: Only Manager+ can access manager dashboard
dashboardRoutes.get('/manager', managerMiddleware, errorHandler(getManagerDashboard));

/**
 * @swagger
 * /api/dashboard/employee:
 *   get:
 *     summary: Get employee dashboard statistics (All authenticated users)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee dashboard statistics retrieved successfully
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
 *                     assignedTasks:
 *                       type: number
 *                     completedTasks:
 *                       type: number
 *                     inProgressTasks:
 *                       type: number
 *                     pendingTasks:
 *                       type: number
 *                     projectsInvolved:
 *                       type: number
 *                     estimatedHours:
 *                       type: number
 *                     actualHours:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */
// SECURITY: All authenticated users can access their own employee dashboard
dashboardRoutes.get('/employee', employeeMiddleware, errorHandler(getEmployeeDashboard));

export default dashboardRoutes;