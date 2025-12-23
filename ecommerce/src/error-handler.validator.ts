import { NextFunction, Request, Response } from "express"
import { HttpException } from "./exceptions/root"
import { InternalException } from "./exceptions/internal-exception"
import { ErrorCodes } from "./exceptions/root"
import { STATUS_CODES } from "http"
import { ZodError } from "zod"
import { BadRequestsException } from "./exceptions/bad_request"
import { UnprocessableEntity } from "./exceptions/validation"

export const errorHandler = (method: Function) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await Promise.resolve(method(req, res, next))
        } catch (error: any) {
            let exception: HttpException

            if (error instanceof HttpException) {
                exception = error
            } else {
                if(error instanceof ZodError){
                    exception = new UnprocessableEntity(
                        'Validation failed',
                        ErrorCodes.UNPROCESSABLE_ENTITY,
                        error.issues
                    )
                } else {
                    exception = new InternalException(
                        'Something went wrong!',
                        error,
                        ErrorCodes.INTERNAL_EXCEPTION
                    )
                }
            }
            console.log("Passing exception to middleware:", {
                message: exception.message,
                statusCode: exception.statusCode,
                errorCode: exception.errorCode
            })
            next(exception)
        }
    }
}