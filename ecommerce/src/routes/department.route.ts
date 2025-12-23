import { Router } from 'express';
import {
    getAllDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentUsers
} from '../controller/department.controller';
import { errorHandler } from '../error-handler.validator';
import { validate } from '../middleware/validate.mid';
import { authMiddleware } from '../middleware/auth.mid';
import {
    adminMiddleware,
    hrMiddleware,
    companyIsolationMiddleware
} from '../middleware/admin.mid';

const departmentRoutes: Router = Router();

/**
 * All department routes require authentication and company isolation
 */
departmentRoutes.use(authMiddleware);
departmentRoutes.use(companyIsolationMiddleware);

/**
 * @swagger
 * /api/departments:
 *   get:
 *     summary: Get all departments in the company (Admin/HR only)
 *     tags: [Department Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Departments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 departments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       userCount:
 *                         type: number
 *                       isActive:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                       updatedAt:
 *                         type: string
 *                 total:
 *                   type: number
 *       401:
 *         description: Unauthorized - Admin or HR access required
 */
departmentRoutes.get('/', hrMiddleware, errorHandler(getAllDepartments));

/**
 * @swagger
 * /api/departments:
 *   post:
 *     summary: Create a new department (Admin/HR only)
 *     tags: [Department Management]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Engineering
 *               description:
 *                 type: string
 *                 example: Software development and technical operations
 *     responses:
 *       201:
 *         description: Department created successfully
 *       400:
 *         description: Department already exists
 *       401:
 *         description: Unauthorized - Admin or HR access required
 */
departmentRoutes.post('/', hrMiddleware, errorHandler(createDepartment));

/**
 * @swagger
 * /api/departments/{departmentId}:
 *   put:
 *     summary: Update a department (Admin/HR only)
 *     tags: [Department Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Engineering
 *               description:
 *                 type: string
 *                 example: Software development and technical operations
 *     responses:
 *       200:
 *         description: Department updated successfully
 *       404:
 *         description: Department not found
 *       401:
 *         description: Unauthorized - Admin or HR access required
 */
departmentRoutes.put('/:departmentId', hrMiddleware, errorHandler(updateDepartment));

/**
 * @swagger
 * /api/departments/{departmentId}:
 *   delete:
 *     summary: Delete a department (Admin only)
 *     tags: [Department Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department deleted successfully
 *       400:
 *         description: Cannot delete department with active users
 *       404:
 *         description: Department not found
 *       401:
 *         description: Unauthorized - Admin access required
 */
departmentRoutes.delete('/:departmentId', adminMiddleware, errorHandler(deleteDepartment));

/**
 * @swagger
 * /api/departments/{departmentId}/users:
 *   get:
 *     summary: Get users in a department (Admin/HR only)
 *     tags: [Department Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department users retrieved successfully
 *       404:
 *         description: Department not found
 *       401:
 *         description: Unauthorized - Admin or HR access required
 */
departmentRoutes.get('/:departmentId/users', hrMiddleware, errorHandler(getDepartmentUsers));

export default departmentRoutes;