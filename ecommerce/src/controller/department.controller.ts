import { NextFunction, Request, Response } from 'express';
import { prismaClient } from '../index.validator';
import { ErrorCodes } from '../exceptions/root';
import { BadRequestsException } from '../exceptions/bad_request';
import { NotFoundException } from '../exceptions/not_found';

/**
 * Department Management Controller
 * 
 * This controller handles department CRUD operations
 */

/**
 * Get all departments in the company (Admin/HR only)
 * GET /api/departments
 */
export const getAllDepartments = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log('Getting all departments for company:', req.companyId);

        const departments = await prismaClient.department.findMany({
            where: {
                companyId: req.companyId,
                isActive: true
            },
            include: {
                _count: {
                    select: {
                        users: {
                            where: {
                                isActive: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json({
            success: true,
            message: 'Departments retrieved successfully',
            departments: departments.map(dept => ({
                id: dept.id,
                name: dept.name,
                description: dept.description,
                userCount: dept._count.users,
                isActive: dept.isActive,
                createdAt: dept.createdAt,
                updatedAt: dept.updatedAt
            })),
            total: departments.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new department (Admin/HR only)
 * POST /api/departments
 */
export const createDepartment = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, description } = req.body;

        console.log('Creating department:', name);

        // Check if department already exists
        const existingDepartment = await prismaClient.department.findFirst({
            where: {
                name,
                companyId: req.companyId,
                isActive: true
            }
        });

        if (existingDepartment) {
            throw new BadRequestsException(
                'Department with this name already exists',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        const department = await prismaClient.department.create({
            data: {
                name,
                description,
                companyId: req.companyId!
            },
            include: {
                _count: {
                    select: {
                        users: {
                            where: {
                                isActive: true
                            }
                        }
                    }
                }
            }
        });

        res.status(201).json({
            success: true,
            message: 'Department created successfully',
            department: {
                id: department.id,
                name: department.name,
                description: department.description,
                userCount: department._count.users,
                isActive: department.isActive,
                createdAt: department.createdAt,
                updatedAt: department.updatedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a department (Admin/HR only)
 * PUT /api/departments/:departmentId
 */
export const updateDepartment = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { departmentId } = req.params;
        const { name, description } = req.body;

        console.log('Updating department:', departmentId);

        // Check if department exists
        const existingDepartment = await prismaClient.department.findFirst({
            where: {
                id: departmentId,
                companyId: req.companyId,
                isActive: true
            }
        });

        if (!existingDepartment) {
            throw new NotFoundException(
                'Department not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Check if name is already taken by another department
        if (name && name !== existingDepartment.name) {
            const nameConflict = await prismaClient.department.findFirst({
                where: {
                    name,
                    companyId: req.companyId,
                    isActive: true,
                    id: {
                        not: departmentId
                    }
                }
            });

            if (nameConflict) {
                throw new BadRequestsException(
                    'Department with this name already exists',
                    ErrorCodes.INTERNAL_EXCEPTION
                );
            }
        }

        const updatedDepartment = await prismaClient.department.update({
            where: { id: departmentId },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description })
            },
            include: {
                _count: {
                    select: {
                        users: {
                            where: {
                                isActive: true
                            }
                        }
                    }
                }
            }
        });

        res.json({
            success: true,
            message: 'Department updated successfully',
            department: {
                id: updatedDepartment.id,
                name: updatedDepartment.name,
                description: updatedDepartment.description,
                userCount: updatedDepartment._count.users,
                isActive: updatedDepartment.isActive,
                createdAt: updatedDepartment.createdAt,
                updatedAt: updatedDepartment.updatedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a department (Admin only)
 * DELETE /api/departments/:departmentId
 */
export const deleteDepartment = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { departmentId } = req.params;

        console.log('Deleting department:', departmentId);

        // Check if department exists
        const existingDepartment = await prismaClient.department.findFirst({
            where: {
                id: departmentId,
                companyId: req.companyId,
                isActive: true
            },
            include: {
                _count: {
                    select: {
                        users: {
                            where: {
                                isActive: true
                            }
                        }
                    }
                }
            }
        });

        if (!existingDepartment) {
            throw new NotFoundException(
                'Department not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Check if department has users
        if (existingDepartment._count.users > 0) {
            throw new BadRequestsException(
                `Cannot delete department with ${existingDepartment._count.users} active users. Please reassign users first.`,
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Soft delete the department
        await prismaClient.department.update({
            where: { id: departmentId },
            data: { isActive: false }
        });

        res.json({
            success: true,
            message: 'Department deleted successfully',
            departmentId
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get users in a department (Admin/HR only)
 * GET /api/departments/:departmentId/users
 */
export const getDepartmentUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { departmentId } = req.params;

        console.log('Getting users for department:', departmentId);

        // Check if department exists
        const department = await prismaClient.department.findFirst({
            where: {
                id: departmentId,
                companyId: req.companyId,
                isActive: true
            }
        });

        if (!department) {
            throw new NotFoundException(
                'Department not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        const users = await prismaClient.user.findMany({
            where: {
                departmentId,
                companyId: req.companyId,
                isActive: true
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isEmailVerified: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json({
            success: true,
            message: 'Department users retrieved successfully',
            department: {
                id: department.id,
                name: department.name,
                description: department.description
            },
            users,
            total: users.length
        });
    } catch (error) {
        next(error);
    }
};