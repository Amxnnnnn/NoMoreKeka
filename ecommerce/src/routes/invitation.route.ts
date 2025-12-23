import { Router } from 'express';
import {
    sendInvitation,
    getAllInvitations,
    cancelInvitation,
    acceptInvitation,
    getInvitationDetails
} from '../controller/invitation.controller';
import { errorHandler } from '../error-handler.validator';
import { validate } from '../middleware/validate.mid';
import { authMiddleware } from '../middleware/auth.mid';
import {
    hrMiddleware,
    companyIsolationMiddleware
} from '../middleware/admin.mid';
import { sendInvitationSchema, acceptInvitationSchema } from '../validator/invitation.validator';

const invitationRoutes: Router = Router();

/**
 * Public routes (no authentication required)
 */

/**
 * @swagger
 * /api/invitations/details/{token}:
 *   get:
 *     summary: Get invitation details by token (Public)
 *     tags: [Invitation Management]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation token
 *     responses:
 *       200:
 *         description: Invitation details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 invitation:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     company:
 *                       type: object
 *                     expiresAt:
 *                       type: string
 *       400:
 *         description: Invalid or expired invitation
 */
invitationRoutes.get('/details/:token', errorHandler(getInvitationDetails));

/**
 * @swagger
 * /api/invitations/accept:
 *   post:
 *     summary: Accept an invitation (Public)
 *     tags: [Invitation Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Invitation token
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Password for the new account
 *     responses:
 *       201:
 *         description: Invitation accepted successfully
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
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid or expired invitation
 */
invitationRoutes.post('/accept', validate(acceptInvitationSchema), errorHandler(acceptInvitation));

/**
 * Protected routes (require authentication and company isolation)
 */
invitationRoutes.use(authMiddleware);
invitationRoutes.use(companyIsolationMiddleware);

/**
 * @swagger
 * /api/invitations:
 *   post:
 *     summary: Send invitation to a new member (Admin/HR only)
 *     tags: [Invitation Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@signity.com
 *               name:
 *                 type: string
 *                 example: John Doe
 *               role:
 *                 type: string
 *                 enum: [ADMIN, HR, EMPLOYEE]
 *                 example: EMPLOYEE
 *               departmentId:
 *                 type: string
 *                 description: Optional department ID
 *     responses:
 *       201:
 *         description: Invitation sent successfully
 *       400:
 *         description: User already exists or invitation already sent
 *       401:
 *         description: Unauthorized - Admin or HR access required
 */
invitationRoutes.post('/', hrMiddleware, validate(sendInvitationSchema), errorHandler(sendInvitation));

/**
 * @swagger
 * /api/invitations:
 *   get:
 *     summary: Get all invitations (Admin/HR only)
 *     tags: [Invitation Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invitations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 invitations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       email:
 *                         type: string
 *                       name:
 *                         type: string
 *                       role:
 *                         type: string
 *                       status:
 *                         type: string
 *                       expiresAt:
 *                         type: string
 *                       acceptedAt:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                 total:
 *                   type: number
 *       401:
 *         description: Unauthorized - Admin or HR access required
 */
invitationRoutes.get('/', hrMiddleware, errorHandler(getAllInvitations));

/**
 * @swagger
 * /api/invitations/{invitationId}:
 *   delete:
 *     summary: Cancel an invitation (Admin/HR only)
 *     tags: [Invitation Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation cancelled successfully
 *       400:
 *         description: Can only cancel pending invitations
 *       404:
 *         description: Invitation not found
 *       401:
 *         description: Unauthorized - Admin or HR access required
 */
invitationRoutes.delete('/:invitationId', hrMiddleware, errorHandler(cancelInvitation));

export default invitationRoutes;