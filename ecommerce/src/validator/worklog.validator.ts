import { z } from "zod";

// Log work schema
export const logWorkSchema = z.object({
    body: z.object({
        projectId: z.string().min(1, "Project ID is required").optional(),
        taskId: z.string().min(1, "Task ID is required").optional(),
        date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
        hoursWorked: z.number().min(0.1, "Hours worked must be at least 0.1").max(24, "Hours worked cannot exceed 24"),
        description: z.string().min(5, "Description must be at least 5 characters").max(500, "Description cannot exceed 500 characters"),
        logType: z.enum(['DAILY', 'WEEKLY', 'PROJECT', 'TASK']).optional()
    })
});

// Update work log schema
export const updateWorkLogSchema = z.object({
    body: z.object({
        hoursWorked: z.number().min(0.1, "Hours worked must be at least 0.1").max(24, "Hours worked cannot exceed 24").optional(),
        description: z.string().min(5, "Description must be at least 5 characters").max(500, "Description cannot exceed 500 characters").optional()
    })
});

// Work log ID parameter schema
export const workLogIdParamSchema = z.object({
    params: z.object({
        workLogId: z.string().min(1, "Work log ID is required")
    })
});

// Work log query schema
export const workLogQuerySchema = z.object({
    query: z.object({
        startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date").optional(),
        endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date").optional(),
        projectId: z.string().optional(),
        userId: z.string().optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
        departmentId: z.string().optional()
    })
});

// Type exports
export type LogWorkInput = z.infer<typeof logWorkSchema>["body"];
export type UpdateWorkLogInput = z.infer<typeof updateWorkLogSchema>["body"];
export type WorkLogIdParam = z.infer<typeof workLogIdParamSchema>["params"];
export type WorkLogQuery = z.infer<typeof workLogQuerySchema>["query"];