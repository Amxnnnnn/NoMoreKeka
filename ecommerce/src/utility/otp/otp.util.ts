import { prismaClient } from '@/prisma_connection'
import { OTPPurpose } from '@prisma/client'

/**
 * STEP 1: Generate Random OTP
 * 
 * Logic:
 * - Math.random() → 0 to 1
 * - Multiply by 900000 → 0 to 900000
 * - Add 100000 → 100000 to 1000000 (6 digits)
 * - Math.floor() → remove decimals
 * - Result: "123456" format
 */
export const generateOTP = (): string => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    console.log(`Generated OTP: ${otp}`)
    return otp
}

/**
 * STEP 2: Create and Save OTP to Database
 * 
 * What it does:
 * 1. Delete any old OTPs for this email (cleanup - prevents multiple valid OTPs)
 * 2. Generate new 6-digit OTP
 * 3. Calculate expiry: current time + 10 minutes
 * 4. Save to database with isVerified = false
 * 
 * @param email - User's email
 * @param purpose - Why OTP is for (REGISTRATION, LOGIN, EMAIL_VERIFICATION)
 * @returns Created OTP object from database
 */
export const createOTP = async (
    email: string,
    purpose: OTPPurpose
) => {
    try {
        console.log(`\n Creating OTP for ${email} (Purpose: ${purpose})`)

        // Step 2.1: Delete old OTPs for this email and purpose
        // This ensures only one valid OTP exists at a time
        await prismaClient.oTP.deleteMany({
            where: {
                email,
                purpose
            }
        })
        console.log(`Deleted old OTPs for ${email}`)

        // Step 2.2: Generate new OTP
        const otpCode = generateOTP()

        // Step 2.3: Calculate expiry time
        // Current time + 10 minutes (10 * 60 * 1000 milliseconds)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
        console.log(` OTP expires at: ${expiresAt.toLocaleString()}`)

        // Step 2.4: Save OTP to database
        const otp = await prismaClient.oTP.create({
            data: {
                email,
                otpCode,
                purpose,
                isVerified: false, // Not verified yet'
                expiresAt,
                // userId: userId ?? null
                
            },
            select: {
                id: true,
                email: true,
                otpCode: true,
                purpose: true,
                isVerified: true,
                expiresAt: true,
                createdAt: true
            }
        })

        console.log(`OTP saved to database`)
        return otp
    } catch (error: any) {
        console.error(`Error creating OTP: ${error.message}`)
        throw error
    }
}

/**
 * STEP 3: Verify OTP
 * 
 * Checks performed (in order):
 * 1. ✅ OTP exists in database
 * 2. ✅ OTP code matches what user entered
 * 3. ✅ OTP is not already used (isVerified = false)
 * 4. ✅ OTP has not expired (currentTime < expiresAt)
 * 5. ✅ Purpose matches (REGISTRATION, LOGIN, etc.)
 * 
 * @param email - User's email
 * @param otpCode - OTP code user entered
 * @param purpose - Expected purpose (must match database)
 * @returns { success: boolean, message: string }
 */
export const verifyOTP = async (
    email: string,
    otpCode: string,
    purpose: OTPPurpose
): Promise<{ success: boolean; message: string }> => {
    try {
        console.log(`\nVerifying OTP for ${email}`)
        console.log(`   User entered: ${otpCode}`)
        console.log(`   Purpose: ${purpose}`)

        // CHECK 1: Find OTP in database that matches all criteria
        const otp = await prismaClient.oTP.findFirst({
            where: {
                email,
                otpCode,
                purpose,
                isVerified: false // Must not be already used
            }
        })

        // CHECK 2: Does OTP exist?
        if (!otp) {
            console.warn(`OTP not found or already used for ${email}`)
            return {
                success: false,
                message: 'Invalid OTP. Please check and try again.'
            }
        }

        console.log(`OTP found in database`)

        // CHECK 3: Has OTP expired?
        const currentTime = new Date()
        const expiryTime = new Date(otp.expiresAt)

        console.log(`Current time: ${currentTime.toLocaleString()}`)
        console.log(`Expiry time: ${expiryTime.toLocaleString()}`)

        if (currentTime > expiryTime) {
            console.warn(`OTP expired for ${email}`)
            return {
                success: false,
                message: 'OTP has expired. Please request a new one.'
            }
        }

        console.log(`OTP not expired`)

        // CHECK 4: OTP is valid, mark it as verified (used)
        // This prevents the same OTP from being used multiple times
        const updatedOTP = await prismaClient.oTP.update({
            where: { id: otp.id },
            data: { isVerified: true }
        })

        console.log(`OTP marked as verified (used)`)
        console.log(`OTP verification successful!\n`)

        return {
            success: true,
            message: 'OTP verified successfully'
        }
    } catch (error: any) {
        console.error(`❌ Error verifying OTP: ${error.message}`)
        return {
            success: false,
            message: 'Error verifying OTP'
        }
    }
}

/**
 * STEP 4: Get OTP Remaining Time
 * 
 * Calculates how much time is left before OTP expires
 * Useful for showing "OTP expires in X minutes" to user
 * 
 * @param expiresAt - OTP expiry timestamp
 * @returns Remaining time in seconds (0 if expired)
 */
export const getOTPRemainingTime = (expiresAt: Date): number => {
    const now = new Date().getTime()
    const expiry = new Date(expiresAt).getTime()
    const remaining = Math.floor((expiry - now) / 1000) // Convert to seconds

    return remaining > 0 ? remaining : 0
}

/**
 * STEP 5: Check if OTP is Expired (without verifying)
 * 
 * Just checks if OTP has expired, doesn't mark it as verified
 * Useful for checking before attempting verification
 * 
 * @param expiresAt - OTP expiry timestamp
 * @returns true if expired, false if still valid
 */
export const isOTPExpired = (expiresAt: Date): boolean => {
    return new Date() > new Date(expiresAt)
}

/**
 * STEP 6: Get Latest OTP for Email
 * 
 * Retrieves the most recent OTP for an email
 * Useful for debugging or checking OTP status
 * 
 * @param email - User's email
 * @param purpose - OTP purpose
 * @returns OTP object or null
 */
export const getLatestOTP = async (email: string, purpose: OTPPurpose) => {
    try {
        const otp = await prismaClient.oTP.findFirst({
            where: {
                email,
                purpose
            },
            orderBy: {
                createdAt: 'desc' // Get most recent
            }
        })

        return otp
    } catch (error: any) {
        console.error(`Error getting latest OTP: ${error.message}`)
        return null
    }
}

/**
 * STEP 7: Delete OTP (Cleanup)
 * 
 * Deletes OTP after successful verification
 * Optional - helps with database cleanup
 * 
 * @param email - User's email
 * @param purpose - OTP purpose
 */
export const deleteOTP = async (email: string, purpose: OTPPurpose) => {
    try {
        await prismaClient.oTP.deleteMany({
            where: {
                email,
                purpose
            }
        })
        console.log(` OTP deleted for ${email}`)
    } catch (error: any) {
        console.error(`Error deleting OTP: ${error.message}`)
    }
}

export default {
    generateOTP,
    createOTP,
    verifyOTP,
    getOTPRemainingTime,
    isOTPExpired,
    getLatestOTP,
    deleteOTP
}