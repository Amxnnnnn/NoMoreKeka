import { Router } from 'express';
import { 
    logWork,
    getWorkLogs,
    updateWorkLog,
    deleteWorkLog,
    getTeamWorkLogs,
    approveWorkLog,
    getWorkLogSummary,
    getWorkLogReports
} from '../controller/worklog.controller';
import { authMiddleware } from '../middleware/auth.mid';
import { companyIsolationMiddleware } from '../middleware/admin.mid';
import { validate } from '../middleware/validate.mid';
import { errorHandler } from '../error-handler.validator';
import { 
    logWorkSchema, 
    updateWorkLogSchema, 
    workLogIdParamSchema 
} from '../validator/worklog.validator';

const workLogRoutes: Router = Router();

// Apply global middleware for all routes
workLogRoutes.use(authMiddleware);
workLogRoutes.use(companyIsolationMiddleware);

/**
 * @swagger
 * /api/work-logs:
 *   post:
 *     summary: Log work hours
 *     description: Create a new work log entry for tracking time spent on projects/tasks
 *     tags: [Work Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LogWorkRequest'
 *     responses:
 *       200:
 *         description: Work log created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Work log created successfully"
 *                 workLog:
 *                   $ref: '#/components/schemas/WorkLogWithDetails'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
workLogRoutes.post('/', validate(logWorkSchema), errorHandler(logWork));

/**
 * @swagger
 * /api/work-logs:
 *   get:
 *     summary: Get work logs for current user
 *     description: Retrieve work logs for the authenticated user with optional filtering
 *     tags: [Work Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter work logs from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter work logs until this date (YYYY-MM-DD)
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by specific project ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Work logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Work logs retrieved successfully"
 *                 workLogs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WorkLogWithDetails'
 *                 summary:
 *                   $ref: '#/components/schemas/WorkLogSummary'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationInfo'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
workLogRoutes.get('/', errorHandler(getWorkLogs));

/**
 * @swagger
 * /api/work-logs/summary:
 *   get:
 *     summary: Get work log summary/statistics
 *     description: Retrieve aggregated statistics and summary of user's work logs
 *     tags: [Work Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter summary from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter summary until this date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Work log summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Work log summary retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/WorkLogAnalytics'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
workLogRoutes.get('/summary', errorHandler(getWorkLogSummary));

/**
 * @swagger
 * /api/work-logs/team:
 *   get:
 *     summary: Get team work logs
 *     description: Retrieve work logs for team members (Manager/HR/Admin only)
 *     tags: [Work Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter work logs from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter work logs until this date (YYYY-MM-DD)
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by specific project ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by specific user ID (HR/Admin only)
 *     responses:
 *       200:
 *         description: Team work logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Team work logs retrieved successfully"
 *                 workLogs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WorkLogWithUser'
 *                 summary:
 *                   $ref: '#/components/schemas/TeamWorkLogSummary'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
workLogRoutes.get('/team', errorHandler(getTeamWorkLogs));

/**
 * @swagger
 * /api/work-logs/reports:
 *   get:
 *     summary: Get work log reports
 *     description: Generate comprehensive work log reports (HR/Admin only)
 *     tags: [Work Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Report start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Report end date (YYYY-MM-DD)
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Filter by specific department ID
 *     responses:
 *       200:
 *         description: Work log reports generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Work log reports generated successfully"
 *                 report:
 *                   $ref: '#/components/schemas/WorkLogReport'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
workLogRoutes.get('/reports', errorHandler(getWorkLogReports));

/**
 * @swagger
 * /api/work-logs/{workLogId}:
 *   put:
 *     summary: Update work log
 *     description: Update an existing work log entry (only if not approved)
 *     tags: [Work Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workLogId
 *         required: true
 *         schema:
 *           type: string
 *         description: Work log ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWorkLogRequest'
 *     responses:
 *       200:
 *         description: Work log updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Work log updated successfully"
 *                 workLog:
 *                   $ref: '#/components/schemas/WorkLogWithDetails'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
workLogRoutes.put('/:workLogId', validate(workLogIdParamSchema), validate(updateWorkLogSchema), errorHandler(updateWorkLog));

/**
 * @swagger
 * /api/work-logs/{workLogId}:
 *   delete:
 *     summary: Delete work log
 *     description: Delete a work log entry (only if not approved)
 *     tags: [Work Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workLogId
 *         required: true
 *         schema:
 *           type: string
 *         description: Work log ID
 *     responses:
 *       200:
 *         description: Work log deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Work log deleted successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
workLogRoutes.delete('/:workLogId', validate(workLogIdParamSchema), errorHandler(deleteWorkLog));

/**
 * @swagger
 * /api/work-logs/{workLogId}/approve:
 *   put:
 *     summary: Approve work log
 *     description: Approve a work log entry (Manager/HR/Admin only)
 *     tags: [Work Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workLogId
 *         required: true
 *         schema:
 *           type: string
 *         description: Work log ID
 *     responses:
 *       200:
 *         description: Work log approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Work log approved successfully"
 *                 workLog:
 *                   $ref: '#/components/schemas/WorkLogWithApproval'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
workLogRoutes.put('/:workLogId/approve', validate(workLogIdParamSchema), errorHandler(approveWorkLog));

export default workLogRoutes;