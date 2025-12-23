import { z } from "zod"

// Admin signup schema
export const adminSignupSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.email("Invalid email format"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        otpCode: z.string().length(6, "OTP must be exactly 6 digits")
    })
});

// Login schema (for both admin and regular users)
export const loginSchema = z.object({
    body: z.object({
        email: z.email("Invalid email format"),
        password: z.string().min(8, "Password must be at least 8 characters"),
    })
});

// OTP request schema
export const otpRequestSchema = z.object({
    body: z.object({
        email: z.email("Invalid email format")
    })
});

// OTP verification schema
export const otpVerificationSchema = z.object({
    body: z.object({
        email: z.email("Invalid email format"),
        otpCode: z.string().length(6, "OTP must be exactly 6 digits")
    })
});

// Type exports
export type AdminSignupInput = z.infer<typeof adminSignupSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type OTPRequestInput = z.infer<typeof otpRequestSchema>["body"];
export type OTPVerificationInput = z.infer<typeof otpVerificationSchema>["body"];