import { z } from "zod";

// Create task schema
export const createTaskSchema = z.object({
    body: z.object({
        title: z.string().min(2, "Task title must be at least 2 characters").max(200, "Task title cannot exceed 200 characters"),
        description: z.string().max(1000, "Description cannot exceed 1000 characters").optional(),
        projectId: z.string().min(1, "Project ID is required"),
        assigneeId: z.string().min(1, "Assignee ID is required").optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        dueDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid due date").optional(),
        estimatedHours: z.number().min(0, "Estimated hours cannot be negative").max(1000, "Estimated hours cannot exceed 1000").optional()
    })
});

// Update task status schema
export const updateTaskStatusSchema = z.object({
    body: z.object({
        status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED']),
        actualHours: z.number().min(0, "Actual hours cannot be negative").max(1000, "Actual hours cannot exceed 1000").optional()
    })
});

// Add task comment schema
export const addTaskCommentSchema = z.object({
    body: z.object({
        comment: z.string().min(1, "Comment cannot be empty").max(1000, "Comment cannot exceed 1000 characters")
    })
});

// Assign task schema
export const assignTaskSchema = z.object({
    body: z.object({
        assigneeId: z.string().min(1, "Assignee ID is required")
    })
});

// Mark task complete schema
export const markTaskCompleteSchema = z.object({
    body: z.object({
        status: z.enum(['COMPLETED', 'CANCELLED']),
        actualHours: z.number().min(0, "Actual hours cannot be negative").max(1000, "Actual hours cannot exceed 1000").optional(),
        comments: z.string().max(500, "Comments cannot exceed 500 characters").optional()
    })
});

// Task ID parameter schema
export const taskIdParamSchema = z.object({
    params: z.object({
        taskId: z.string().min(1, "Task ID is required")
    })
});

// Task query schema
export const taskQuerySchema = z.object({
    query: z.object({
        status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED']).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        projectId: z.string().optional()
    })
});

// Type exports
export type CreateTaskInput = z.infer<typeof createTaskSchema>["body"];
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>["body"];
export type AddTaskCommentInput = z.infer<typeof addTaskCommentSchema>["body"];
export type AssignTaskInput = z.infer<typeof assignTaskSchema>["body"];
export type MarkTaskCompleteInput = z.infer<typeof markTaskCompleteSchema>["body"];
export type TaskIdParam = z.infer<typeof taskIdParamSchema>["params"];
export type TaskQuery = z.infer<typeof taskQuerySchema>["query"];