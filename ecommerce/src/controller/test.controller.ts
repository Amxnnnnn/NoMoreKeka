import { NextFunction, Request, Response } from 'express';

/**
 * Test Controller for Role-based Access Control
 * 
 * These endpoints are for testing different permission levels
 */

/**
 * Test endpoint for Admin-only access
 * GET /api/test/admin-only
 */
export const testAdminOnly = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        res.json({
            success: true,
            message: 'Admin access granted successfully!',
            user: {
                id: req.user?.id,
                email: req.user?.email,
                role: req.user?.role,
                companyId: req.user?.companyId
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Test endpoint for HR-level access (Admin + HR)
 * GET /api/test/hr-level
 */
export const testHRLevel = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        res.json({
            success: true,
            message: 'HR-level access granted successfully!',
            user: {
                id: req.user?.id,
                email: req.user?.email,
                role: req.user?.role,
                companyId: req.user?.companyId
            },
            companyId: req.companyId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Test endpoint for Employee-level access (All authenticated users)
 * GET /api/test/employee-level
 */
export const testEmployeeLevel = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        res.json({
            success: true,
            message: 'Employee-level access granted successfully!',
            user: {
                id: req.user?.id,
                email: req.user?.email,
                role: req.user?.role,
                companyId: req.user?.companyId
            },
            companyId: req.companyId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Test endpoint for self-access (Users can only access their own data)
 * GET /api/test/self-access/:userId
 */
export const testSelfAccess = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { userId } = req.params;
        
        res.json({
            success: true,
            message: 'Self-access granted successfully!',
            requestedUserId: userId,
            currentUser: {
                id: req.user?.id,
                email: req.user?.email,
                role: req.user?.role,
                companyId: req.user?.companyId
            },
            companyId: req.companyId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
};