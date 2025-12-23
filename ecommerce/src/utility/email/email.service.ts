import { transporter } from './nodemailer.config'
import { otpEmailTemplate, loginOtpEmailTemplate, welcomeEmailTemplate, invitationEmailTemplate } from './templates'

/**
 * Email Service
 * 
 * This service contains reusable functions to send different types of emails
 * Each function handles a specific email type (OTP, Welcome, etc.)
 */

interface SendEmailOptions {
    to: string
    subject: string
    html: string
    text?: string
}

/**
 * Generic function to send any email
 * @param options - Email options (to, subject, html, text)
 * @returns Success or error result
 */
export const sendEmail = async (options: SendEmailOptions) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || 'This is an automated email by Aman'
        }

        const info = await transporter.sendMail(mailOptions)
        
        console.log('Email sent successfully:', {
            messageId: info.messageId,
            to: options.to,
            subject: options.subject
        })

        return {
            success: true,
            messageId: info.messageId,
            message: 'Email sent successfully'
        }
    } catch (error: any) {
        console.error('Error sending email:', error.message)
        return {
            success: false,
            error: error.message,
            message: 'Failed to send email'
        }
    }
}

/**
 * Send OTP email for signup verification
 * @param email - Recipient email address
 * @param otp - 6-digit OTP code
 * @param userName - User's name (optional)
 */
export const sendSignupOtpEmail = async (
    email: string,
    otp: string,
    userName?: string
) => {
    try {
        const html = otpEmailTemplate(otp, userName)
        
        return await sendEmail({
            to: email,
            subject: 'Email Verification - Enter Your OTP',
            html
        })
    } catch (error: any) {
        console.error('Error sending signup OTP email:', error.message)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Send OTP email for login
 * @param email - Recipient email address
 * @param otp - 6-digit OTP code
 */
export const sendLoginOtpEmail = async (email: string, otp: string) => {
    try {
        const html = loginOtpEmailTemplate(otp)
        
        return await sendEmail({
            to: email,
            subject: 'Your Login OTP Code',
            html
        })
    } catch (error: any) {
        console.error('Error sending login OTP email:', error.message)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Send welcome email after signup
 * @param email - Recipient email address
 * @param userName - User's name
 */
export const sendWelcomeEmail = async (email: string, userName: string) => {
    try {
        const html = welcomeEmailTemplate(userName)
        
        return await sendEmail({
            to: email,
            subject: 'Welcome to Signity solutions Admin panel',
            html
        })
    } catch (error: any) {
        console.error('Error sending welcome email:', error.message)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Send password reset email
 * @param email - Recipient email address
 * @param resetLink - Password reset link
 */
export const sendPasswordResetEmail = async (
    email: string,
    resetLink: string
) => {
    try {
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; }
                .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
                .header { text-align: center; color: #333; margin-bottom: 30px; }
                .button { display: inline-block; background-color: #FF6B6B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                </div>
                <p>Hi,</p>
                <p>We received a request to reset your password. Click the link below to reset it:</p>
                <a href="${resetLink}" class="button">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            </div>
        </body>
        </html>
        `
        
        return await sendEmail({
            to: email,
            subject: 'Password Reset Request',
            html
        })
    } catch (error: any) {
        console.error('Error sending password reset email:', error.message)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Test email function - Send a simple test email
 * Useful for verifying Nodemailer setup
 * @param email - Recipient email address
 */
export const sendTestEmail = async (email: string) => {
    try {
        const html = `
        <!DOCTYPE html>
        <html>
        <body>
            <h1>Test Email</h1>
            <p>Oye chal gaya oyeee!!</p>
            <p>Sent at: ${new Date().toLocaleString()}</p>
        </body>
        </html>
        `
        
        return await sendEmail({
            to: email,
            subject: 'Test mail from AmanZone',
            html
        })
    } catch (error: any) {
        console.error('Error sending test email:', error.message)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Send invitation email
 * @param email - Recipient email address
 * @param inviteeName - Name of the person being invited
 * @param companyName - Name of the company
 * @param invitationLink - Link to accept the invitation
 * @param inviterName - Name of the person sending the invitation
 * @param role - Role being offered
 */
export const sendInvitationEmail = async (
    email: string,
    inviteeName: string,
    companyName: string,
    invitationLink: string,
    inviterName: string,
    role: string = 'EMPLOYEE'
) => {
    try {
        const html = invitationEmailTemplate(inviteeName, companyName, invitationLink, inviterName, role)
        
        return await sendEmail({
            to: email,
            subject: `You're invited to join ${companyName} on NoMoreKeka`,
            html
        })
    } catch (error: any) {
        console.error('Error sending invitation email:', error.message)
        return {
            success: false,
            error: error.message
        }
    }
}

export default {
    sendEmail,
    sendSignupOtpEmail,
    sendLoginOtpEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendTestEmail,
    sendInvitationEmail
}