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
import { validate } from '../middleware/validate.mid';
import { errorHandler } from '../error-handler.validator';
import { 
    createNotificationSchema, 
    notificationIdParamSchema 
} from '../validator/notification.validator';

const notificationRoutes: Router = Router();

// Get notifications for current user
notificationRoutes.get('/', authMiddleware, errorHandler(getNotifications));

// Get notification summary
notificationRoutes.get('/summary', authMiddleware, errorHandler(getNotificationSummary));

// Mark all notifications as read
notificationRoutes.put('/read-all', authMiddleware, errorHandler(markAllAsRead));

// Clear old notifications
notificationRoutes.delete('/clear-old', authMiddleware, errorHandler(clearOldNotifications));

// Create notification (Internal use - for system/admin)
notificationRoutes.post('/', authMiddleware, validate(createNotificationSchema), errorHandler(createNotification));

// Mark notification as read
notificationRoutes.put('/:notificationId/read', authMiddleware, validate(notificationIdParamSchema), errorHandler(markAsRead));

// Delete notification
notificationRoutes.delete('/:notificationId', authMiddleware, validate(notificationIdParamSchema), errorHandler(deleteNotification));

export default notificationRoutes;