import { NextFunction, Request, Response } from 'express';
import { prismaClient } from '../index.validator';
import { ErrorCodes } from '../exceptions/root';
import { BadRequestsException } from '../exceptions/bad_request';
import { NotFoundException } from '../exceptions/not_found';

/**
 * Profile Management Controller
 * 
 * Handles personal profile operations for all users (Human base layer)
 * All authenticated users can access these endpoints
 */

/**
 * Get current user's profile
 * GET /api/profile
 */
export const getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        console.log('Getting profile for user:', userId);

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
                        slug: true,
                        isActive: true,
                        createdAt: true
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
                        description: true
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
        const { password, ...userProfile } = user;

        res.json({
            success: true,
            message: 'Profile retrieved successfully',
            profile: userProfile
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update current user's profile
 * PUT /api/profile
 */
export const updateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        const { name, email } = req.body;

        console.log('Updating profile for user:', userId);

        // Check if user exists
        const existingUser = await prismaClient.user.findFirst({
            where: {
                id: userId,
                isActive: true
            }
        });

        if (!existingUser) {
            throw new NotFoundException(
                'User not found',
                ErrorCodes.USER_NOT_FOUND
            );
        }

        // Check if email is already taken by another user
        if (email && email !== existingUser.email) {
            const emailExists = await prismaClient.user.findFirst({
                where: {
                    email: email,
                    id: { not: userId },
                    companyId: req.companyId
                }
            });

            if (emailExists) {
                throw new BadRequestsException(
                    'Email is already in use by another user',
                    ErrorCodes.INTERNAL_EXCEPTION
                );
            }
        }

        // Update user profile
        const updateData: any = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;

        const updatedUser = await prismaClient.user.update({
            where: { id: userId },
            data: updateData,
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        isActive: true,
                        createdAt: true
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
                        description: true
                    }
                }
            }
        });

        // Remove password from response
        const { password, ...userProfile } = updatedUser;

        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile: userProfile
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get company information (read-only for all users)
 * GET /api/profile/company
 */
export const getCompanyInfo = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const companyId = req.companyId;

        console.log('Getting company info for:', companyId);

        const company = await prismaClient.company.findFirst({
            where: {
                id: companyId,
                isActive: true
            },
            select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        users: {
                            where: { isActive: true }
                        },
                        departments: {
                            where: { isActive: true }
                        },
                        teams: {
                            where: { isActive: true }
                        },
                        projects: {
                            where: { isActive: true }
                        }
                    }
                }
            }
        });

        if (!company) {
            throw new NotFoundException(
                'Company not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        res.json({
            success: true,
            message: 'Company information retrieved successfully',
            company: {
                ...company,
                statistics: {
                    totalEmployees: company._count.users,
                    totalDepartments: company._count.departments,
                    totalTeams: company._count.teams,
                    totalProjects: company._count.projects
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Change password
 * PUT /api/profile/password
 */
export const changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        const { currentPassword, newPassword } = req.body;

        console.log('Changing password for user:', userId);

        // Get user with password
        const user = await prismaClient.user.findFirst({
            where: {
                id: userId,
                isActive: true
            }
        });

        if (!user) {
            throw new NotFoundException(
                'User not found',
                ErrorCodes.USER_NOT_FOUND
            );
        }

        // Verify current password
        const bcrypt = require('bcrypt');
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isCurrentPasswordValid) {
            throw new BadRequestsException(
                'Current password is incorrect',
                ErrorCodes.INCORRECT_PASSWORD
            );
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prismaClient.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        next(error);
    }
};