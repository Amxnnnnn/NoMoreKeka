import { NextFunction, Request, Response } from 'express';
import { prismaClient } from '../index.validator';
import { ErrorCodes } from '../exceptions/root';
import { BadRequestsException } from '../exceptions/bad_request';
import { NotFoundException } from '../exceptions/not_found';
import { UnauthorizedException } from '../exceptions/unauthorized.ex';
import { validateCompanyId } from '../utility/validation.util';

/**
 * User Management Controller
 * 
 * This controller handles user CRUD operations with proper role-based access control.
 * Different endpoints require different permission levels.
 */

/**
 * Get all users in the company (Admin/HR only)
 * GET /api/users
 */
export const getAllUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const companyId = validateCompanyId(req.companyId, 'getAllUsers');
        console.log('Getting all users for company:', companyId);

        const users = await prismaClient.user.findMany({
            where: {
                companyId: companyId,
                isActive: true
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                },
                department: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                },
                team: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        manager: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Remove passwords from response
        const usersWithoutPasswords = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });

        res.json({
            success: true,
            message: 'Users retrieved successfully',
            users: usersWithoutPasswords,
            total: usersWithoutPasswords.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user by ID (Self or Admin/HR)
 * GET /api/users/:userId
 */
export const getUserById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { userId } = req.params;
        const companyId = validateCompanyId(req.companyId, 'getUserById');

        console.log('Getting user by ID:', userId, 'company:', companyId);

        const user = await prismaClient.user.findFirst({
            where: {
                id: userId,
                companyId: companyId,
                isActive: true
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                },
                department: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                },
                team: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        manager: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            throw new NotFoundException(
                'User not found',
                ErrorCodes.USER_NOT_FOUND
            );
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'User retrieved successfully',
            user: userWithoutPassword
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update user (Self or Admin/HR)
 * PUT /api/users/:userId
 */
export const updateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { userId } = req.params;
        const { name, email, role } = req.body;
        const companyId = validateCompanyId(req.companyId, 'updateUser');

        console.log('Updating user:', userId, 'company:', companyId);

        // Check if user exists
        const existingUser = await prismaClient.user.findFirst({
            where: {
                id: userId,
                companyId: companyId,
                isActive: true
            }
        });

        if (!existingUser) {
            throw new NotFoundException(
                'User not found',
                ErrorCodes.USER_NOT_FOUND
            );
        }

        // Only Admin can change roles
        const updateData: any = {};
        
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        
        // Role changes require admin privileges
        if (role && req.user?.role === 'ADMIN') {
            updateData.role = role;
        } else if (role && req.user?.role !== 'ADMIN') {
            throw new UnauthorizedException(
                'Only administrators can change user roles',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        const updatedUser = await prismaClient.user.update({
            where: { id: userId },
            data: updateData,
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                }
            }
        });

        // Remove password from response
        const { password, ...userWithoutPassword } = updatedUser;

        res.json({
            success: true,
            message: 'User updated successfully',
            user: userWithoutPassword
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Deactivate user (Admin only)
 * DELETE /api/users/:userId
 */
export const deactivateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { userId } = req.params;
        const companyId = validateCompanyId(req.companyId, 'deactivateUser');

        console.log('Deactivating user:', userId, 'company:', companyId);

        // Check if user exists
        const existingUser = await prismaClient.user.findFirst({
            where: {
                id: userId,
                companyId: companyId,
                isActive: true
            }
        });

        if (!existingUser) {
            throw new NotFoundException(
                'User not found',
                ErrorCodes.USER_NOT_FOUND
            );
        }

        // Prevent self-deactivation
        if (existingUser.id === req.user?.id) {
            throw new BadRequestsException(
                'You cannot deactivate your own account',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        const deactivatedUser = await prismaClient.user.update({
            where: { id: userId },
            data: { isActive: false }
        });

        res.json({
            success: true,
            message: 'User deactivated successfully',
            userId: deactivatedUser.id
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get users by role (Admin/HR only)
 * GET /api/users/role/:role
 */
export const getUsersByRole = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { role } = req.params;
        const companyId = validateCompanyId(req.companyId, 'getUsersByRole');

        console.log('Getting users by role:', role, 'company:', companyId);

        // Validate role
        const validRoles = ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'];
        if (!validRoles.includes(role.toUpperCase())) {
            throw new BadRequestsException(
                'Invalid role specified',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        const users = await prismaClient.user.findMany({
            where: {
                role: role.toUpperCase() as any,
                companyId: companyId,
                isActive: true
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                },
                department: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                },
                team: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        manager: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Remove passwords from response
        const usersWithoutPasswords = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });

        res.json({
            success: true,
            message: `Users with role ${role} retrieved successfully`,
            users: usersWithoutPasswords,
            total: usersWithoutPasswords.length,
            role: role.toUpperCase()
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Activate user (Admin only)
 * PUT /api/users/:userId/activate
 */
export const activateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { userId } = req.params;
        const companyId = validateCompanyId(req.companyId, 'activateUser');

        console.log('Activating user:', userId, 'company:', companyId);

        // Check if user exists
        const existingUser = await prismaClient.user.findFirst({
            where: {
                id: userId,
                companyId: companyId
            }
        });

        if (!existingUser) {
            throw new NotFoundException(
                'User not found',
                ErrorCodes.USER_NOT_FOUND
            );
        }

        // Prevent self-activation (though this shouldn't happen)
        if (existingUser.id === req.user?.id && !existingUser.isActive) {
            throw new BadRequestsException(
                'You cannot activate your own account while it is deactivated',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        const activatedUser = await prismaClient.user.update({
            where: { id: userId },
            data: { isActive: true }
        });

        res.json({
            success: true,
            message: 'User activated successfully',
            userId: activatedUser.id
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user's profile (Any authenticated user)
 * GET /api/users/profile
 */
export const getCurrentUserProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        console.log('Getting current user profile for:', userId);

        const user = await prismaClient.user.findFirst({
            where: {
                id: userId,
                isActive: true
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                },
                department: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                },
                team: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        manager: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            throw new NotFoundException(
                'User profile not found',
                ErrorCodes.USER_NOT_FOUND
            );
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'User profile retrieved successfully',
            user: userWithoutPassword
        });
    } catch (error) {
        next(error);
    }
};