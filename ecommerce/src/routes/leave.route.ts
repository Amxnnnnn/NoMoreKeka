import { Router } from 'express';
import { 
    getLeaveBalance,
    applyLeave,
    getLeaveHistory,
    getTeamLeaveRequests,
    processLeaveRequest,
    getUpcomingLeaves,
    getLeaveStatus,
    approveLeave,
    rejectLeave
} from '../controller/leave.controller';
import { authMiddleware } from '../middleware/auth.mid';
import { companyIsolationMiddleware } from '../middleware/admin.mid';
import { validate } from '../middleware/validate.mid';
import { errorHandler } from '../error-handler.validator';
import { 
    applyLeaveSchema, 
    leaveApprovalSchema, 
    leaveIdParamSchema 
} from '../validator/leave.validator';

const leaveRoutes: Router = Router();

// Apply global middleware for all routes
leaveRoutes.use(authMiddleware);
leaveRoutes.use(companyIsolationMiddleware);

/**
 * @swagger
 * /api/leaves/balance:
 *   get:
 *     summary: Get leave balance for current user
 *     tags: [Leave Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year for leave balance (defaults to current year)
 *     responses:
 *       200:
 *         description: Leave balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 year:
 *                   type: integer
 *                 balances:
 *                   type: array
 *                   items:
 *                     type: object
 */
leaveRoutes.get('/balance', errorHandler(getLeaveBalance));

/**
 * @swagger
 * /api/leaves/apply:
 *   post:
 *     summary: Apply for leave
 *     tags: [Leave Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leaveTypeId
 *               - startDate
 *               - endDate
 *               - reason
 *             properties:
 *               leaveTypeId:
 *                 type: string
 *                 example: "leave-type-uuid"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-17"
 *               reason:
 *                 type: string
 *                 example: "Personal vacation"
 *     responses:
 *       200:
 *         description: Leave application submitted successfully
 */
leaveRoutes.post('/apply', validate(applyLeaveSchema), errorHandler(applyLeave));

/**
 * @swagger
 * /api/leaves/history:
 *   get:
 *     summary: Get leave history for current user
 *     tags: [Leave Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *         description: Filter by leave status
 *     responses:
 *       200:
 *         description: Leave history retrieved successfully
 */
leaveRoutes.get('/history', errorHandler(getLeaveHistory));

/**
 * @swagger
 * /api/leaves/status:
 *   get:
 *     summary: Get leave status summary
 *     tags: [Leave Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leave status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 summary:
 *                   type: object
 *                   properties:
 *                     pending:
 *                       type: integer
 *                     approved:
 *                       type: integer
 *                     rejected:
 *                       type: integer
 *                     cancelled:
 *                       type: integer
 */
leaveRoutes.get('/status', errorHandler(getLeaveStatus));

/**
 * @swagger
 * /api/leaves/team-requests:
 *   get:
 *     summary: Get team leave requests (Manager/HR/Admin only)
 *     tags: [Leave Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *         description: Filter by leave status (defaults to PENDING)
 *     responses:
 *       200:
 *         description: Team leave requests retrieved successfully
 */
leaveRoutes.get('/team', errorHandler(getTeamLeaveRequests));

/**
 * @swagger
 * /api/leaves/{leaveId}/approve:
 *   put:
 *     summary: Approve leave request (Manager/HR/Admin only)
 *     tags: [Leave Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leaveId
 *         required: true
 *         schema:
 *           type: string
 *         description: Leave request ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comments:
 *                 type: string
 *                 example: "Approved for vacation"
 *     responses:
 *       200:
 *         description: Leave approved successfully
 */
leaveRoutes.put('/:leaveId/approve', validate(leaveIdParamSchema), validate(leaveApprovalSchema), errorHandler(approveLeave));

/**
 * @swagger
 * /api/leaves/{leaveId}/reject:
 *   put:
 *     summary: Reject leave request (Manager/HR/Admin only)
 *     tags: [Leave Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leaveId
 *         required: true
 *         schema:
 *           type: string
 *         description: Leave request ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comments:
 *                 type: string
 *                 example: "Insufficient notice period"
 *     responses:
 *       200:
 *         description: Leave rejected successfully
 */
leaveRoutes.put('/:leaveId/reject', validate(leaveIdParamSchema), validate(leaveApprovalSchema), errorHandler(rejectLeave));

/**
 * @swagger
 * /api/leaves/upcoming:
 *   get:
 *     summary: Get upcoming leaves for team/calendar view
 *     tags: [Leave Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for upcoming leaves
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for upcoming leaves
 *       - in: query
 *         name: teamOnly
 *         schema:
 *           type: boolean
 *         description: Show only team leaves (for managers)
 *     responses:
 *       200:
 *         description: Upcoming leaves retrieved successfully
 */
leaveRoutes.get('/upcoming', errorHandler(getUpcomingLeaves));

/**
 * @swagger
 * /api/leaves/{leaveId}/process:
 *   put:
 *     summary: Process leave request with custom action (Manager/HR/Admin only)
 *     tags: [Leave Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leaveId
 *         required: true
 *         schema:
 *           type: string
 *         description: Leave request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [APPROVE, REJECT, CANCEL]
 *                 example: "APPROVE"
 *               comments:
 *                 type: string
 *                 example: "Approved with conditions"
 *     responses:
 *       200:
 *         description: Leave processed successfully
 */
leaveRoutes.put('/:leaveId/process', validate(leaveIdParamSchema), errorHandler(processLeaveRequest));

export default leaveRoutes;