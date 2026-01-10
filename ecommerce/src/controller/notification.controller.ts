import { NextFunction, Request, Response } from 'express';
import { prismaClient } from '../index.validator';
import { ErrorCodes } from '../exceptions/root';
import { BadRequestsException } from '../exceptions/bad_request';
import { NotFoundException } from '../exceptions/not_found';

/**
 * Notification Controller
 * 
 * Handles notification operations for all users:
 * - Get notifications for current user
 * - Mark notifications as read
 * - Create notifications (system/admin use)
 */

/**
 * Get notifications for current user
 * GET /api/notifications
 */
export const getNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const isRead = req.query.isRead as string;
        const type = req.query.type as string;

        console.log('Getting notifications for user:', userId);

        const whereClause: any = {
            userId: userId
        };

        if (isRead !== undefined) {
            whereClause.isRead = isRead === 'true';
        }

        if (type) {
            whereClause.type = type.toUpperCase();
        }

        const [notifications, total, unreadCount] = await Promise.all([
            prismaClient.notification.findMany({
                where: whereClause,
                orderBy: {
                    createdAt: 'desc'
                },
                skip: (page - 1) * limit,
                take: limit
            }),
            prismaClient.notification.count({
                where: whereClause
            }),
            prismaClient.notification.count({
                where: {
                    userId: userId,
                    isRead: false
                }
            })
        ]);

        res.json({
            success: true,
            message: 'Notifications retrieved successfully',
            notifications: notifications,
            summary: {
                total: total,
                unread: unreadCount,
                read: total - unreadCount
            },
            pagination: {
                page: page,
                limit: limit,
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:notificationId/read
 */
export const markAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user?.id;

        console.log('Marking notification as read:', notificationId);

        // Verify notification belongs to user
        const notification = await prismaClient.notification.findFirst({
            where: {
                id: notificationId,
                userId: userId
            }
        });

        if (!notification) {
            throw new NotFoundException(
                'Notification not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        if (notification.isRead) {
            return res.json({
                success: true,
                message: 'Notification already marked as read',
                notification: notification
            });
        }

        // Mark as read
        const updatedNotification = await prismaClient.notification.update({
            where: { id: notificationId },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });

        res.json({
            success: true,
            message: 'Notification marked as read',
            notification: updatedNotification
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
export const markAllAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        console.log('Marking all notifications as read for user:', userId);

        const result = await prismaClient.notification.updateMany({
            where: {
                userId: userId,
                isRead: false
            },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });

        res.json({
            success: true,
            message: `${result.count} notifications marked as read`,
            updatedCount: result.count
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get notification summary
 * GET /api/notifications/summary
 */
export const getNotificationSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        console.log('Getting notification summary for user:', userId);

        const [totalCount, unreadCount, typeBreakdown] = await Promise.all([
            prismaClient.notification.count({
                where: { userId: userId }
            }),
            prismaClient.notification.count({
                where: { userId: userId, isRead: false }
            }),
            prismaClient.notification.groupBy({
                by: ['type'],
                where: { userId: userId, isRead: false },
                _count: { type: true }
            })
        ]);

        const typeStats = typeBreakdown.reduce((acc, item) => {
            acc[item.type.toLowerCase()] = item._count.type;
            return acc;
        }, {} as Record<string, number>);

        res.json({
            success: true,
            message: 'Notification summary retrieved successfully',
            summary: {
                total: totalCount,
                unread: unreadCount,
                read: totalCount - unreadCount,
                byType: {
                    leaveRequest: typeStats.leave_request || 0,
                    leaveApproved: typeStats.leave_approved || 0,
                    leaveRejected: typeStats.leave_rejected || 0,
                    taskAssigned: typeStats.task_assigned || 0,
                    taskOverdue: typeStats.task_overdue || 0,
                    projectDeadline: typeStats.project_deadline || 0,
                    teamUpdate: typeStats.team_update || 0,
                    systemAlert: typeStats.system_alert || 0
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create notification (Internal use - for system/admin)
 * POST /api/notifications
 */
export const createNotification = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { userId, title, message, type, relatedId, relatedType, actionUrl } = req.body;

        console.log('Creating notification for user:', userId);

        // Validate user exists
        const user = await prismaClient.user.findFirst({
            where: {
                id: userId,
                companyId: req.companyId,
                isActive: true
            }
        });

        if (!user) {
            throw new NotFoundException(
                'User not found',
                ErrorCodes.USER_NOT_FOUND
            );
        }

        // Create notification
        const notification = await prismaClient.notification.create({
            data: {
                userId: userId,
                title: title,
                message: message,
                type: type.toUpperCase(),
                relatedId: relatedId,
                relatedType: relatedType,
                actionUrl: actionUrl
            }
        });

        res.json({
            success: true,
            message: 'Notification created successfully',
            notification: notification
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete notification
 * DELETE /api/notifications/:notificationId
 */
export const deleteNotification = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user?.id;

        console.log('Deleting notification:', notificationId);

        // Verify notification belongs to user
        const notification = await prismaClient.notification.findFirst({
            where: {
                id: notificationId,
                userId: userId
            }
        });

        if (!notification) {
            throw new NotFoundException(
                'Notification not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Delete notification
        await prismaClient.notification.delete({
            where: { id: notificationId }
        });

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Clear old notifications (older than 30 days)
 * DELETE /api/notifications/clear-old
 */
export const clearOldNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        const daysOld = parseInt(req.query.days as string) || 30;

        console.log('Clearing old notifications for user:', userId, 'older than', daysOld, 'days');

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await prismaClient.notification.deleteMany({
            where: {
                userId: userId,
                createdAt: {
                    lt: cutoffDate
                },
                isRead: true // Only delete read notifications
            }
        });

        res.json({
            success: true,
            message: `${result.count} old notifications cleared`,
            deletedCount: result.count
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Utility function to create notifications (for internal use by other controllers)
 */
export const createNotificationForUser = async (
    userId: string,
    title: string,
    message: string,
    type: string,
    relatedId?: string,
    relatedType?: string,
    actionUrl?: string
) => {
    try {
        const notification = await prismaClient.notification.create({
            data: {
                userId: userId,
                title: title,
                message: message,
                type: type.toUpperCase() as any,
                relatedId: relatedId,
                relatedType: relatedType,
                actionUrl: actionUrl
            }
        });

        console.log('Notification created:', notification.id, 'for user:', userId);
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

/**
 * Utility function to create notifications for multiple users
 */
export const createNotificationForUsers = async (
    userIds: string[],
    title: string,
    message: string,
    type: string,
    relatedId?: string,
    relatedType?: string,
    actionUrl?: string
) => {
    try {
        const notifications = await Promise.all(
            userIds.map(userId =>
                prismaClient.notification.create({
                    data: {
                        userId: userId,
                        title: title,
                        message: message,
                        type: type.toUpperCase() as any,
                        relatedId: relatedId,
                        relatedType: relatedType,
                        actionUrl: actionUrl
                    }
                })
            )
        );

        console.log('Bulk notifications created:', notifications.length);
        return notifications;
    } catch (error) {
        console.error('Error creating bulk notifications:', error);
        throw error;
    }
};