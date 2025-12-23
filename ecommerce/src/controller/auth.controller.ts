import { NextFunction, Request, Response } from 'express';
import { prismaClient } from '../index.validator';
import { hashSync, compareSync } from 'bcrypt';
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '../secret.validator';
import { AdminSignupInput, LoginInput } from '../validator/auth.validator';
import { ErrorCodes } from '../exceptions/root';
import { BadRequestsException } from '../exceptions/bad_request';
import { NotFoundException } from '../exceptions/not_found';
import { UnauthorizedException } from '../exceptions/unauthorized.ex';
import { createOTP, verifyOTP } from '@/utility/otp/otp.util';
import { sendSignupOtpEmail, sendWelcomeEmail, sendLoginOtpEmail } from '@/utility/email/email.service'
import { getSignityCompanyId } from '@/utility/seed';
import { OTPPurpose } from '@prisma/client';


// Admin Registration - Step 1: Request OTP
export const requestAdminSignupOTP = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email } = req.body

        // Validate email is provided
        if (!email) {
            throw new BadRequestsException(
                'Email is required',
                ErrorCodes.INTERNAL_EXCEPTION
            )
        }

        // Check if email is already registered
        const existingUser = await prismaClient.user.findFirst({
            where: { email }
        })

        if (existingUser) {
            throw new BadRequestsException(
                'Email already registered. Please login instead.',
                ErrorCodes.USER_ALREADY_EXIST
            )
        }

        // Create OTP (generates 6-digit code and saves to DB)
        const otp = await createOTP(email, OTPPurpose.REGISTRATION)

        // Send OTP via email
        await sendSignupOtpEmail(email, otp.otpCode)

        // Return success response
        res.json({
            success: true,
            message: 'OTP sent to your email. Valid for 10 minutes.',
            email,
            note: 'Check your email for the OTP code'
        })
    } catch (error) {
        next(error)
    }
}

// Admin Registration - Step 2: Verify OTP and Create Admin Account
export const verifyAdminSignupOTP = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, otpCode, name, password } = req.body

        // Validate all required fields
        if (!email || !otpCode || !name || !password) {
            throw new BadRequestsException(
                'Email, OTP, name, and password are all required',
                ErrorCodes.INTERNAL_EXCEPTION
            )
        }

        // Verify the OTP
        const otpVerification = await verifyOTP(email, otpCode, OTPPurpose.REGISTRATION)

        if (!otpVerification.success) {
            throw new BadRequestsException(
                otpVerification.message,
                ErrorCodes.INTERNAL_EXCEPTION
            )
        }

        // Check if user somehow already exists
        const existingUser = await prismaClient.user.findFirst({
            where: { email }
        })

        if (existingUser) {
            throw new BadRequestsException(
                'User already exists',
                ErrorCodes.USER_ALREADY_EXIST
            )
        }

        // Seeded company : signity
        const company = await prismaClient.company.findFirst({
            where: { slug: 'signity' }
        })

        if (!company) {
            throw new BadRequestsException(
                'System error: Default company not found. Please contact administrator.',
                ErrorCodes.INTERNAL_EXCEPTION
            )
        }

        // Create admin user account
        const user = await prismaClient.user.create({
            data: {
                name,
                email,
                password: hashSync(password, 10),
                role: 'ADMIN', // Registration only for Admin (super admin ya jo bhi bolo)
                companyId: company.id,
                isEmailVerified: true,
                isActive: true
            }
        })

        // Send welcome email
        await sendWelcomeEmail(email, name)

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, role: user.role, companyId: user.companyId },
            JWT_SECRET
        )

        // Return success response (exclude password)
        const { password: _, ...userWithoutPassword } = user
        res.status(201).json({
            success: true,
            message: 'Admin account created successfully',
            user: userWithoutPassword,
            token
        })
    } catch (error) {
        next(error)
    }
}

// Login with {"Email + Password"}
export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, password } = req.body

        // Find user by email with company info
        const user = await prismaClient.user.findFirst({
            where: { email },
            include: { company: true }
        })

        if (!user) {
            throw new NotFoundException(
                'User not found',
                ErrorCodes.USER_NOT_FOUND
            )
        }

        // Check if user is active
        if (!user.isActive) {
            throw new UnauthorizedException(
                'Account is deactivated. Please contact administrator.',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            )
        }

        // Compare password
        if (!compareSync(password, user.password)) {
            throw new BadRequestsException(
                'Incorrect password',
                ErrorCodes.INCORRECT_PASSWORD
            )
        }

        // Generate JWT token with company info
        const token = jwt.sign(
            { 
                userId: user.id, 
                role: user.role, 
                companyId: user.companyId 
            },
            JWT_SECRET
        )

        // Return user info (exclude password)
        const { password: _, ...userWithoutPassword } = user
        res.json({
            success: true,
            user: userWithoutPassword,
            token
        })
    } catch (error) {
        next(error)
    }
}

// otp verification in login (although not required - "OTP verification use nhi kr raha hu me!")
export const requestLoginOTP = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email } = req.body

        if (!email) {
            throw new BadRequestsException(
                'Email is required',
                ErrorCodes.INTERNAL_EXCEPTION
            )
        }

        // Check if user exists and is active
        const user = await prismaClient.user.findFirst({
            where: { email }
        })

        if (!user) {
            throw new NotFoundException(
                'User not found',
                ErrorCodes.USER_NOT_FOUND
            )
        }

        if (!user.isActive) {
            throw new UnauthorizedException(
                'Account is deactivated. Please contact administrator.',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            )
        }

        // Create OTP for login
        const otp = await createOTP(email, OTPPurpose.LOGIN)

        // Send OTP via email
        await sendLoginOtpEmail(email, otp.otpCode)

        res.json({
            success: true,
            message: 'OTP sent to your email. Valid for 10 minutes.',
            email
        })
    } catch (error) {
        next(error)
    }
}

// Time waste!
export const verifyLoginOTP = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, otpCode } = req.body

        if (!email || !otpCode) {
            throw new BadRequestsException(
                'Email and OTP are required',
                ErrorCodes.INTERNAL_EXCEPTION
            )
        }

        // Verify the OTP
        const otpVerification = await verifyOTP(email, otpCode, OTPPurpose.LOGIN)

        if (!otpVerification.success) {
            throw new BadRequestsException(
                otpVerification.message,
                ErrorCodes.INTERNAL_EXCEPTION
            )
        }

        // Find user with company info
        const user = await prismaClient.user.findFirst({
            where: { email },
            include: { company: true }
        })

        if (!user) {
            throw new NotFoundException(
                'User not found',
                ErrorCodes.USER_NOT_FOUND
            )
        }

        if (!user.isActive) {
            throw new UnauthorizedException(
                'Account is deactivated. Please contact administrator.',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            )
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                role: user.role, 
                companyId: user.companyId 
            },
            JWT_SECRET
        )

        // Return user info (exclude password)
        const { password: _, ...userWithoutPassword } = user
        res.json({
            success: true,
            message: 'Login successful',
            user: userWithoutPassword,
            token
        })
    } catch (error) {
        next(error)
    }
}

// Get current user profile
export const me = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log("Welcome to Admin dashboard");
        console.log("user details : ", req.user);

        if (!req.user) {
            console.log("No user found in request");
            throw new UnauthorizedException(
                'Unauthorized - No user found',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Fetch fresh user data with company info
        const user = await prismaClient.user.findUnique({
            where: { id: req.user.id },
            include: { company: true }
        })

        if (!user) {
            throw new NotFoundException(
                'User not found',
                ErrorCodes.USER_NOT_FOUND
            )
        }

        // Return user info (exclude password)
        const { password: _, ...userWithoutPassword } = user
        return res.status(200).json({
            success: true,
            user: userWithoutPassword
        });

    } catch (error) {
        console.log("Error in me endpoint : ", error);
        next(error);
    }
} 
