import { Router } from 'express';
import { 
    getProfile, 
    updateProfile, 
    getCompanyInfo, 
    changePassword 
} from '../controller/profile.controller';
import { authMiddleware } from '../middleware/auth.mid';
import { validate } from '../middleware/validate.mid';
import { errorHandler } from '../error-handler.validator';
import { updateProfileSchema, changePasswordSchema } from '../validator/profile.validator';

const profileRoutes: Router = Router();

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Profile]
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
 *                 message:
 *                   type: string
 *                 profile:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     company:
 *                       type: object
 *                     department:
 *                       type: object
 *                     team:
 *                       type: object
 */
profileRoutes.get('/', authMiddleware, errorHandler(getProfile));

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Profile]
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
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@company.com"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
profileRoutes.put('/', authMiddleware, validate(updateProfileSchema), errorHandler(updateProfile));

/**
 * @swagger
 * /api/profile/company:
 *   get:
 *     summary: Get company information (read-only)
 *     tags: [Profile]
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
 *                 message:
 *                   type: string
 *                 company:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     statistics:
 *                       type: object
 */
profileRoutes.get('/company', authMiddleware, errorHandler(getCompanyInfo));

/**
 * @swagger
 * /api/profile/password:
 *   put:
 *     summary: Change password
 *     tags: [Profile]
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
 *               newPassword:
 *                 type: string
 *                 example: "newPassword123"
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
profileRoutes.put('/password', authMiddleware, validate(changePasswordSchema), errorHandler(changePassword));

export default profileRoutes;