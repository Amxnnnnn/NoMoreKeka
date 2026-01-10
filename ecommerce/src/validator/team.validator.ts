import { z } from "zod";

// Create team schema
export const createTeamSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Team name must be at least 2 characters").max(100, "Team name cannot exceed 100 characters"),
        description: z.string().max(500, "Description cannot exceed 500 characters").optional()
    })
});

// Update team schema
export const updateTeamSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Team name must be at least 2 characters").max(100, "Team name cannot exceed 100 characters").optional(),
        description: z.string().max(500, "Description cannot exceed 500 characters").optional()
    })
});

// Add team members schema
export const addTeamMembersSchema = z.object({
    body: z.object({
        memberIds: z.array(z.string().min(1, "Member ID is required")).min(1, "At least one member ID is required")
    })
});

// Reassign team member schema
export const reassignTeamMemberSchema = z.object({
    body: z.object({
        newTeamId: z.string().min(1, "New team ID is required")
    })
});

// Team ID parameter schema
export const teamIdParamSchema = z.object({
    params: z.object({
        teamId: z.string().min(1, "Team ID is required")
    })
});

// Member ID parameter schema
export const memberIdParamSchema = z.object({
    params: z.object({
        memberId: z.string().min(1, "Member ID is required")
    })
});

// Team and member ID parameters schema
export const teamMemberParamSchema = z.object({
    params: z.object({
        teamId: z.string().min(1, "Team ID is required"),
        memberId: z.string().min(1, "Member ID is required")
    })
});

// Type exports
export type CreateTeamInput = z.infer<typeof createTeamSchema>["body"];
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>["body"];
export type AddTeamMembersInput = z.infer<typeof addTeamMembersSchema>["body"];
export type ReassignTeamMemberInput = z.infer<typeof reassignTeamMemberSchema>["body"];
export type TeamIdParam = z.infer<typeof teamIdParamSchema>["params"];
export type MemberIdParam = z.infer<typeof memberIdParamSchema>["params"];
export type TeamMemberParam = z.infer<typeof teamMemberParamSchema>["params"];