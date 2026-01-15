import { z } from 'zod';

export const sendInvitationSchema = z.object({
    body: z.object({
        email: z.email('Please enter a valid email address'),
        name: z.string().min(2, 'Name must be at least 2 characters'),
        role: z.enum(['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']),
        departmentId: z.string().optional(),
    })
});

export const acceptInvitationSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Token is required'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
    })
});

export type SendInvitationData = z.infer<typeof sendInvitationSchema>["body"];
export type AcceptInvitationData = z.infer<typeof acceptInvitationSchema>["body"];