import { HttpException, ErrorCodes } from "./root";

export class UnprocessableEntity extends HttpException {
    constructor(message: string, errorCode: ErrorCodes, errors?: any) {
        super(message, errorCode, 422, errors);
    }
}