import { UnauthorizedException } from "../exceptions/unauthorized.ex";
import { NextFunction, Response, Request } from "express";
import { ErrorCodes } from "../exceptions/root";
import { Role } from "@prisma/client";

/**
 * Role-based Authorization Middleware System
 * 
 * This module provides comprehensive role-based access control for the HRMS system.
 * It includes middleware for different role levels and permission combinations.
 * 
 * Updated: Added MANAGER role support
 */
 
/**
 * Admin-only middleware
 * Restricts access to ADMIN role only
 */
export const adminMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = req.user;
        
        if (!user) {
            return next(new UnauthorizedException(
                'Unauthorized - No user found', 
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            ));
        }

        if (user.role === 'ADMIN') {
            console.log(`Admin access granted to user: ${user.email}`);
            next();
        } else {
            console.log(`Admin access denied for user: ${user.email} with role: ${user.role}`);
            next(new UnauthorizedException(
                'Unauthorized - Admin access required', 
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            ));
        }
    } catch (error) {
        console.error('Error in admin middleware:', error);
        next(new UnauthorizedException(
            'Unauthorized - Authentication error', 
            ErrorCodes.UNAUTHORIZED_EXCEPTION
        ));
    }
};

/**
 * HR-level middleware
 * Allows ADMIN and HR roles
 */
export const hrMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = req.user;
        
        if (!user) {
            return next(new UnauthorizedException(
                'Unauthorized - No user found', 
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            ));
        }

        const allowedRoles: Role[] = ['ADMIN', 'HR'];
        
        if (allowedRoles.includes(user.role)) {
            console.log(`HR-level access granted to user: ${user.email} with role: ${user.role}`);
            next();
        } else {
            console.log(`HR-level access denied for user: ${user.email} with role: ${user.role}`);
            next(new UnauthorizedException(
                'Unauthorized - HR or Admin access required', 
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            ));
        }
    } catch (error) {
        console.error('Error in HR middleware:', error);
        next(new UnauthorizedException(
            'Unauthorized - Authentication error', 
            ErrorCodes.UNAUTHORIZED_EXCEPTION
        ));
    }
};

/**
 * Manager-level middleware
 * Allows ADMIN, HR, and MANAGER roles
 */
export const managerMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = req.user;
        
        if (!user) {
            return next(new UnauthorizedException(
                'Unauthorized - No user found', 
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            ));
        }

        const allowedRoles: Role[] = ['ADMIN', 'HR', 'MANAGER'];
        
        if (allowedRoles.includes(user.role)) {
            console.log(`Manager-level access granted to user: ${user.email} with role: ${user.role}`);
            next();
        } else {
            console.log(`Manager-level access denied for user: ${user.email} with role: ${user.role}`);
            next(new UnauthorizedException(
                'Unauthorized - Manager, HR or Admin access required', 
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            ));
        }
    } catch (error) {
        console.error('Error in manager middleware:', error);
        next(new UnauthorizedException(
            'Unauthorized - Authentication error', 
            ErrorCodes.UNAUTHORIZED_EXCEPTION
        ));
    }
};

/**
 * Manager-level middleware
 * Allows ADMIN, HR, and EMPLOYEE roles (all authenticated users)
 * Note: In most HRMS systems, employees can view their own data
 */
export const employeeMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = req.user;
        
        if (!user) {
            return next(new UnauthorizedException(
                'Unauthorized - No user found', 
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            ));
        }

        // All authenticated users can access employee-level resources
        const allowedRoles: Role[] = ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'];
        
        if (allowedRoles.includes(user.role)) {
            console.log(`Employee-level access granted to user: ${user.email} with role: ${user.role}`);
            next();
        } else {
            console.log(`Employee-level access denied for user: ${user.email} with role: ${user.role}`);
            next(new UnauthorizedException(
                'Unauthorized - Valid user role required', 
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            ));
        }
    } catch (error) {
        console.error('Error in employee middleware:', error);
        next(new UnauthorizedException(
            'Unauthorized - Authentication error', 
            ErrorCodes.UNAUTHORIZED_EXCEPTION
        ));
    }
};

/**
 * Flexible role-based middleware factory
 * Creates middleware that allows specific roles
 * 
 * @param allowedRoles - Array of roles that should have access
 * @returns Middleware function
 */
export const roleMiddleware = (allowedRoles: Role[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user;
            
            if (!user) {
                return next(new UnauthorizedException(
                    'Unauthorized - No user found', 
                    ErrorCodes.UNAUTHORIZED_EXCEPTION
                ));
            }

            if (allowedRoles.includes(user.role)) {
                console.log(`Role-based access granted to user: ${user.email} with role: ${user.role}`);
                next();
            } else {
                console.log(`Role-based access denied for user: ${user.email} with role: ${user.role}. Required roles: ${allowedRoles.join(', ')}`);
                next(new UnauthorizedException(
                    `Unauthorized - Required roles: ${allowedRoles.join(', ')}`, 
                    ErrorCodes.UNAUTHORIZED_EXCEPTION
                ));
            }
        } catch (error) {
            console.error('Error in role middleware:', error);
            next(new UnauthorizedException(
                'Unauthorized - Authentication error', 
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            ));
        }
    };
};

/**
 * Self-access middleware
 * Allows users to access their own resources or admins/HR to access any resource
 * 
 * @param userIdParam - The parameter name in the request that contains the user ID (default: 'userId')
 * @returns Middleware function
 */
export const selfOrAdminMiddleware = (userIdParam: string = 'userId') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user;
            
            if (!user) {
                return next(new UnauthorizedException(
                    'Unauthorized - No user found', 
                    ErrorCodes.UNAUTHORIZED_EXCEPTION
                ));
            }

            const targetUserId = req.params[userIdParam] || req.body[userIdParam] || req.query[userIdParam];
            
            // Admin and HR can access any user's data
            if (user.role === 'ADMIN' || user.role === 'HR') {
                console.log(`Admin/HR access granted to user: ${user.email} for target user: ${targetUserId}`);
                next();
                return;
            }

            // Users can only access their own data
            if (user.id === targetUserId) {
                console.log(`Self-access granted to user: ${user.email}`);
                next();
            } else {
                console.log(`Self-access denied for user: ${user.email} trying to access user: ${targetUserId}`);
                next(new UnauthorizedException(
                    'Unauthorized - You can only access your own resources', 
                    ErrorCodes.UNAUTHORIZED_EXCEPTION
                ));
            }
        } catch (error) {
            console.error('Error in self-or-admin middleware:', error);
            next(new UnauthorizedException(
                'Unauthorized - Authentication error', 
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            ));
        }
    };
};

/**
 * Company isolation middleware
 * Ensures users can only access resources within their company
 * This is crucial for multi-tenant HRMS systems
 */
export const companyIsolationMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = req.user;
        
        if (!user) {
            return next(new UnauthorizedException(
                'Unauthorized - No user found', 
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            ));
        }

        // Add company ID to request for use in controllers
        req.companyId = user.companyId;
        
        console.log(`Company isolation applied for user: ${user.email}, company: ${user.companyId}`);
        next();
    } catch (error) {
        console.error('Error in company isolation middleware:', error);
        next(new UnauthorizedException(
            'Unauthorized - Company verification error', 
            ErrorCodes.UNAUTHORIZED_EXCEPTION
        ));
    }
};

// Export default as adminMiddleware for backward compatibility
export default adminMiddleware;