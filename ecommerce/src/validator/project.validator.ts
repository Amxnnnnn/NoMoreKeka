import { z } from "zod";

// Create project schema
export const createProjectSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Project name must be at least 2 characters").max(100, "Project name cannot exceed 100 characters"),
        description: z.string().max(1000, "Description cannot exceed 1000 characters").optional(),
        teamId: z.string().min(1, "Team ID is required"),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date").optional(),
        endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date").optional(),
        deadline: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid deadline").optional()
    })
});

// Update project schema
export const updateProjectSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Project name must be at least 2 characters").max(100, "Project name cannot exceed 100 characters").optional(),
        description: z.string().max(1000, "Description cannot exceed 1000 characters").optional(),
        status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date").optional(),
        endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date").optional(),
        deadline: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid deadline").optional(),
        progress: z.number().min(0, "Progress cannot be negative").max(100, "Progress cannot exceed 100").optional()
    })
});

// Assign project schema
export const assignProjectSchema = z.object({
    body: z.object({
        teamId: z.string().min(1, "Team ID is required")
    })
});

// Project ID parameter schema
export const projectIdParamSchema = z.object({
    params: z.object({
        projectId: z.string().min(1, "Project ID is required")
    })
});

// Type exports
export type CreateProjectInput = z.infer<typeof createProjectSchema>["body"];
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>["body"];
export type AssignProjectInput = z.infer<typeof assignProjectSchema>["body"];
export type ProjectIdParam = z.infer<typeof projectIdParamSchema>["params"];