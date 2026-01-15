import { Router } from 'express';
import { 
    getNotifications,
    markAsRead,
    markAllAsRead,
    getNotificationSummary,
    createNotification,
    deleteNotification,
    clearOldNotifications
} from '../controller/notification.controller';
import { authMiddleware } from '../middleware/auth.mid';
import { companyIsolationMiddleware } from '../middleware/admin.mid';
import { validate } from '../middleware/validate.mid';
import { errorHandler } from '../error-handler.validator';
import { 
    createNotificationSchema, 
    notificationIdParamSchema 
} from '../validator/notification.validator';

const notificationRoutes: Router = Router();

// Apply global middleware for all routes
notificationRoutes.use(authMiddleware);
notificationRoutes.use(companyIsolationMiddleware);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notifications for current user
 *     description: Retrieve paginated list of notifications for the authenticated user with filtering options
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of notifications per page
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by read status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [LEAVE_REQUEST, LEAVE_APPROVED, LEAVE_REJECTED, TASK_ASSIGNED, TASK_OVERDUE, PROJECT_DEADLINE, TEAM_UPDATE, SYSTEM_ALERT]
 *         description: Filter by notification type
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
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
 *                   example: "Notifications retrieved successfully"
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     unread:
 *                       type: integer
 *                       example: 5
 *                     read:
 *                       type: integer
 *                       example: 20
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationInfo'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
notificationRoutes.get('/', errorHandler(getNotifications));

/**
 * @swagger
 * /api/notifications/summary:
 *   get:
 *     summary: Get notification summary
 *     description: Get comprehensive summary of notifications including counts by type and status
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification summary retrieved successfully
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
 *                   example: "Notification summary retrieved successfully"
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     unread:
 *                       type: integer
 *                       example: 5
 *                     read:
 *                       type: integer
 *                       example: 20
 *                     byType:
 *                       type: object
 *                       properties:
 *                         leaveRequest:
 *                           type: integer
 *                           example: 2
 *                         leaveApproved:
 *                           type: integer
 *                           example: 1
 *                         leaveRejected:
 *                           type: integer
 *                           example: 0
 *                         taskAssigned:
 *                           type: integer
 *                           example: 3
 *                         taskOverdue:
 *                           type: integer
 *                           example: 1
 *                         projectDeadline:
 *                           type: integer
 *                           example: 2
 *                         teamUpdate:
 *                           type: integer
 *                           example: 1
 *                         systemAlert:
 *                           type: integer
 *                           example: 0
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
notificationRoutes.get('/summary', errorHandler(getNotificationSummary));

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     description: Mark all unread notifications for the current user as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
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
 *                   example: "5 notifications marked as read"
 *                 updatedCount:
 *                   type: integer
 *                   example: 5
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
notificationRoutes.put('/read-all', errorHandler(markAllAsRead));

/**
 * @swagger
 * /api/notifications/clear-old:
 *   delete:
 *     summary: Clear old notifications
 *     description: Delete old read notifications (default 30 days old)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: Number of days old to consider for deletion
 *     responses:
 *       200:
 *         description: Old notifications cleared successfully
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
 *                   example: "10 old notifications cleared"
 *                 deletedCount:
 *                   type: integer
 *                   example: 10
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
notificationRoutes.delete('/clear-old', errorHandler(clearOldNotifications));

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create notification (System/Admin use)
 *     description: Create a new notification for a specific user (internal system use)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - title
 *               - message
 *               - type
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "user-uuid-123"
 *                 description: ID of the user to receive the notification
 *               title:
 *                 type: string
 *                 example: "Leave Request Approved"
 *                 description: Notification title
 *               message:
 *                 type: string
 *                 example: "Your leave request for Dec 25-26 has been approved"
 *                 description: Notification message content
 *               type:
 *                 type: string
 *                 enum: [LEAVE_REQUEST, LEAVE_APPROVED, LEAVE_REJECTED, TASK_ASSIGNED, TASK_OVERDUE, PROJECT_DEADLINE, TEAM_UPDATE, SYSTEM_ALERT]
 *                 example: "LEAVE_APPROVED"
 *                 description: Type of notification
 *               relatedId:
 *                 type: string
 *                 example: "leave-request-uuid"
 *                 description: ID of related entity (optional)
 *               relatedType:
 *                 type: string
 *                 example: "LEAVE_REQUEST"
 *                 description: Type of related entity (optional)
 *               actionUrl:
 *                 type: string
 *                 example: "/leave/history"
 *                 description: URL for notification action (optional)
 *     responses:
 *       200:
 *         description: Notification created successfully
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
 *                   example: "Notification created successfully"
 *                 notification:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: User not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
notificationRoutes.post('/', validate(createNotificationSchema), errorHandler(createNotification));

/**
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   put:
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read for the current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the notification to mark as read
 *         example: "notification-uuid-123"
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
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
 *                   example: "Notification marked as read"
 *                 notification:
 *                   $ref: '#/components/schemas/Notification'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Notification not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
notificationRoutes.put('/:notificationId/read', validate(notificationIdParamSchema), errorHandler(markAsRead));

/**
 * @swagger
 * /api/notifications/{notificationId}:
 *   delete:
 *     summary: Delete notification
 *     description: Delete a specific notification for the current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the notification to delete
 *         example: "notification-uuid-123"
 *     responses:
 *       200:
 *         description: Notification deleted successfully
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
 *                   example: "Notification deleted successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Notification not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
notificationRoutes.delete('/:notificationId', validate(notificationIdParamSchema), errorHandler(deleteNotification));

export default notificationRoutes;