import { NextFunction, Request, Response } from 'express';
import { prismaClient } from '../index.validator';
import { ErrorCodes } from '../exceptions/root';
import { BadRequestsException } from '../exceptions/bad_request';
import { NotFoundException } from '../exceptions/not_found';
import { sendInvitationEmail } from '../utility/email/email.service';
import { JWT_SECRET } from '../secret.validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Invitation Management Controller
 * 
 * This controller handles member invitation system
 */

/**
 * Send invitation to a new member (Admin/HR only)
 * POST /api/invitations
 */
export const sendInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, name, role, departmentId } = req.body;
        const invitedBy = req.user?.id;

        console.log('Sending invitation to:', email);

        // Check if user already exists
        const existingUser = await prismaClient.user.findFirst({
            where: { email }
        });

        if (existingUser) {
            throw new BadRequestsException(
                'User with this email already exists',
                ErrorCodes.USER_ALREADY_EXIST
            );
        }

        // Check if invitation already exists and is pending
        const existingInvitation = await prismaClient.invitation.findFirst({
            where: {
                email,
                companyId: req.companyId,
                status: 'PENDING'
            }
        });

        if (existingInvitation) {
            throw new BadRequestsException(
                'Invitation already sent to this email',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Validate department if provided
        if (departmentId) {
            const department = await prismaClient.department.findFirst({
                where: {
                    id: departmentId,
                    companyId: req.companyId,
                    isActive: true
                }
            });

            if (!department) {
                throw new BadRequestsException(
                    'Department not found',
                    ErrorCodes.INTERNAL_EXCEPTION
                );
            }
        }

        // Generate invitation token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        // Create invitation
        const invitation = await prismaClient.invitation.create({
            data: {
                email,
                name,
                role,
                companyId: req.companyId!,
                departmentId,
                invitedBy: invitedBy!,
                token,
                expiresAt
            },
            include: {
                company: {
                    select: {
                        name: true
                    }
                }
            }
        });

        // Send invitation email
        const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/auth/accept-invitation?token=${token}`;
        await sendInvitationEmail(email, name, invitation.company.name, invitationLink, req.user?.name || 'Admin');

        res.status(201).json({
            success: true,
            message: 'Invitation sent successfully',
            invitation: {
                id: invitation.id,
                email: invitation.email,
                name: invitation.name,
                role: invitation.role,
                status: invitation.status,
                expiresAt: invitation.expiresAt,
                createdAt: invitation.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all invitations (Admin/HR only)
 * GET /api/invitations
 */
export const getAllInvitations = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log('Getting all invitations for company:', req.companyId);

        const invitations = await prismaClient.invitation.findMany({
            where: {
                companyId: req.companyId
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                expiresAt: true,
                acceptedAt: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            success: true,
            message: 'Invitations retrieved successfully',
            invitations,
            total: invitations.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Cancel an invitation (Admin/HR only)
 * DELETE /api/invitations/:invitationId
 */
export const cancelInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { invitationId } = req.params;

        console.log('Cancelling invitation:', invitationId);

        const invitation = await prismaClient.invitation.findFirst({
            where: {
                id: invitationId,
                companyId: req.companyId
            }
        });

        if (!invitation) {
            throw new NotFoundException(
                'Invitation not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        if (invitation.status !== 'PENDING') {
            throw new BadRequestsException(
                'Can only cancel pending invitations',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        await prismaClient.invitation.update({
            where: { id: invitationId },
            data: { status: 'CANCELLED' }
        });

        res.json({
            success: true,
            message: 'Invitation cancelled successfully',
            invitationId
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Accept an invitation (Public endpoint)
 * POST /api/invitations/accept
 */
export const acceptInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { token, password } = req.body;

        console.log('Accepting invitation with token:', token?.substring(0, 10) + '...');

        // Find invitation by token
        const invitation = await prismaClient.invitation.findFirst({
            where: {
                token,
                status: 'PENDING'
            },
            include: {
                company: true
            }
        });

        if (!invitation) {
            throw new BadRequestsException(
                'Invalid or expired invitation',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Check if invitation has expired
        if (new Date() > invitation.expiresAt) {
            await prismaClient.invitation.update({
                where: { id: invitation.id },
                data: { status: 'EXPIRED' }
            });

            throw new BadRequestsException(
                'Invitation has expired',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Check if user already exists
        const existingUser = await prismaClient.user.findFirst({
            where: { email: invitation.email }
        });

        if (existingUser) {
            throw new BadRequestsException(
                'User with this email already exists',
                ErrorCodes.USER_ALREADY_EXIST
            );
        }

        // Create user account
        const { hashSync } = await import('bcrypt');
        const user = await prismaClient.user.create({
            data: {
                name: invitation.name,
                email: invitation.email,
                password: hashSync(password, 10),
                role: invitation.role,
                companyId: invitation.companyId,
                departmentId: invitation.departmentId,
                isEmailVerified: true,
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
                        name: true
                    }
                }
            }
        });

        // Update invitation status
        await prismaClient.invitation.update({
            where: { id: invitation.id },
            data: {
                status: 'ACCEPTED',
                acceptedAt: new Date()
            }
        });

        // Generate JWT token
        const jwtToken = jwt.sign(
            { userId: user.id, role: user.role, companyId: user.companyId },
            JWT_SECRET
        );

        // Return user info (exclude password)
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({
            success: true,
            message: 'Invitation accepted successfully',
            user: userWithoutPassword,
            token: jwtToken
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get invitation details by token (Public endpoint)
 * GET /api/invitations/details/:token
 */
export const getInvitationDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { token } = req.params;

        console.log('Getting invitation details for token:', token?.substring(0, 10) + '...');

        const invitation = await prismaClient.invitation.findFirst({
            where: {
                token,
                status: 'PENDING'
            },
            include: {
                company: {
                    select: {
                        name: true,
                        slug: true
                    }
                }
            }
        });

        if (!invitation) {
            throw new BadRequestsException(
                'Invalid or expired invitation',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Check if invitation has expired
        if (new Date() > invitation.expiresAt) {
            await prismaClient.invitation.update({
                where: { id: invitation.id },
                data: { status: 'EXPIRED' }
            });

            throw new BadRequestsException(
                'Invitation has expired',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        res.json({
            success: true,
            message: 'Invitation details retrieved successfully',
            invitation: {
                email: invitation.email,
                name: invitation.name,
                role: invitation.role,
                company: invitation.company,
                expiresAt: invitation.expiresAt
            }
        });
    } catch (error) {
        next(error);
    }
};