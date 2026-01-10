import { z } from "zod";

// Create notification schema
export const createNotificationSchema = z.object({
    body: z.object({
        userId: z.string().min(1, "User ID is required"),
        title: z.string().min(1, "Title is required").max(200, "Title cannot exceed 200 characters"),
        message: z.string().min(1, "Message is required").max(1000, "Message cannot exceed 1000 characters"),
        type: z.enum(['LEAVE_REQUEST', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'TASK_ASSIGNED', 'TASK_OVERDUE', 'PROJECT_DEADLINE', 'TEAM_UPDATE', 'SYSTEM_ALERT']),
        relatedId: z.string().optional(),
        relatedType: z.string().optional(),
        actionUrl: z.string().url("Invalid URL format").optional()
    })
});

// Notification ID parameter schema
export const notificationIdParamSchema = z.object({
    params: z.object({
        notificationId: z.string().min(1, "Notification ID is required")
    })
});

// Notification query schema
export const notificationQuerySchema = z.object({
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        isRead: z.enum(['true', 'false']).optional(),
        type: z.enum(['LEAVE_REQUEST', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'TASK_ASSIGNED', 'TASK_OVERDUE', 'PROJECT_DEADLINE', 'TEAM_UPDATE', 'SYSTEM_ALERT']).optional(),
        days: z.string().optional()
    })
});

// Type exports
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>["body"];
export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>["params"];
export type NotificationQuery = z.infer<typeof notificationQuerySchema>["query"];