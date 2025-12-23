import { 
    requestAdminSignupOTP, 
    verifyAdminSignupOTP, 
    login, 
    me, 
    requestLoginOTP, 
    verifyLoginOTP 
} from '../controller/auth.controller'
import { Router } from 'express'
import { validate } from "../middleware/validate.mid";
import { adminSignupSchema, loginSchema } from '../validator/auth.validator';
import { errorHandler } from '../error-handler.validator';
import { authMiddleware } from '@/middleware/auth.mid';
import adminMiddleware from '@/middleware/admin.mid';

const authRoutes:Router = Router()

/**
 * @swagger
 * /api/auth/admin/request-signup-otp:
 *   post:
 *     summary: Request OTP for admin registration
 *     tags: [Admin Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@signity.com
 *     responses:
 *       200:
 *         description: OTP sent to email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Email already registered
 */
authRoutes.post('/admin/request-signup-otp', errorHandler(requestAdminSignupOTP))

/**
 * @swagger
 * /api/auth/admin/verify-signup-otp:
 *   post:
 *     summary: Verify OTP and create admin account
 *     tags: [Admin Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otpCode
 *               - name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@signity.com
 *               otpCode:
 *                 type: string
 *                 example: "123456"
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: Admin User
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: AdminPassword123
 *     responses:
 *       201:
 *         description: Admin account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid OTP or validation error
 */
authRoutes.post('/admin/verify-signup-otp', validate(adminSignupSchema), errorHandler(verifyAdminSignupOTP))


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user and get JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Incorrect password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRoutes.post('/login',validate(loginSchema),errorHandler(login))

/**
 * @swagger
 * /api/auth/login/request-otp:
 *   post:
 *     summary: Request OTP for login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: OTP sent to email
 */
authRoutes.post('/login/request-otp', errorHandler(requestLoginOTP))

/**
 * @swagger
 * /api/auth/login/verify-otp:
 *   post:
 *     summary: Verify OTP and login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otpCode
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               otpCode:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful
 */
authRoutes.post('/login/verify-otp', errorHandler(verifyLoginOTP))

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - No token or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRoutes.get('/me',authMiddleware,errorHandler(me))

export default authRoutes