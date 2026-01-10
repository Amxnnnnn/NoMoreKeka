import { Router } from 'express';
import { 
    createTeam,
    getManagedTeams,
    addTeamMembers,
    removeTeamMember,
    reassignTeamMember,
    getTeamStructure,
    updateTeam,
    getTeamWorkload,
    getTeamPerformance
} from '../controller/team.controller';
import { authMiddleware } from '../middleware/auth.mid';
import { 
    companyIsolationMiddleware 
} from '../middleware/admin.mid';
import { validate } from '../middleware/validate.mid';
import { errorHandler } from '../error-handler.validator';
import { 
    createTeamSchema, 
    updateTeamSchema, 
    addTeamMembersSchema, 
    reassignTeamMemberSchema, 
    teamIdParamSchema, 
    teamMemberParamSchema 
} from '../validator/team.validator';

const teamRoutes: Router = Router();

/**
 * All team routes require authentication and company isolation
 */
teamRoutes.use(authMiddleware);
teamRoutes.use(companyIsolationMiddleware);

/**
 * @swagger
 * /api/teams/managed:
 *   get:
 *     summary: Get managed teams
 *     description: Retrieve teams managed by the current user (Manager/HR/Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Managed teams retrieved successfully
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
 *                   example: "Managed teams retrieved successfully"
 *                 teams:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TeamWithDetails'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
teamRoutes.get('/managed', errorHandler(getManagedTeams));

/**
 * @swagger
 * /api/teams:
 *   post:
 *     summary: Create new team
 *     description: Create a new team (Manager/HR/Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTeamRequest'
 *     responses:
 *       200:
 *         description: Team created successfully
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
 *                   example: "Team created successfully"
 *                 team:
 *                   $ref: '#/components/schemas/TeamWithDetails'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
teamRoutes.post('/', validate(createTeamSchema), errorHandler(createTeam));

/**
 * @swagger
 * /api/teams/{teamId}:
 *   put:
 *     summary: Update team details
 *     description: Update team name and description (Manager/HR/Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTeamRequest'
 *     responses:
 *       200:
 *         description: Team updated successfully
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
 *                   example: "Team updated successfully"
 *                 team:
 *                   $ref: '#/components/schemas/TeamWithDetails'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
teamRoutes.put('/:teamId', validate(teamIdParamSchema), validate(updateTeamSchema), errorHandler(updateTeam));

/**
 * @swagger
 * /api/teams/{teamId}/structure:
 *   get:
 *     summary: Get team structure
 *     description: Retrieve detailed team structure including members, projects, and statistics
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team structure retrieved successfully
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
 *                   example: "Team structure retrieved successfully"
 *                 team:
 *                   $ref: '#/components/schemas/TeamStructure'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
teamRoutes.get('/:teamId/structure', validate(teamIdParamSchema), errorHandler(getTeamStructure));

/**
 * @swagger
 * /api/teams/{teamId}/workload:
 *   get:
 *     summary: Get team workload analysis
 *     description: Retrieve team workload analysis including member task distribution (Manager/HR/Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team workload retrieved successfully
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
 *                   example: "Team workload retrieved successfully"
 *                 team:
 *                   $ref: '#/components/schemas/TeamBasic'
 *                 summary:
 *                   $ref: '#/components/schemas/WorkloadSummary'
 *                 memberWorkloads:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MemberWorkload'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
teamRoutes.get('/:teamId/workload', validate(teamIdParamSchema), errorHandler(getTeamWorkload));

/**
 * @swagger
 * /api/teams/{teamId}/performance:
 *   get:
 *     summary: Get team performance metrics
 *     description: Calculate team performance using enterprise formulas (Manager/HR/Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team performance calculated successfully
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
 *                   example: "Team performance calculated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/TeamPerformanceMetrics'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
teamRoutes.get('/:teamId/performance', validate(teamIdParamSchema), errorHandler(getTeamPerformance));

/**
 * @swagger
 * /api/teams/{teamId}/members:
 *   put:
 *     summary: Add members to team
 *     description: Add multiple members to a team (Manager/HR/Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddTeamMembersRequest'
 *     responses:
 *       200:
 *         description: Team members added successfully
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
 *                   example: "Team members added successfully"
 *                 team:
 *                   $ref: '#/components/schemas/TeamWithMembers'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
teamRoutes.put('/:teamId/members', validate(teamIdParamSchema), validate(addTeamMembersSchema), errorHandler(addTeamMembers));

/**
 * @swagger
 * /api/teams/{teamId}/members/{memberId}:
 *   delete:
 *     summary: Remove member from team
 *     description: Remove a specific member from the team (Manager/HR/Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID to remove
 *     responses:
 *       200:
 *         description: Team member removed successfully
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
 *                   example: "Team member removed successfully"
 *                 removedMember:
 *                   $ref: '#/components/schemas/UserBasic'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
teamRoutes.delete('/:teamId/members/:memberId', validate(teamMemberParamSchema), errorHandler(removeTeamMember));

/**
 * @swagger
 * /api/teams/{teamId}/members/{memberId}/reassign:
 *   put:
 *     summary: Reassign team member to another team
 *     description: Move a team member from current team to another team (Manager/HR/Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: Current team ID
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID to reassign
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReassignTeamMemberRequest'
 *     responses:
 *       200:
 *         description: Team member reassigned successfully
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
 *                   example: "Team member reassigned successfully"
 *                 member:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     previousTeam:
 *                       type: string
 *                     newTeam:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
teamRoutes.put('/:teamId/members/:memberId/reassign', validate(teamMemberParamSchema), validate(reassignTeamMemberSchema), errorHandler(reassignTeamMember));

export default teamRoutes;