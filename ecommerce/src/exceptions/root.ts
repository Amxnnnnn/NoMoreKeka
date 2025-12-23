// Structure of the Error handling (Things needed to check and identify proper error) :- Message, status code , error codes, error.

export class HttpException extends Error{
    message: string;
    errorCode:any;
    statusCode:number;
    errors:any;

    constructor(message:string, errorCode:any, statusCode:number, error:any) {
        super(message) // super constructor is for initialization of extended parent's properties in child class (must called before accessing this.[properties of child])
        this.message = message
        this.errorCode = errorCode // my custom error
        this.statusCode = statusCode //http error codes
        this.errors = error
    }
}

export enum ErrorCodes {
    USER_NOT_FOUND = 1001,
    USER_ALREADY_EXIST = 1002,
    INCORRECT_PASSWORD = 1003,
    // ADDRESS_NOT_FOUND=1004,
    UNPROCESSABLE_ENTITY = 2002,
    INTERNAL_EXCEPTION=3000,
    UNAUTHORIZED_EXCEPTION=4001,
    // ADDRESS_DOES_NOT_BELONG = 1005,
    
    // ORDER_NOT_FOUND=6001,
    
    // PRODUCT_NOT_FOUND=5001,
}