import { NextFunction, Request, Response } from 'express';
import { prismaClient } from '../index.validator';
import { ErrorCodes } from '../exceptions/root';
import { BadRequestsException } from '../exceptions/bad_request';
import { NotFoundException } from '../exceptions/not_found';
import { UnauthorizedException } from '../exceptions/unauthorized.ex';

/**
 * Leave Management Controller
 * 
 * Handles leave operations for all users with role-based access:
 * - All users: Apply leave, view own leave history/balance
 * - Managers: Approve/reject team leave requests
 * - HR: Global leave management, policies, reports
 * - Admin: Override any leave decision
 */

/**
 * Get leave balance for current user
 * GET /api/leaves/balance
 */
export const getLeaveBalance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        const year = parseInt(req.query.year as string) || new Date().getFullYear();

        console.log('Getting leave balance for user:', userId, 'year:', year);

        const leaveBalances = await prismaClient.leaveBalance.findMany({
            where: {
                userId: userId,
                year: year
            },
            include: {
                leaveType: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        defaultDays: true
                    }
                }
            }
        });

        // If no balances exist for this year, create them based on leave types
        if (leaveBalances.length === 0) {
            const leaveTypes = await prismaClient.leaveType.findMany({
                where: {
                    companyId: req.companyId,
                    isActive: true
                }
            });

            const newBalances = await Promise.all(
                leaveTypes.map(leaveType =>
                    prismaClient.leaveBalance.create({
                        data: {
                            userId: userId!,
                            leaveTypeId: leaveType.id,
                            year: year,
                            totalDays: leaveType.defaultDays,
                            usedDays: 0,
                            remainingDays: leaveType.defaultDays,
                            carryForward: 0
                        },
                        include: {
                            leaveType: {
                                select: {
                                    id: true,
                                    name: true,
                                    description: true,
                                    defaultDays: true
                                }
                            }
                        }
                    })
                )
            );

            return res.json({
                success: true,
                message: 'Leave balance retrieved successfully',
                year: year,
                balances: newBalances
            });
        }

        res.json({
            success: true,
            message: 'Leave balance retrieved successfully',
            year: year,
            balances: leaveBalances
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Apply for leave
 * POST /api/leaves/apply
 */
export const applyLeave = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        const { leaveTypeId, startDate, endDate, reason } = req.body;

        console.log('Applying leave for user:', userId);

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start > end) {
            throw new BadRequestsException(
                'Start date cannot be after end date',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Calculate days (including weekends for now - can be enhanced)
        const timeDiff = end.getTime() - start.getTime();
        const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

        // Check leave type exists
        const leaveType = await prismaClient.leaveType.findFirst({
            where: {
                id: leaveTypeId,
                companyId: req.companyId,
                isActive: true
            }
        });

        if (!leaveType) {
            throw new NotFoundException(
                'Leave type not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Check leave balance
        const year = start.getFullYear();
        let leaveBalance = await prismaClient.leaveBalance.findFirst({
            where: {
                userId: userId,
                leaveTypeId: leaveTypeId,
                year: year
            }
        });

        // Create balance if doesn't exist
        if (!leaveBalance) {
            leaveBalance = await prismaClient.leaveBalance.create({
                data: {
                    userId: userId!,
                    leaveTypeId: leaveTypeId,
                    year: year,
                    totalDays: leaveType.defaultDays,
                    usedDays: 0,
                    remainingDays: leaveType.defaultDays,
                    carryForward: 0
                }
            });
        }

        // Check if sufficient balance
        if (leaveBalance.remainingDays < days) {
            throw new BadRequestsException(
                `Insufficient leave balance. Available: ${leaveBalance.remainingDays} days, Requested: ${days} days`,
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Check for overlapping leaves
        const overlappingLeave = await prismaClient.leave.findFirst({
            where: {
                userId: userId,
                status: { in: ['PENDING', 'APPROVED'] },
                OR: [
                    {
                        startDate: { lte: end },
                        endDate: { gte: start }
                    }
                ]
            }
        });

        if (overlappingLeave) {
            throw new BadRequestsException(
                'You have overlapping leave requests for the selected dates',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Create leave application
        const leave = await prismaClient.leave.create({
            data: {
                userId: userId!,
                leaveTypeId: leaveTypeId,
                startDate: start,
                endDate: end,
                days: days,
                reason: reason,
                status: 'PENDING'
            },
            include: {
                leaveType: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        // TODO: Send notification to manager/HR

        res.json({
            success: true,
            message: 'Leave application submitted successfully',
            leave: leave
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get leave history for current user
 * GET /api/leaves/history
 */
export const getLeaveHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const status = req.query.status as string;

        console.log('Getting leave history for user:', userId);

        const whereClause: any = {
            userId: userId,
            isActive: true
        };

        if (status) {
            whereClause.status = status.toUpperCase();
        }

        const [leaves, total] = await Promise.all([
            prismaClient.leave.findMany({
                where: whereClause,
                include: {
                    leaveType: {
                        select: {
                            id: true,
                            name: true,
                            description: true
                        }
                    },
                    approver: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true
                        }
                    }
                },
                orderBy: {
                    appliedAt: 'desc'
                },
                skip: (page - 1) * limit,
                take: limit
            }),
            prismaClient.leave.count({
                where: whereClause
            })
        ]);

        res.json({
            success: true,
            message: 'Leave history retrieved successfully',
            leaves: leaves,
            pagination: {
                page: page,
                limit: limit,
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get team leave requests (Manager/HR/Admin only)
 * GET /api/leaves/team
 */
export const getTeamLeaveRequests = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const managerId = req.user?.id;
        const status = req.query.status as string;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        console.log('Getting team leave requests for manager:', managerId);

        // Check permissions
        if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only managers, HR, and admins can view team leave requests',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Build where clause based on role
        let whereClause: any = {
            isActive: true
        };

        // Role-based filtering
        if (req.user?.role === 'MANAGER') {
            // Managers can only see their team members' leave requests
            const teams = await prismaClient.team.findMany({
                where: {
                    managerId: managerId,
                    companyId: req.companyId,
                    isActive: true
                },
                include: {
                    members: {
                        select: { id: true }
                    }
                }
            });

            const teamMemberIds = teams.flatMap(team => team.members.map(member => member.id));
            whereClause.userId = { in: teamMemberIds };
        } else {
            // HR/Admin can see all leave requests in the company
            whereClause.user = {
                companyId: req.companyId
            };
        }

        // Additional filters
        if (status) {
            whereClause.status = status.toUpperCase();
        }

        if (startDate || endDate) {
            whereClause.AND = [];
            if (startDate) {
                whereClause.AND.push({
                    startDate: { gte: new Date(startDate) }
                });
            }
            if (endDate) {
                whereClause.AND.push({
                    endDate: { lte: new Date(endDate) }
                });
            }
        }

        const [leaves, total] = await Promise.all([
            prismaClient.leave.findMany({
                where: whereClause,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            department: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    },
                    leaveType: {
                        select: {
                            id: true,
                            name: true,
                            description: true
                        }
                    },
                    approver: {
                        select: {
                            id: true,
                            name: true,
                            role: true
                        }
                    }
                },
                orderBy: [
                    { status: 'asc' }, // Pending first
                    { appliedAt: 'desc' }
                ],
                skip: (page - 1) * limit,
                take: limit
            }),
            prismaClient.leave.count({
                where: whereClause
            })
        ]);

        res.json({
            success: true,
            message: 'Team leave requests retrieved successfully',
            leaveRequests: leaves,
            pagination: {
                page: page,
                limit: limit,
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Process leave request (Approve/Reject) - Manager/HR/Admin only
 * PUT /api/leaves/:leaveId/process
 */
export const processLeaveRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { leaveId } = req.params;
        const { status, comments } = req.body;
        const approverId = req.user?.id;

        console.log('Processing leave request:', leaveId, 'status:', status);

        // Check permissions
        if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only managers, HR, and admins can process leave requests',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Validate status
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            throw new BadRequestsException(
                'Status must be either APPROVED or REJECTED',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Get leave request
        const leave = await prismaClient.leave.findFirst({
            where: {
                id: leaveId,
                isActive: true
            },
            include: {
                user: {
                    include: {
                        team: true
                    }
                },
                leaveType: true
            }
        });

        if (!leave) {
            throw new NotFoundException(
                'Leave request not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Check if already processed
        if (leave.status !== 'PENDING') {
            throw new BadRequestsException(
                'Leave request has already been processed',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Authorization check for managers
        if (req.user?.role === 'MANAGER') {
            const isTeamMember = await prismaClient.team.findFirst({
                where: {
                    managerId: approverId,
                    members: {
                        some: {
                            id: leave.userId
                        }
                    }
                }
            });

            if (!isTeamMember) {
                throw new UnauthorizedException(
                    'You can only process leave requests for your team members',
                    ErrorCodes.UNAUTHORIZED_EXCEPTION
                );
            }
        }

        // Update leave request
        const updatedLeave = await prismaClient.leave.update({
            where: { id: leaveId },
            data: {
                status: status,
                approvedBy: approverId,
                respondedAt: new Date(),
                comments: comments
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                leaveType: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                approver: {
                    select: {
                        id: true,
                        name: true,
                        role: true
                    }
                }
            }
        });

        // Update leave balance if approved
        if (status === 'APPROVED') {
            await prismaClient.leaveBalance.updateMany({
                where: {
                    userId: leave.userId,
                    leaveTypeId: leave.leaveTypeId,
                    year: leave.startDate.getFullYear()
                },
                data: {
                    usedDays: { increment: leave.days },
                    remainingDays: { decrement: leave.days }
                }
            });
        }

        // TODO: Send notification to employee

        res.json({
            success: true,
            message: `Leave request ${status.toLowerCase()} successfully`,
            leave: updatedLeave
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get upcoming leaves (next 30 days) for dashboard
 * GET /api/leaves/upcoming
 */
export const getUpcomingLeaves = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const days = parseInt(req.query.days as string) || 30;
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);

        console.log('Getting upcoming leaves for next', days, 'days');

        // Build where clause based on role
        let whereClause: any = {
            status: 'APPROVED',
            isActive: true,
            startDate: {
                gte: today,
                lte: futureDate
            }
        };

        // Role-based filtering
        if (req.user?.role === 'MANAGER') {
            // Managers can only see their team members' leaves
            const teams = await prismaClient.team.findMany({
                where: {
                    managerId: req.user.id,
                    companyId: req.companyId,
                    isActive: true
                },
                include: {
                    members: {
                        select: { id: true }
                    }
                }
            });

            const teamMemberIds = teams.flatMap(team => team.members.map(member => member.id));
            whereClause.userId = { in: teamMemberIds };
        } else if (req.user?.role === 'EMPLOYEE') {
            // Employees can only see their own leaves
            whereClause.userId = req.user.id;
        } else {
            // HR/Admin can see all leaves in the company
            whereClause.user = {
                companyId: req.companyId
            };
        }

        const upcomingLeaves = await prismaClient.leave.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        department: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                leaveType: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                startDate: 'asc'
            }
        });

        // Format for dashboard display
        const formattedLeaves = upcomingLeaves.map(leave => {
            const startDate = new Date(leave.startDate);
            const daysUntil = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            return {
                id: leave.id,
                userName: leave.user.name,
                userRole: leave.user.role,
                department: leave.user.department?.name,
                leaveType: leave.leaveType.name,
                startDate: leave.startDate,
                endDate: leave.endDate,
                days: leave.days,
                daysUntil: daysUntil,
                message: `${leave.user.name} will be on ${leave.leaveType.name} on ${startDate.toLocaleDateString()}`
            };
        });

        res.json({
            success: true,
            message: 'Upcoming leaves retrieved successfully',
            leaves: formattedLeaves,
            summary: {
                totalUpcoming: upcomingLeaves.length,
                period: `${days} days`
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get leave status (pending/approved/rejected)
 * GET /api/leaves/status
 */
export const getLeaveStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        console.log('Getting leave status for user:', userId);

        const leaveStats = await prismaClient.leave.groupBy({
            by: ['status'],
            where: {
                userId: userId,
                isActive: true
            },
            _count: {
                status: true
            }
        });

        const statusSummary = leaveStats.reduce((acc, stat) => {
            acc[stat.status.toLowerCase()] = stat._count.status;
            return acc;
        }, {} as Record<string, number>);

        // Get recent leaves
        const recentLeaves = await prismaClient.leave.findMany({
            where: {
                userId: userId,
                isActive: true
            },
            include: {
                leaveType: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                appliedAt: 'desc'
            },
            take: 5
        });

        res.json({
            success: true,
            message: 'Leave status retrieved successfully',
            summary: {
                pending: statusSummary.pending || 0,
                approved: statusSummary.approved || 0,
                rejected: statusSummary.rejected || 0,
                cancelled: statusSummary.cancelled || 0
            },
            recentLeaves: recentLeaves
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Approve leave (Manager/HR/Admin only)
 * PUT /api/leaves/:leaveId/approve
 */
export const approveLeave = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { leaveId } = req.params;
        const { comments } = req.body;
        const approverId = req.user?.id;

        console.log('Approving leave:', leaveId, 'by:', approverId);

        // Check permissions
        if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only managers, HR, and admins can approve leaves',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Get leave request
        const leave = await prismaClient.leave.findFirst({
            where: {
                id: leaveId,
                isActive: true
            },
            include: {
                user: true,
                leaveType: true
            }
        });

        if (!leave) {
            throw new NotFoundException(
                'Leave request not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        if (leave.status !== 'PENDING') {
            throw new BadRequestsException(
                'Leave request has already been processed',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Update leave status
        const updatedLeave = await prismaClient.leave.update({
            where: { id: leaveId },
            data: {
                status: 'APPROVED',
                approvedBy: approverId,
                respondedAt: new Date(),
                comments: comments
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                leaveType: {
                    select: {
                        name: true
                    }
                },
                approver: {
                    select: {
                        name: true,
                        role: true
                    }
                }
            }
        });

        // Update leave balance
        await prismaClient.leaveBalance.updateMany({
            where: {
                userId: leave.userId,
                leaveTypeId: leave.leaveTypeId,
                year: leave.startDate.getFullYear()
            },
            data: {
                usedDays: { increment: leave.days },
                remainingDays: { decrement: leave.days }
            }
        });

        // TODO: Send notification to employee

        res.json({
            success: true,
            message: 'Leave approved successfully',
            leave: updatedLeave
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reject leave (Manager/HR/Admin only)
 * PUT /api/leaves/:leaveId/reject
 */
export const rejectLeave = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { leaveId } = req.params;
        const { comments } = req.body;
        const approverId = req.user?.id;

        console.log('Rejecting leave:', leaveId, 'by:', approverId);

        // Check permissions
        if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user?.role || '')) {
            throw new UnauthorizedException(
                'Only managers, HR, and admins can reject leaves',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            );
        }

        // Get leave request
        const leave = await prismaClient.leave.findFirst({
            where: {
                id: leaveId,
                isActive: true
            }
        });

        if (!leave) {
            throw new NotFoundException(
                'Leave request not found',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        if (leave.status !== 'PENDING') {
            throw new BadRequestsException(
                'Leave request has already been processed',
                ErrorCodes.INTERNAL_EXCEPTION
            );
        }

        // Update leave status
        const updatedLeave = await prismaClient.leave.update({
            where: { id: leaveId },
            data: {
                status: 'REJECTED',
                approvedBy: approverId,
                respondedAt: new Date(),
                comments: comments || 'Leave request rejected'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                leaveType: {
                    select: {
                        name: true
                    }
                },
                approver: {
                    select: {
                        name: true,
                        role: true
                    }
                }
            }
        });

        // TODO: Send notification to employee

        res.json({
            success: true,
            message: 'Leave rejected successfully',
            leave: updatedLeave
        });
    } catch (error) {
        next(error);
    }
};