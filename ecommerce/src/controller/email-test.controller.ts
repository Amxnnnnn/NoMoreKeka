import { NextFunction, Request, Response } from 'express';
import { sendTestEmail, sendLoginOtpEmail } from '../utility/email/email.service';
import { createOTP, verifyOTP } from '../utility/otp/otp.util';
import { OTPPurpose } from '@prisma/client';

/**
 * Test email configuration
 */
export const testEmailConfig = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        console.log(`Testing email configuration with: ${email}`);

        const result = await sendTestEmail(email);

        res.json({
            success: result.success,
            message: result.success ? 'Test email sent successfully!' : 'Failed to send test email',
            result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Test complete OTP flow (generate + send email)
 */
export const testOTPFlow = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        console.log(`🧪 Testing complete OTP flow for: ${email}`);

        // Step 1: Generate OTP
        const otp = await createOTP(email, OTPPurpose.LOGIN);
        console.log(`📧 Generated OTP: ${otp.otpCode}`);

        // Step 2: Send OTP email
        const emailResult = await sendLoginOtpEmail(email, otp.otpCode!);

        res.json({
            success: true,
            message: 'OTP flow test completed',
            otp: {
                code: otp.otpCode,
                expiresAt: otp.expiresAt,
                email: email
            },
            emailResult,
            instructions: {
                message: 'Use the OTP code above to test verification',
                verifyEndpoint: 'POST /api/test/verify-otp',
                verifyPayload: {
                    email: email,
                    otpCode: otp.otpCode
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Test OTP verification
 */
export const testOTPVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, otpCode } = req.body;

        if (!email || !otpCode) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP code are required'
            });
        }

        console.log(`🧪 Testing OTP verification for: ${email} with code: ${otpCode}`);

        const verificationResult = await verifyOTP(email, otpCode, OTPPurpose.LOGIN);

        res.json({
            success: verificationResult.success,
            message: verificationResult.message,
            verificationResult,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get email configuration status
 */
export const getEmailStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const emailConfig = {
            emailUser: process.env.EMAIL_USER,
            hasPassword: !!process.env.EMAIL_PASSWORD,
            emailFrom: process.env.EMAIL_FROM,
            passwordLength: process.env.EMAIL_PASSWORD?.length || 0
        };

        res.json({
            success: true,
            message: 'Email configuration status',
            config: emailConfig,
            recommendations: [
                'Ensure 2-factor authentication is enabled on Gmail',
                'Generate a NEW App Password from Gmail settings',
                'Use the App Password (not regular password) in EMAIL_PASSWORD',
                'Verify EMAIL_USER matches Gmail account exactly',
                'Check if Gmail account has any security restrictions'
            ],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
};