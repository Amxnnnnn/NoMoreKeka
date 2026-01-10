import { z } from "zod";

// Apply leave schema
export const applyLeaveSchema = z.object({
    body: z.object({
        leaveTypeId: z.string().min(1, "Leave type is required"),
        startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
        endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date"),
        reason: z.string().min(10, "Reason must be at least 10 characters").max(500, "Reason cannot exceed 500 characters")
    })
});

// Leave approval schema
export const leaveApprovalSchema = z.object({
    body: z.object({
        comments: z.string().max(500, "Comments cannot exceed 500 characters").optional()
    })
});

// Leave ID parameter schema
export const leaveIdParamSchema = z.object({
    params: z.object({
        leaveId: z.string().min(1, "Leave ID is required")
    })
});

// Leave query schema
export const leaveQuerySchema = z.object({
    query: z.object({
        year: z.string().optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
        status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional()
    })
});

// Type exports
export type ApplyLeaveInput = z.infer<typeof applyLeaveSchema>["body"];
export type LeaveApprovalInput = z.infer<typeof leaveApprovalSchema>["body"];
export type LeaveIdParam = z.infer<typeof leaveIdParamSchema>["params"];
export type LeaveQuery = z.infer<typeof leaveQuerySchema>["query"];