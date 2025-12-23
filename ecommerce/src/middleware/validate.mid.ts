import { NextFunction, Request, Response } from "express";
import { ZodSchema, ZodError } from "zod";
import { UnprocessableEntity } from "../exceptions/validation";
import { ErrorCodes } from "../exceptions/root";

export const validate = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validated = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            }) as any ; // frustated to use this 

           req.body = validated.body || req.body

            next();
        } catch (error) {
            console.log("Validation Error : ", error)
            
            if(error instanceof ZodError){
                const validationError = new UnprocessableEntity(
                    'Validation failed',
                    ErrorCodes.UNPROCESSABLE_ENTITY
                    ,error.issues
                );
                return next(validationError)
            }
            next(error);
        }
    };
    };