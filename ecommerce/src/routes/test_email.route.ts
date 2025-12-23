import { Router } from 'express'
import { sendTestEmail } from '../utility/email/email.service'
import { errorHandler } from '../error-handler.validator'
import { Request, Response, NextFunction } from 'express'
import { authMiddleware } from '../middleware/auth.mid'
import {
    adminMiddleware,
    hrMiddleware,
    employeeMiddleware,
    selfOrAdminMiddleware,
    companyIsolationMiddleware
} from '../middleware/admin.mid'
import {
    testAdminOnly,
    testHRLevel,
    testEmployeeLevel,
    testSelfAccess
} from '../controller/test.controller'

const testRoutes: Router = Router()

/**
 * Test endpoint to verify Nodemailer is working
 * Usage: POST /api/test/send-email
 * Body: { "email": "your-email@example.com" }
 */
const sendTestEmailController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            })
        }

        const result = await sendTestEmail(email)

        if (result.success) {
            res.json({
                success: true,
                message: 'Test email sent successfully',
                result
            })
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send test email',
                error: result.error
            })
        }
    } catch (error) {
        next(error)
    }
}

// Email test route (no authentication required)
testRoutes.post('/send-email', errorHandler(sendTestEmailController))

// Role-based access control test routes (require authentication)
testRoutes.use(authMiddleware)
testRoutes.use(companyIsolationMiddleware)

/**
 * @swagger
 * /api/test/admin-only:
 *   get:
 *     summary: Test Admin-only access
 *     tags: [Testing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin access granted
 *       401:
 *         description: Unauthorized - Admin access required
 */
testRoutes.get('/admin-only', adminMiddleware, errorHandler(testAdminOnly))

/**
 * @swagger
 * /api/test/hr-level:
 *   get:
 *     summary: Test HR-level access (Admin + HR)
 *     tags: [Testing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: HR-level access granted
 *       401:
 *         description: Unauthorized - HR or Admin access required
 */
testRoutes.get('/hr-level', hrMiddleware, errorHandler(testHRLevel))

/**
 * @swagger
 * /api/test/employee-level:
 *   get:
 *     summary: Test Employee-level access (All authenticated users)
 *     tags: [Testing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee-level access granted
 *       401:
 *         description: Unauthorized - Authentication required
 */
testRoutes.get('/employee-level', employeeMiddleware, errorHandler(testEmployeeLevel))

/**
 * @swagger
 * /api/test/self-access/{userId}:
 *   get:
 *     summary: Test Self-access (Users can only access their own data or Admin/HR can access any)
 *     tags: [Testing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to access
 *     responses:
 *       200:
 *         description: Self-access granted
 *       401:
 *         description: Unauthorized - Can only access own data or Admin/HR access required
 */
testRoutes.get('/self-access/:userId', selfOrAdminMiddleware('userId'), errorHandler(testSelfAccess))

export default testRoutes