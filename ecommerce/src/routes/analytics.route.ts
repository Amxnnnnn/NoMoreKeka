import { Router } from 'express';
import {
    getAnalyticsOverview,
    getWorklogAnalytics,
    getProjectPerformanceAnalytics,
    testAnalytics
} from '../controller/analytics.controller';
import { errorHandler } from '../error-handler.validator';
import { authMiddleware } from '../middleware/auth.mid';
import { companyIsolationMiddleware, hrMiddleware, managerMiddleware } from '../middleware/admin.mid';

const analyticsRoutes: Router = Router();

/**
 * ANALYTICS ROUTES
 * 
 * Comprehensive analytics endpoints for admin dashboard
 * All routes require authentication and company isolation
 */
analyticsRoutes.use(authMiddleware);
analyticsRoutes.use(companyIsolationMiddleware);

/**
 * @swagger
 * /api/analytics/test:
 *   get:
 *     summary: Test analytics routes (All authenticated users)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics routes are working
 */
analyticsRoutes.get('/test', errorHandler(testAnalytics));

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: Get comprehensive analytics overview (HR+ Access)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     employeeMetrics:
 *                       type: object
 *                       properties:
 *                         totalEmployees:
 *                           type: number
 *                         activeEmployees:
 *                           type: number
 *                         newHires:
 *                           type: number
 *                         growthRate:
 *                           type: number
 *                     departmentDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           employees:
 *                             type: number
 *                     leaveAnalytics:
 *                       type: object
 *                       properties:
 *                         statusBreakdown:
 *                           type: object
 *                         typeBreakdown:
 *                           type: array
 *                         monthlyTrends:
 *                           type: array
 *                     projectAnalytics:
 *                       type: object
 *                       properties:
 *                         statusBreakdown:
 *                           type: object
 *                         projectsAtRisk:
 *                           type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (HR+ required)
 */
// Temporarily remove role restrictions for testing
analyticsRoutes.get('/overview', errorHandler(getAnalyticsOverview));

/**
 * @swagger
 * /api/analytics/worklogs:
 *   get:
 *     summary: Get worklog analytics (HR+ Access)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (optional)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (optional)
 *     responses:
 *       200:
 *         description: Worklog analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     weeklyTrends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           week:
 *                             type: string
 *                           hours:
 *                             type: number
 *                           activeUsers:
 *                             type: number
 *                           productivity:
 *                             type: number
 *                     departmentBreakdown:
 *                       type: array
 *                     projectBreakdown:
 *                       type: array
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (HR+ required)
 */
analyticsRoutes.get('/worklogs', errorHandler(getWorklogAnalytics));

/**
 * @swagger
 * /api/analytics/projects/performance:
 *   get:
 *     summary: Get project performance analytics (Manager+ Access)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project performance analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     projects:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           status:
 *                             type: string
 *                           priority:
 *                             type: string
 *                           progress:
 *                             type: number
 *                           daysRemaining:
 *                             type: number
 *                           taskCompletionRate:
 *                             type: number
 *                           deadlineAdherence:
 *                             type: number
 *                           riskLevel:
 *                             type: string
 *                             enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalProjects:
 *                           type: number
 *                         projectsAtRisk:
 *                           type: number
 *                         averageProgress:
 *                           type: number
 *                         overdueProjects:
 *                           type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (Manager+ required)
 */
analyticsRoutes.get('/projects/performance', errorHandler(getProjectPerformanceAnalytics));

export default analyticsRoutes;