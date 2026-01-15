import { Router } from 'express';
import { 
    getTasks,
    getAssignedTasks,
    updateTaskStatus,
    addTaskComment,
    getTaskComments,
    createTask,
    assignTask,
    getTeamTasks,
    markTaskComplete
} from '../controller/task.controller';
import { authMiddleware } from '../middleware/auth.mid';
import { companyIsolationMiddleware } from '../middleware/admin.mid';
import { validate } from '../middleware/validate.mid';
import { errorHandler } from '../error-handler.validator';
import { 
    createTaskSchema, 
    updateTaskStatusSchema, 
    addTaskCommentSchema, 
    assignTaskSchema, 
    markTaskCompleteSchema, 
    taskIdParamSchema,
    taskQuerySchema
} from '../validator/task.validator';

const taskRoutes: Router = Router();

// Apply authentication and company isolation to all routes
taskRoutes.use(authMiddleware);
taskRoutes.use(companyIsolationMiddleware);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks with role-based filtering
 *     description: |
 *       Retrieve tasks based on user role:
 *       - Admin/HR: All company tasks
 *       - Manager: Tasks from their projects or assigned to them
 *       - Employee: Only tasks assigned to them
 *     tags: [Task Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: assigneeId
 *         schema:
 *           type: string
 *         description: Filter by assignee ID (Manager/HR/Admin only)
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
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
 *                   example: "Tasks retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
// Get all tasks (with role-based filtering)
taskRoutes.get('/', validate(taskQuerySchema), errorHandler(getTasks));

/**
 * @swagger
 * /api/tasks/assigned:
 *   get:
 *     summary: Get assigned tasks for current user
 *     description: Get all tasks assigned to the current user with optional filtering
 *     tags: [Task Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *     responses:
 *       200:
 *         description: Assigned tasks retrieved successfully
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
 *                   example: "Assigned tasks retrieved successfully"
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Get assigned tasks for current user
taskRoutes.get('/assigned', errorHandler(getAssignedTasks));

/**
 * @swagger
 * /api/tasks/team:
 *   get:
 *     summary: Get team tasks (Manager/HR/Admin only)
 *     description: |
 *       Get tasks from projects managed by the current user:
 *       - Manager: Tasks from projects they manage
 *       - HR/Admin: All company tasks
 *     tags: [Task Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, IN_REVIEW, COMPLETED, CANCELLED]
 *         description: Filter by task status
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *     responses:
 *       200:
 *         description: Team tasks retrieved successfully
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
 *                   example: "Team tasks retrieved successfully"
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Only managers, HR, and admins can view team tasks
 */
// Get team tasks (Manager/HR/Admin only)
taskRoutes.get('/team', errorHandler(getTeamTasks));

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create new task (Manager/HR/Admin only)
 *     description: Create a new task and assign it to a project. Managers can only create tasks for projects they manage.
 *     tags: [Task Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - projectId
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Implement user authentication"
 *               description:
 *                 type: string
 *                 example: "Create login/register functionality with JWT tokens"
 *               projectId:
 *                 type: string
 *                 example: "project-uuid"
 *               assigneeId:
 *                 type: string
 *                 example: "user-uuid"
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 example: "HIGH"
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               estimatedHours:
 *                 type: number
 *                 format: float
 *                 example: 8.5
 *     responses:
 *       200:
 *         description: Task created successfully
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
 *                   example: "Task created successfully"
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Only managers, HR, and admins can create tasks
 *       404:
 *         description: Project not found or assignee not in project team
 */
// Create new task (Manager/HR/Admin only)
taskRoutes.post('/', validate(createTaskSchema), errorHandler(createTask));

/**
 * @swagger
 * /api/tasks/{taskId}/status:
 *   put:
 *     summary: Update task status
 *     description: Update the status of a task. Users can update tasks assigned to them or tasks they created.
 *     tags: [Task Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, IN_REVIEW, COMPLETED, CANCELLED]
 *                 example: "IN_PROGRESS"
 *               actualHours:
 *                 type: number
 *                 format: float
 *                 example: 10.0
 *                 description: Actual hours spent (optional)
 *     responses:
 *       200:
 *         description: Task status updated successfully
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
 *                   example: "Task status updated successfully"
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: You do not have permission to update this task
 *       404:
 *         description: Task not found
 */
// Update task status
taskRoutes.put('/:taskId/status', validate(taskIdParamSchema), validate(updateTaskStatusSchema), errorHandler(updateTaskStatus));

/**
 * @swagger
 * /api/tasks/{taskId}/assign:
 *   put:
 *     summary: Assign task to team member (Manager/HR/Admin only)
 *     description: Assign a task to a team member. The assignee must be part of the project team.
 *     tags: [Task Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assigneeId
 *             properties:
 *               assigneeId:
 *                 type: string
 *                 example: "user-uuid"
 *     responses:
 *       200:
 *         description: Task assigned successfully
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
 *                   example: "Task assigned successfully"
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Only managers, HR, and admins can assign tasks
 *       404:
 *         description: Task not found or assignee not in project team
 */
// Assign task to team member (Manager/HR/Admin only)
taskRoutes.put('/:taskId/assign', validate(taskIdParamSchema), validate(assignTaskSchema), errorHandler(assignTask));

/**
 * @swagger
 * /api/tasks/{taskId}/complete:
 *   put:
 *     summary: Mark task as complete/cancelled (Manager/HR/Admin only)
 *     description: Mark a task as completed or cancelled with optional completion details.
 *     tags: [Task Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [COMPLETED, CANCELLED]
 *                 example: "COMPLETED"
 *               actualHours:
 *                 type: number
 *                 format: float
 *                 example: 12.5
 *                 description: Actual hours spent on the task
 *               comments:
 *                 type: string
 *                 example: "Task completed successfully with all requirements met"
 *                 description: Optional completion comments
 *     responses:
 *       200:
 *         description: Task marked as complete/cancelled successfully
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
 *                   example: "Task marked as completed successfully"
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Only managers, HR, and admins can mark tasks as complete/cancelled
 *       404:
 *         description: Task not found
 */
// Mark task as complete/cancelled (Manager/HR/Admin only)
taskRoutes.put('/:taskId/complete', validate(taskIdParamSchema), validate(markTaskCompleteSchema), errorHandler(markTaskComplete));

/**
 * @swagger
 * /api/tasks/{taskId}/comments:
 *   post:
 *     summary: Add task comment
 *     description: Add a comment to a task. Users can comment on tasks they have access to.
 *     tags: [Task Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *                 example: "Updated the authentication logic as requested"
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Comment added successfully
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
 *                   example: "Comment added successfully"
 *                 comment:
 *                   $ref: '#/components/schemas/TaskComment'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: You do not have access to comment on this task
 *       404:
 *         description: Task not found
 */
// Add task comment
taskRoutes.post('/:taskId/comments', validate(taskIdParamSchema), validate(addTaskCommentSchema), errorHandler(addTaskComment));

/**
 * @swagger
 * /api/tasks/{taskId}/comments:
 *   get:
 *     summary: Get task comments
 *     description: Get all comments for a task in chronological order (newest first).
 *     tags: [Task Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task comments retrieved successfully
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
 *                   example: "Task comments retrieved successfully"
 *                 comments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TaskComment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Task not found
 */
// Get task comments
taskRoutes.get('/:taskId/comments', validate(taskIdParamSchema), errorHandler(getTaskComments));

export default taskRoutes;