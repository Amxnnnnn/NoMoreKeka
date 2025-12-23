import { Router } from 'express';
import {
    getAllUsers,
    getUserById,
    updateUser,
    deactivateUser,
    getUsersByRole,
    getCurrentUserProfile
} from '../controller/user.controller';
import { errorHandler } from '../error-handler.validator';
import { validate } from '../middleware/validate.mid';
import { authMiddleware } from '../middleware/auth.mid';
import {
    adminMiddleware,
    hrMiddleware,
    employeeMiddleware,
    selfOrAdminMiddleware,
    companyIsolationMiddleware
} from '../middleware/admin.mid';
import {
    updateUserSchema,
    userIdParamSchema,
    roleParamSchema
} from '../validator/user.validator';

const userRoutes: Router = Router();

/**
 * All user routes require authentication and company isolation
 */
userRoutes.use(authMiddleware);
userRoutes.use(companyIsolationMiddleware);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users in the company (Admin/HR only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: number
 *       401:
 *         description: Unauthorized - Admin or HR access required
 */
userRoutes.get('/', hrMiddleware, errorHandler(getAllUsers));

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [User Management]
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
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
userRoutes.get('/profile', employeeMiddleware, errorHandler(getCurrentUserProfile));

/**
 * @swagger
 * /api/users/role/{role}:
 *   get:
 *     summary: Get users by role (Admin/HR only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ADMIN, HR, EMPLOYEE]
 *         description: User role to filter by
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: number
 *                 role:
 *                   type: string
 *       401:
 *         description: Unauthorized - Admin or HR access required
 */
userRoutes.get('/role/:role', validate(roleParamSchema), hrMiddleware, errorHandler(getUsersByRole));

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Get user by ID (Self or Admin/HR)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Can only access own profile or Admin/HR access required
 *       404:
 *         description: User not found
 */
userRoutes.get('/:userId', validate(userIdParamSchema), selfOrAdminMiddleware('userId'), errorHandler(getUserById));

/**
 * @swagger
 * /api/users/{userId}:
 *   put:
 *     summary: Update user (Self or Admin/HR)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
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
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@signity.com
 *               role:
 *                 type: string
 *                 enum: [ADMIN, HR, EMPLOYEE]
 *                 description: Only admins can change roles
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Can only update own profile or Admin/HR access required
 *       404:
 *         description: User not found
 */
userRoutes.put('/:userId', validate(userIdParamSchema), validate(updateUserSchema), selfOrAdminMiddleware('userId'), errorHandler(updateUser));

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: Deactivate user (Admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 userId:
 *                   type: string
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: User not found
 */
userRoutes.delete('/:userId', validate(userIdParamSchema), adminMiddleware, errorHandler(deactivateUser));

export default userRoutes;