import { UnauthorizedException } from '../exceptions/unauthorized.ex';
import { ErrorCodes } from '../exceptions/root';

/**
 * Validation Utilities
 * 
 * Common validation functions used across controllers
 */

/**
 * Validate that companyId exists in the request
 * Throws UnauthorizedException if not found
 * 
 * @param companyId - The company ID from req.companyId
 * @param context - Optional context for logging (e.g., 'getAllUsers')
 * @returns The validated companyId
 */
export function validateCompanyId(companyId: string | undefined, context?: string): string {
    if (!companyId) {
        const message = context 
            ? `Company ID not found in ${context}`
            : 'Company ID not found';
        
        console.error(`❌ Validation Error: ${message}`);
        
        throw new UnauthorizedException(
            'Unauthorized - Company ID not found',
            ErrorCodes.UNAUTHORIZED_EXCEPTION
        );
    }
    
    return companyId;
}

/**
 * Validate that userId exists in the request
 * Throws UnauthorizedException if not found
 * 
 * @param userId - The user ID from req.user?.id
 * @param context - Optional context for logging
 * @returns The validated userId
 */
export function validateUserId(userId: string | undefined, context?: string): string {
    if (!userId) {
        const message = context 
            ? `User ID not found in ${context}`
            : 'User ID not found';
        
        console.error(`❌ Validation Error: ${message}`);
        
        throw new UnauthorizedException(
            'Unauthorized - User ID not found',
            ErrorCodes.UNAUTHORIZED_EXCEPTION
        );
    }
    
    return userId;
}

/**
 * Validate both companyId and userId
 * 
 * @param companyId - The company ID from req.companyId
 * @param userId - The user ID from req.user?.id
 * @param context - Optional context for logging
 * @returns Object with validated companyId and userId
 */
export function validateCompanyAndUser(
    companyId: string | undefined, 
    userId: string | undefined,
    context?: string
): { companyId: string; userId: string } {
    return {
        companyId: validateCompanyId(companyId, context),
        userId: validateUserId(userId, context)
    };
}
