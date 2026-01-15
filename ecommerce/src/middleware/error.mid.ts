import { NextFunction, Request, Response } from "express"
import { HttpException } from "../exceptions/root";

export const errorMiddleware = (
    error: HttpException ,
    req:Request,
    res:Response,
    next:NextFunction
): void =>{

    console.log("Error caught in middleware!")
    console.log("Error", error)
    console.log("Message:",error.message)
    console.log("Status code:",error.statusCode)
    console.log("Error agyi oyee!")

    const statusCode = error.statusCode || 500;
    const errorCode = error.errorCode || "INTERNAL_ERROR";
    const message = error.message || 'Something went wrong';

    res.status(statusCode).json({
        success: false,
        message: message,
        errorCode: errorCode,
        errors: error.errors || [],
        timestamp: new Date().toISOString()
    });
}