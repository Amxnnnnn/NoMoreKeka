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
    console.log("Status Code:",error.statusCode)
    console.log("Error agyi oyee!")

    const statusCode = error.statusCode || 500;
    const errorCode = error.errorCode || "Internal_Error";
    const message = error.message || 'Somethings went wrong';


    res.status(error.statusCode).json({
        message: error.message,
        errorCode: error.errorCode,
        errors: error.errors
    });
}