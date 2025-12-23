import { z } from "zod";

// Update user schema
export const updateUserSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        email: z.email("Invalid email format").optional(),
        role: z.enum(['ADMIN', 'HR', 'EMPLOYEE']).optional()
    })
});

// User ID parameter schema
export const userIdParamSchema = z.object({
    params: z.object({
        userId: z.string().min(1, "User ID is required")
    })
});

// Role parameter schema
export const roleParamSchema = z.object({
    params: z.object({
        role: z.enum(['ADMIN', 'HR', 'EMPLOYEE'])
    })
});

// Type exports
export type UpdateUserInput = z.infer<typeof updateUserSchema>["body"];
export type UserIdParam = z.infer<typeof userIdParamSchema>["params"];
export type RoleParam = z.infer<typeof roleParamSchema>["params"];