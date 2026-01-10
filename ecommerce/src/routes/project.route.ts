import { Router } from 'express';
import { 
    getAssignedProjects,
    getProjectDetails,
    getProjectMembers,
    createProject,
    updateProject,
    getManagedProjects,
    assignProjectToTeam,
    getProjects,
    getMyProjects,
    getProjectDashboard,
    getProjectTasks,
    getProjectMetrics,
    getProjectPerformance
} from '../controller/project.controller';
import { authMiddleware } from '../middleware/auth.mid';
import { validate } from '../middleware/validate.mid';
import { errorHandler } from '../error-handler.validator';
import { 
    createProjectSchema, 
    updateProjectSchema, 
    assignProjectSchema, 
    projectIdParamSchema 
} from '../validator/project.validator';

const projectRoutes: Router = Router();

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects with role-based filtering
 *     description: |
 *       Retrieve projects based on user role:
 *       - Admin/HR: All company projects
 *       - Manager: Projects they manage or are assigned to
 *       - Employee: Only projects they're assigned to
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED]
 *         description: Filter by project status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *         description: Filter by project priority
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in project name and description
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
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
 *                   example: "Projects retrieved successfully"
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
// Get all projects (role-based filtering)
projectRoutes.get('/', authMiddleware, errorHandler(getProjects));

/**
 * @swagger
 * /api/projects/assigned:
 *   get:
 *     summary: Get assigned projects for current user
 *     description: Get projects where the current user is either project manager, team member, or has assigned tasks
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assigned projects retrieved successfully
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
 *                   example: "Assigned projects retrieved successfully"
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Get assigned projects for current user
projectRoutes.get('/assigned', authMiddleware, errorHandler(getAssignedProjects));

/**
 * @swagger
 * /api/projects/my-projects:
 *   get:
 *     summary: Get user's projects
 *     description: Get all projects associated with the current user (managed, assigned, or has tasks)
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User projects retrieved successfully
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
 *                   example: "My projects retrieved successfully"
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Get my projects
projectRoutes.get('/my-projects', authMiddleware, errorHandler(getMyProjects));

/**
 * @swagger
 * /api/projects/managed:
 *   get:
 *     summary: Get managed projects (Manager/HR/Admin only)
 *     description: |
 *       Get projects managed by the current user:
 *       - Manager: Only projects they manage
 *       - HR/Admin: All company projects
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Managed projects retrieved successfully
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
 *                   example: "Managed projects retrieved successfully"
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Only managers, HR, and admins can view managed projects
 */
// Get managed projects (Manager/HR/Admin only)
projectRoutes.get('/managed', authMiddleware, errorHandler(getManagedProjects));

/**
 * @swagger
 * /api/projects/dashboard:
 *   get:
 *     summary: Get project dashboard statistics
 *     description: Get comprehensive project analytics including status distribution, priority breakdown, and team metrics
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project dashboard data retrieved successfully
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
 *                   example: "Project dashboard data retrieved successfully"
 *                 dashboard:
 *                   type: object
 *                   properties:
 *                     totalProjects:
 *                       type: integer
 *                       example: 15
 *                     activeProjects:
 *                       type: integer
 *                       example: 8
 *                     completedProjects:
 *                       type: integer
 *                       example: 5
 *                     overdueProjects:
 *                       type: integer
 *                       example: 2
 *                     projectsByStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     recentProjects:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Project'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Get project dashboard data
projectRoutes.get('/dashboard', authMiddleware, errorHandler(getProjectDashboard));

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create new project (Manager/HR/Admin only)
 *     description: Create a new project and assign it to a team. Managers can only create projects for teams they manage.
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - teamId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "E-commerce Platform Development"
 *               description:
 *                 type: string
 *                 example: "Building a modern e-commerce platform with React and Node.js"
 *               teamId:
 *                 type: string
 *                 example: "team-uuid"
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 example: "HIGH"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               deadline:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Project created successfully
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
 *                   example: "Project created successfully"
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Only managers, HR, and admins can create projects
 *       404:
 *         description: Team not found
 */
// Create new project (Manager/HR/Admin only)
projectRoutes.post('/', authMiddleware, validate(createProjectSchema), errorHandler(createProject));

/**
 * @swagger
 * /api/projects/{projectId}:
 *   get:
 *     summary: Get project details by ID
 *     description: Get detailed information about a specific project including team members, tasks, and statistics
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details retrieved successfully
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
 *                   example: "Project details retrieved successfully"
 *                 project:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Project'
 *                     - type: object
 *                       properties:
 *                         statistics:
 *                           type: object
 *                           properties:
 *                             totalTasks:
 *                               type: integer
 *                             completedTasks:
 *                               type: integer
 *                             inProgressTasks:
 *                               type: integer
 *                             todoTasks:
 *                               type: integer
 *                             teamSize:
 *                               type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: You do not have access to this project
 *       404:
 *         description: Project not found
 */
// Get project details by ID
projectRoutes.get('/:projectId', authMiddleware, validate(projectIdParamSchema), errorHandler(getProjectDetails));

/**
 * @swagger
 * /api/projects/{projectId}:
 *   put:
 *     summary: Update project (Manager/HR/Admin only)
 *     description: Update project details. Project managers and HR/Admin can update projects.
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *               progress:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               deadline:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Project updated successfully
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
 *                   example: "Project updated successfully"
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: You do not have permission to update this project
 *       404:
 *         description: Project not found
 */
// Update project (Manager/HR/Admin only)
projectRoutes.put('/:projectId', authMiddleware, validate(projectIdParamSchema), validate(updateProjectSchema), errorHandler(updateProject));

/**
 * @swagger
 * /api/projects/{projectId}/members:
 *   get:
 *     summary: Get project team members
 *     description: Get list of team members assigned to the project with their task assignments
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project members retrieved successfully
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
 *                   example: "Project members retrieved successfully"
 *                 project:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     manager:
 *                       $ref: '#/components/schemas/User'
 *                     team:
 *                       $ref: '#/components/schemas/Team'
 *                     memberCount:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Project not found
 */
// Get project members
projectRoutes.get('/:projectId/members', authMiddleware, validate(projectIdParamSchema), errorHandler(getProjectMembers));

/**
 * @swagger
 * /api/projects/{projectId}/tasks:
 *   get:
 *     summary: Get project tasks
 *     description: Get all tasks associated with a specific project with filtering options
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, IN_REVIEW, COMPLETED, CANCELLED]
 *         description: Filter by task status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *         description: Filter by task priority
 *       - in: query
 *         name: assigneeId
 *         schema:
 *           type: string
 *         description: Filter by assignee ID
 *     responses:
 *       200:
 *         description: Project tasks retrieved successfully
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
 *                   example: "Project tasks retrieved successfully"
 *                 project:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: You do not have access to this project
 *       404:
 *         description: Project not found
 */
// Get project tasks
projectRoutes.get('/:projectId/tasks', authMiddleware, validate(projectIdParamSchema), errorHandler(getProjectTasks));

/**
 * @swagger
 * /api/projects/{projectId}/metrics:
 *   get:
 *     summary: Get project metrics and analytics
 *     description: Get comprehensive project analytics including task statistics, team workload, and timeline metrics
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project metrics retrieved successfully
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
 *                   example: "Project metrics retrieved successfully"
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     projectInfo:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         status:
 *                           type: string
 *                         priority:
 *                           type: string
 *                         progress:
 *                           type: integer
 *                     taskMetrics:
 *                       type: object
 *                       properties:
 *                         totalTasks:
 *                           type: integer
 *                         completedTasks:
 *                           type: integer
 *                         inProgressTasks:
 *                           type: integer
 *                         todoTasks:
 *                           type: integer
 *                         completionRate:
 *                           type: integer
 *                     teamMetrics:
 *                       type: object
 *                       properties:
 *                         totalMembers:
 *                           type: integer
 *                         memberWorkload:
 *                           type: array
 *                           items:
 *                             type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: You do not have access to this project
 *       404:
 *         description: Project not found
 */
// Get project metrics
projectRoutes.get('/:projectId/metrics', authMiddleware, validate(projectIdParamSchema), errorHandler(getProjectMetrics));

/**
 * @swagger
 * /api/projects/{projectId}/performance:
 *   get:
 *     summary: Get project performance metrics
 *     description: Calculate project performance using enterprise formulas including task completion, deadline adherence, and time accuracy
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project performance calculated successfully
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
 *                   example: "Project performance calculated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ProjectPerformanceMetrics'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: You do not have access to this project
 *       404:
 *         description: Project not found
 */
// Get project performance metrics
projectRoutes.get('/:projectId/performance', authMiddleware, validate(projectIdParamSchema), errorHandler(getProjectPerformance));

/**
 * @swagger
 * /api/projects/{projectId}/assign:
 *   put:
 *     summary: Assign project to team (Manager/HR/Admin only)
 *     description: Reassign a project to a different team. Only managers, HR, and admins can perform this action.
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teamId
 *             properties:
 *               teamId:
 *                 type: string
 *                 example: "new-team-uuid"
 *     responses:
 *       200:
 *         description: Project assigned to team successfully
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
 *                   example: "Project assigned to team successfully"
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Only managers, HR, and admins can assign projects
 *       404:
 *         description: Project or team not found
 */
// Assign project to team (Manager/HR/Admin only)
projectRoutes.put('/:projectId/assign', authMiddleware, validate(projectIdParamSchema), validate(assignProjectSchema), errorHandler(assignProjectToTeam));

export default projectRoutes;