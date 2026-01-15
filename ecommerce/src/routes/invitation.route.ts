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
 *     description: Retrieve invitation details using the invitation token (public endpoint for invitation acceptance flow)
 *     tags: [Invitations]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique invitation token
 *         example: "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Invitation details retrieved successfully"
 *                 invitation:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "newuser@signity.com"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     role:
 *                       type: string
 *                       enum: [ADMIN, HR, MANAGER, EMPLOYEE]
 *                       example: "EMPLOYEE"
 *                     company:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "Signity Solutions"
 *                         slug:
 *                           type: string
 *                           example: "signity"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-20T10:30:00Z"
 *       400:
 *         description: Invalid or expired invitation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
invitationRoutes.get('/details/:token', errorHandler(getInvitationDetails));

/**
 * @swagger
 * /api/invitations/accept:
 *   post:
 *     summary: Accept an invitation (Public)
 *     description: Accept an invitation and create a new user account using the invitation token
 *     tags: [Invitations]
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
 *                 description: Invitation token received via email
 *                 example: "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Password for the new account (minimum 8 characters)
 *                 example: "SecurePassword123"
 *     responses:
 *       201:
 *         description: Invitation accepted successfully and user account created
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
 *                   example: "Invitation accepted successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT token for immediate login
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Invalid or expired invitation, or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalError'
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
 *     description: Send an email invitation to a new team member with role-based access
 *     tags: [Invitations]
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
 *                 example: "john.doe@signity.com"
 *                 description: Email address of the person to invite
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "John Doe"
 *                 description: Full name of the person to invite
 *               role:
 *                 type: string
 *                 enum: [ADMIN, HR, MANAGER, EMPLOYEE]
 *                 example: "EMPLOYEE"
 *                 description: Role to assign to the new user
 *               departmentId:
 *                 type: string
 *                 example: "dept-uuid-123"
 *                 description: Optional department ID to assign the user to
 *     responses:
 *       201:
 *         description: Invitation sent successfully
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
 *                   example: "Invitation sent successfully"
 *                 invitation:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "invitation-uuid-123"
 *                     email:
 *                       type: string
 *                       example: "john.doe@signity.com"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     role:
 *                       type: string
 *                       example: "EMPLOYEE"
 *                     status:
 *                       type: string
 *                       example: "PENDING"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: User already exists, invitation already sent, or invalid department
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Insufficient permissions (Admin or HR required)
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
invitationRoutes.post('/', hrMiddleware, validate(sendInvitationSchema), errorHandler(sendInvitation));

/**
 * @swagger
 * /api/invitations:
 *   get:
 *     summary: Get all invitations (Admin/HR only)
 *     description: Retrieve all invitations for the company with their current status
 *     tags: [Invitations]
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Invitations retrieved successfully"
 *                 invitations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "invitation-uuid-123"
 *                       email:
 *                         type: string
 *                         format: email
 *                         example: "john.doe@signity.com"
 *                       name:
 *                         type: string
 *                         example: "John Doe"
 *                       role:
 *                         type: string
 *                         enum: [ADMIN, HR, MANAGER, EMPLOYEE]
 *                         example: "EMPLOYEE"
 *                       status:
 *                         type: string
 *                         enum: [PENDING, ACCEPTED, CANCELLED, EXPIRED]
 *                         example: "PENDING"
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-20T10:30:00Z"
 *                       acceptedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-13T10:30:00Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-13T10:30:00Z"
 *                 total:
 *                   type: integer
 *                   example: 15
 *                   description: Total number of invitations
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Insufficient permissions (Admin or HR required)
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
invitationRoutes.get('/', hrMiddleware, errorHandler(getAllInvitations));

/**
 * @swagger
 * /api/invitations/{invitationId}:
 *   delete:
 *     summary: Cancel an invitation (Admin/HR only)
 *     description: Cancel a pending invitation (only pending invitations can be cancelled)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the invitation to cancel
 *         example: "invitation-uuid-123"
 *     responses:
 *       200:
 *         description: Invitation cancelled successfully
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
 *                   example: "Invitation cancelled successfully"
 *                 invitationId:
 *                   type: string
 *                   example: "invitation-uuid-123"
 *       400:
 *         description: Can only cancel pending invitations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Insufficient permissions (Admin or HR required)
 *       404:
 *         description: Invitation not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
invitationRoutes.delete('/:invitationId', hrMiddleware, errorHandler(cancelInvitation));

export default invitationRoutes;