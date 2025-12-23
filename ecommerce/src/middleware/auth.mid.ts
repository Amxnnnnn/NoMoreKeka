import { UnauthorizedException } from "../exceptions/unauthorized.ex";
import { NextFunction, Response,Request } from "express";
import { ErrorCodes } from "../exceptions/root";
import { JWT_SECRET } from "../secret.validator";
import jwt from "jsonwebtoken"; 
import { prismaClient } from "../prisma_connection";


export const authMiddleware = async(
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log("Auth middleware started");
        console.log("Authorization header : ", req.headers.authorization)

        const authHeader = req.headers.authorization

        if (!authHeader) {
            console.log("No authorization header");
            return next(
                new UnauthorizedException(
                    "Unauthorized - No Token provided",
                    ErrorCodes.UNAUTHORIZED_EXCEPTION
                )
            );
        }

        const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : authHeader;

        console.log("Token extracted :", token.substring(0, 20) + "...")

        if (!token) {
            return next(
                new UnauthorizedException(
                    "Unauthorized",
                    ErrorCodes.UNAUTHORIZED_EXCEPTION
                )
            );
        }

        console.log("Token verifying...")
        const payload = jwt.verify(token, JWT_SECRET) as { 
            userId: string, 
            role: string, 
            companyId: string 
        }
        console.log("Token verified , userId:", payload.userId);

        console.log("looking for user with id:", payload.userId)
        const user = await prismaClient.user.findFirst({
            where: { 
                id: payload.userId,
                isActive: true // Only allow active users
            },
            include: {
                company: true
            }
        })

        if (!user) {
            return next(
                new UnauthorizedException(
                    "Unauthorized - User not found or inactive",
                    ErrorCodes.UNAUTHORIZED_EXCEPTION
                )
            );
        }

        // Verify company match (additional security)
        if (user.companyId !== payload.companyId) {
            return next(
                new UnauthorizedException(
                    "Unauthorized - Company mismatch",
                    ErrorCodes.UNAUTHORIZED_EXCEPTION
                )
            );
        }

        console.log("User found:", user.email, "Role:", user.role);
        req.user = user;
        console.log("User attached to request");

        next()

    } catch (error: any) {
        console.log("Auth middleware error:", error.message);
        next(
            new UnauthorizedException(
                'Unauthorized!',
                ErrorCodes.UNAUTHORIZED_EXCEPTION
            )
        )
    }
}