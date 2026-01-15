import { Router } from 'express';
import { 
    getProfile, 
    updateProfile, 
    getCompanyInfo, 
    changePassword 
} from '../controller/profile.controller';
import { authMiddleware } from '../middleware/auth.mid';
import { companyIsolationMiddleware } from '../middleware/admin.mid';
import { validate } from '../middleware/validate.mid';
import { errorHandler } from '../error-handler.validator';
import { updateProfileSchema, changePasswordSchema } from '../validator/profile.validator';

const profileRoutes: Router = Router();

// Apply global middleware for all routes
profileRoutes.use(authMiddleware);
profileRoutes.use(companyIsolationMiddleware);

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get current user's profile
 *     description: Retrieve complete profile information for the authenticated user including company, department, and team details
 *     tags: [Profile Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile retrieved successfully"
 *                 profile:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "user-uuid-123"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "john.doe@signity.com"
 *                     role:
 *                       type: string
 *                       enum: [ADMIN, HR, MANAGER, EMPLOYEE]
 *                       example: "EMPLOYEE"
 *                     companyId:
 *                       type: string
 *                       example: "company-uuid-123"
 *                     departmentId:
 *                       type: string
 *                       nullable: true
 *                       example: "dept-uuid-123"
 *                     teamId:
 *                       type: string
 *                       nullable: true
 *                       example: "team-uuid-123"
 *                     isEmailVerified:
 *                       type: boolean
 *                       example: true
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T10:30:00Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-13T10:30:00Z"
 *                     company:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "company-uuid-123"
 *                         name:
 *                           type: string
 *                           example: "Signity Solutions"
 *                         slug:
 *                           type: string
 *                           example: "signity"
 *                         isActive:
 *                           type: boolean
 *                           example: true
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                     department:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "dept-uuid-123"
 *                         name:
 *                           type: string
 *                           example: "Engineering"
 *                         description:
 *                           type: string
 *                           example: "Software development team"
 *                     team:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "team-uuid-123"
 *                         name:
 *                           type: string
 *                           example: "Frontend Development Team"
 *                         description:
 *                           type: string
 *                           example: "React and TypeScript specialists"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: User profile not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
profileRoutes.get('/', errorHandler(getProfile));

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update current user's profile
 *     description: Update personal information for the authenticated user (name and email)
 *     tags: [Profile Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "John Doe"
 *                 description: Updated full name
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@company.com"
 *                 description: Updated email address (must be unique within company)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 profile:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "user-uuid-123"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "john.doe@signity.com"
 *                     role:
 *                       type: string
 *                       example: "EMPLOYEE"
 *                     company:
 *                       type: object
 *                     department:
 *                       type: object
 *                       nullable: true
 *                     team:
 *                       type: object
 *                       nullable: true
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Email is already in use by another user or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: User not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
profileRoutes.put('/', validate(updateProfileSchema), errorHandler(updateProfile));

/**
 * @swagger
 * /api/profile/company:
 *   get:
 *     summary: Get company information (read-only)
 *     description: Retrieve comprehensive company information including statistics for all authenticated users
 *     tags: [Profile Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Company information retrieved successfully"
 *                 company:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "company-uuid-123"
 *                     name:
 *                       type: string
 *                       example: "Signity Solutions"
 *                     slug:
 *                       type: string
 *                       example: "signity"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T00:00:00Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-13T10:30:00Z"
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalEmployees:
 *                           type: integer
 *                           example: 45
 *                           description: Total number of active employees
 *                         totalDepartments:
 *                           type: integer
 *                           example: 8
 *                           description: Total number of active departments
 *                         totalTeams:
 *                           type: integer
 *                           example: 12
 *                           description: Total number of active teams
 *                         totalProjects:
 *                           type: integer
 *                           example: 25
 *                           description: Total number of active projects
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Company not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
profileRoutes.get('/company', errorHandler(getCompanyInfo));

/**
 * @swagger
 * /api/profile/password:
 *   put:
 *     summary: Change password
 *     description: Change the password for the authenticated user (requires current password verification)
 *     tags: [Profile Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "currentPassword123"
 *                 description: Current password for verification
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: "newSecurePassword123"
 *                 description: New password (minimum 8 characters)
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password changed successfully"
 *       400:
 *         description: Current password is incorrect or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: User not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
profileRoutes.put('/password', validate(changePasswordSchema), errorHandler(changePassword));

export default profileRoutes;